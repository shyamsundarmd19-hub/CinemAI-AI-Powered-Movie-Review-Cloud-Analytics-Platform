import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Send, ShieldAlert, Film, Smile, Meh, Frown } from 'lucide-react';
import { movieService, reviewService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StarRating } from '../components/StarRating';

// Client-side quick lexicon for real-time live typing feedback
const POSITIVE_WORDS = new Set([
  'great', 'excellent', 'amazing', 'masterpiece', 'brilliant', 'wonderful', 'fantastic',
  'loved', 'love', 'superb', 'flawless', 'best', 'stunning', 'thrilling', 'breathtaking',
  'compelling', 'captivating', 'beautiful', 'triumph', 'perfect', 'exceptional', 'enjoyable'
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'worst', 'boring', 'poor', 'waste', 'disappointing',
  'cliche', 'dull', 'mess', 'unwatchable', 'hate', 'lame', 'sloppy', 'annoying', 'stupid'
]);

const TOXIC_PATTERNS = [
  'kill', 'die', 'kys', 'trash', 'idiot', 'moron', 'bastard', 'bitch', 'asshole', 'fuck', 'shit'
];

export const ReviewSubmissionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/movie/${id}/review`));
      return;
    }

    const fetchMovie = async () => {
      try {
        const data = await movieService.getMovieById(id);
        setMovie(data);
      } catch (err) {
        console.error('Error loading movie:', err);
      }
    };
    fetchMovie();
  }, [id, user, navigate]);

  // Real-time Sentiment & Toxicity Estimator
  const liveSentiment = useMemo(() => {
    if (!reviewText.trim()) {
      return { label: 'Neutral', score: 0, pct: 50, isToxic: false };
    }

    const tokens = reviewText.toLowerCase().match(/\b[a-z']+\b/g) || [];
    let posCount = 0;
    let negCount = 0;

    tokens.forEach((w) => {
      if (POSITIVE_WORDS.has(w)) posCount++;
      if (NEGATIVE_WORDS.has(w)) negCount++;
    });

    const isToxic = TOXIC_PATTERNS.some((pattern) => reviewText.toLowerCase().includes(pattern));

    const totalSentimentWords = posCount + negCount;
    let score = 0;
    if (totalSentimentWords > 0) {
      score = (posCount - negCount) / totalSentimentWords;
    } else {
      score = (rating - 3) / 2; // Fallback estimate based on selected stars
    }

    let label = 'Neutral';
    let pct = 50;

    if (score >= 0.15) {
      label = 'Positive';
      pct = Math.min(99, Math.round(60 + score * 40));
    } else if (score <= -0.15) {
      label = 'Negative';
      pct = Math.min(99, Math.round(60 + Math.abs(score) * 40));
    } else {
      label = 'Neutral';
      pct = 50;
    }

    return { label, score, pct, isToxic };
  }, [reviewText, rating]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim() || reviewText.length < 5) {
      setError('Please write at least 5 characters for your review.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await reviewService.submitReview({
        movie_id: id,
        rating,
        review_text: reviewText.trim(),
      });
      navigate(`/movie/${id}`);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError(err.response?.data?.detail || 'Failed to submit review. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFCE8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          to={`/movie/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#881337] hover:text-[#E11D48] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel & Return to Movie</span>
        </Link>

        {/* Card Container */}
        <div className="bg-[#FFFBEB] border border-[#FECDD3] rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
          {/* Header */}
          <div className="border-b border-[#FECDD3] pb-5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFE4E6] text-[#881337] border border-[#FCA5A5] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
              Automated NLTK/TextBlob Sentiment Engine
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#881337]">
              Submit Review for {movie ? `"${movie.title}"` : 'Movie'}
            </h1>
            <p className="text-xs text-[#713F12] mt-1">
              Your feedback will be processed by CinemAI's NLP sentiment classifier and screened for toxic language.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#FFE4E6] border border-[#FCA5A5] text-[#881337] text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#881337] uppercase tracking-wider">
                Audience Rating (1 - 5 Stars)
              </label>
              <div className="flex items-center gap-3 bg-[#FEFCE8] border border-[#FECDD3] p-3 rounded-xl max-w-xs">
                <StarRating
                  rating={rating}
                  interactive={true}
                  onChange={(val) => setRating(val)}
                  size="w-6 h-6"
                />
                <span className="text-xs font-bold text-[#E11D48]">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            {/* Review Textarea */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-[#881337] uppercase tracking-wider">
                  Your Detailed Review
                </label>
                <span className="text-[11px] text-[#9F1239]">
                  {reviewText.length} characters
                </span>
              </div>

              <textarea
                rows={6}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your thoughts on the direction, screenplay, cinematography, performances, and pacing..."
                className="w-full p-4 text-sm rounded-xl bg-white border border-[#FCA5A5] text-[#881337] placeholder-[#881337]/45 focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/20 transition-all resize-y"
              />
            </div>

            {/* Live Real-time AI Sentiment Analyzer Preview Card */}
            <div className="bg-[#FEFCE8] border border-[#FECDD3] rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#881337]">
                  <Sparkles className="w-4 h-4 text-[#E11D48]" />
                  <span>Real-time AI Sentiment Preview</span>
                </div>
                <span className="text-[10px] text-[#9F1239] font-medium">Dynamically evaluates as you type</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {liveSentiment.label === 'Positive' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                    <Smile className="w-4 h-4 text-amber-700" />
                    <span>{liveSentiment.pct}% Positive AI Score</span>
                  </span>
                )}
                {liveSentiment.label === 'Neutral' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                    <Meh className="w-4 h-4 text-amber-600" />
                    <span>Balanced / Neutral Sentiment</span>
                  </span>
                )}
                {liveSentiment.label === 'Negative' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                    <Frown className="w-4 h-4 text-rose-700" />
                    <span>{liveSentiment.pct}% Critical / Negative Score</span>
                  </span>
                )}

                <span className="text-xs text-[#713F12]">
                  Predicted Classification: <b>{liveSentiment.label}</b>
                </span>
              </div>

              {/* Toxicity Detection Banner */}
              {liveSentiment.isToxic && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[#FFE4E6] border border-[#FCA5A5] text-[#881337] text-xs font-medium">
                  <ShieldAlert className="w-4 h-4 text-[#E11D48] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Automated Moderation Warning:</span> Potential toxic language or hostile phrasing detected. Submissions flagged by the backend NLP screen will trigger an alert via AWS SES and be held in the moderation queue.
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end space-x-3">
              <Link
                to={`/movie/${id}`}
                className="px-4 py-2 text-xs font-bold text-[#881337] hover:text-[#E11D48] transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#FECDD3] transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Analyzing & Publishing...' : 'Publish AI-Verified Review'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
