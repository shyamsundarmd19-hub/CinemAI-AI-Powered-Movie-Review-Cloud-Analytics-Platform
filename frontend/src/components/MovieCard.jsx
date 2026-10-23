import React from 'react';
import { Link } from 'react-router-dom';
import { Film, User, Calendar } from 'lucide-react';
import { StarRating } from './StarRating';
import { SentimentBar } from './SentimentBar';

export const MovieCard = ({ movie }) => {
  const analytics = movie.analytics || {
    total_reviews: 0,
    avg_rating: 0,
    positive_pct: 0,
    neutral_pct: 0,
    negative_pct: 0,
  };

  const defaultPoster = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";

  return (
    <div className="group bg-[#FFFBEB] border border-[#FECDD3] rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#E11D48] transition-all duration-300 flex flex-col justify-between">
      {/* Poster Image Container */}
      <div className="relative aspect-[16/10] sm:aspect-[3/4] overflow-hidden bg-[#FEFCE8]">
        <img
          src={movie.poster_s3_url || defaultPoster}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultPoster;
          }}
        />
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#881337]/70 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Year & Genre Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#FFFBEB]/90 text-[#881337] backdrop-blur-sm border border-[#FECDD3] shadow-sm">
            {movie.release_year}
          </span>
        </div>

        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-between items-end">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FFE4E6]/95 text-[#881337] border border-[#FCA5A5] backdrop-blur-sm">
            {movie.genre}
          </span>
        </div>
      </div>

      {/* Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="text-base font-bold text-[#881337] line-clamp-1 group-hover:text-[#E11D48] transition-colors">
            {movie.title}
          </h3>
          <p className="text-xs text-[#9F1239] flex items-center gap-1 mt-0.5">
            <User className="w-3 h-3 text-[#E11D48]" />
            <span>Dir. {movie.director}</span>
          </p>
        </div>

        <p className="text-xs text-[#713F12] line-clamp-2 leading-relaxed">
          {movie.synopsis}
        </p>

        {/* Rating and Reviews Count */}
        <div className="pt-2 border-t border-[#FECDD3] flex items-center justify-between">
          <StarRating rating={analytics.avg_rating} size="w-3.5 h-3.5" />
          <span className="text-[11px] text-[#9F1239] font-medium">
            {analytics.total_reviews} {analytics.total_reviews === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        {/* Live AI Sentiment Breakdown Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-semibold text-[#881337]">
            <span>AI Sentiment Pulse</span>
            <span className="text-[#E11D48]">
              {analytics.total_reviews > 0 ? `${analytics.positive_pct}% Positive` : 'No reviews'}
            </span>
          </div>
          <SentimentBar
            positive={analytics.positive_pct}
            neutral={analytics.neutral_pct}
            negative={analytics.negative_pct}
            total={analytics.total_reviews}
            compact={true}
          />
        </div>

        {/* Action Link */}
        <Link
          to={`/movie/${movie.id}`}
          className="mt-2 block w-full text-center py-2 px-3 text-xs font-bold rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-sm shadow-[#FECDD3] transition-colors"
        >
          View Analysis & Reviews &rarr;
        </Link>
      </div>
    </div>
  );
};
