import re
from typing import Dict, Any, List
from app.services.tanglish_dl import analyze_tanglish_sentiment, detect_toxicity

def analyze_review_sentiment(review_text: str) -> Dict[str, Any]:
    """
    Analyzes movie review text using the upgraded TanglishFlix Deep Learning Engine.
    Seamlessly supports both English and South Indian Tanglish movie expressions.
    """
    return analyze_tanglish_sentiment(review_text)
