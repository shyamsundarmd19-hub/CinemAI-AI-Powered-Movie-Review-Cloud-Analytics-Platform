import re
from typing import Dict, Any, List
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from textblob import TextBlob

# Initialize VADER Sentiment Analyzer safely with lazy fallback
try:
    _vader_analyzer = SentimentIntensityAnalyzer()
except (LookupError, AttributeError):
    nltk.download('vader_lexicon', quiet=True)
    _vader_analyzer = SentimentIntensityAnalyzer()

# Toxicity dictionary / abusive term patterns for review moderation
TOXIC_KEYWORDS = {
    # Hate speech, extreme vulgarity, abuse, slurs, threats
    "kill yourself", "die", "kys", "hate you", "threat", "violence", 
    "abuse", "idiot", "moron", "scam", "trash", "garbage", "bastard", 
    "bitch", "asshole", "fuck", "shit", "dick", "cunt", "nigger", "faggot"
}

def detect_toxicity(text: str, compound_score: float) -> tuple[bool, List[str]]:
    """
    Checks if review text contains toxic, harassing, or abusive terms,
    or displays extreme aggressive negativity.
    """
    reasons = []
    text_lower = text.lower()

    # Keyword check with word boundaries
    for word in TOXIC_KEYWORDS:
        pattern = r'\b' + re.escape(word) + r'\b'
        if re.search(pattern, text_lower):
            reasons.append(f"Contains prohibited toxic language: '{word}'")

    # Extreme hostility check (excessive capitalization + severe negative sentiment)
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    if caps_ratio > 0.45 and len(text) > 20 and compound_score < -0.6:
        reasons.append("Extreme hostile tone and aggressive formatting detected")

    is_toxic = len(reasons) > 0
    return is_toxic, reasons

def analyze_review_sentiment(review_text: str) -> Dict[str, Any]:
    """
    Analyzes movie review text using a hybrid of NLTK VADER and TextBlob.
    Returns compound sentiment score (-1.0 to +1.0), label, polarity, subjectivity,
    and toxic content flag.
    """
    if not review_text or not review_text.strip():
        return {
            "sentiment_score": 0.0,
            "sentiment_label": "Neutral",
            "polarity": 0.0,
            "subjectivity": 0.0,
            "flag_toxic": False,
            "toxic_reasons": []
        }

    # 1. VADER Sentiment Scoring
    scores = _vader_analyzer.polarity_scores(review_text)
    compound_score = round(float(scores.get("compound", 0.0)), 3)

    # 2. TextBlob Analysis for Polarity & Subjectivity calibration
    blob = TextBlob(review_text)
    polarity = round(float(blob.sentiment.polarity), 3)
    subjectivity = round(float(blob.sentiment.subjectivity), 3)

    # Blend slightly if VADER is borderline neutral but TextBlob has strong opinion
    final_score = compound_score
    if -0.1 < compound_score < 0.1 and abs(polarity) > 0.3:
        final_score = round((compound_score + polarity) / 2.0, 3)

    # 3. Sentiment Label Classification
    if final_score >= 0.05:
        sentiment_label = "Positive"
    elif final_score <= -0.05:
        sentiment_label = "Negative"
    else:
        sentiment_label = "Neutral"

    # 4. Toxicity Moderation Check
    is_toxic, toxic_reasons = detect_toxicity(review_text, final_score)

    return {
        "sentiment_score": final_score,
        "sentiment_label": sentiment_label,
        "polarity": polarity,
        "subjectivity": subjectivity,
        "vader_breakdown": {
            "pos": scores.get("pos", 0.0),
            "neu": scores.get("neu", 0.0),
            "neg": scores.get("neg", 0.0),
        },
        "flag_toxic": is_toxic,
        "toxic_reasons": toxic_reasons
    }
