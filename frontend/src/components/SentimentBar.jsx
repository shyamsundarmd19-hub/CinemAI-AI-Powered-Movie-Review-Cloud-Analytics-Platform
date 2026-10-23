import React from 'react';
import { Smile, Meh, Frown } from 'lucide-react';

export const SentimentBar = ({ positive = 0, neutral = 0, negative = 0, total = 0, compact = false }) => {
  const hasData = total > 0 || (positive + neutral + negative > 0);

  // If no reviews, show placeholder
  if (!hasData) {
    return (
      <div className="w-full">
        <div className="h-2 w-full bg-[#FFFBEB] rounded-full border border-[#FECDD3] overflow-hidden">
          <div className="h-full bg-[#FECDD3] w-full opacity-40"></div>
        </div>
        {!compact && (
          <p className="text-[11px] text-[#9F1239] mt-1 italic">No sentiment analysis data yet</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-1.5">
      {/* 3-segment progress bar */}
      <div className="h-2.5 w-full bg-[#FFFBEB] rounded-full border border-[#FECDD3] flex overflow-hidden shadow-inner">
        {positive > 0 && (
          <div
            style={{ width: `${positive}%` }}
            title={`Positive: ${positive}%`}
            className="h-full bg-amber-400 transition-all duration-500 ease-out"
          />
        )}
        {neutral > 0 && (
          <div
            style={{ width: `${neutral}%` }}
            title={`Neutral: ${neutral}%`}
            className="h-full bg-[#FCD34D] transition-all duration-500 ease-out"
          />
        )}
        {negative > 0 && (
          <div
            style={{ width: `${negative}%` }}
            title={`Negative: ${negative}%`}
            className="h-full bg-[#FB7185] transition-all duration-500 ease-out"
          />
        )}
      </div>

      {/* Sentiment labels and percentages */}
      {!compact && (
        <div className="flex items-center justify-between text-[11px] font-medium pt-0.5">
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
            <Smile className="w-3 h-3 text-amber-700" />
            {positive}% Pos
          </span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            <Meh className="w-3 h-3 text-amber-600" />
            {neutral}% Neu
          </span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
            <Frown className="w-3 h-3 text-rose-700" />
            {negative}% Neg
          </span>
        </div>
      )}
    </div>
  );
};

export const SentimentBadge = ({ label, score }) => {
  let badgeStyle = "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]";
  let Icon = Meh;

  if (label === "Positive") {
    badgeStyle = "bg-amber-100 text-amber-900 border-amber-300 font-semibold";
    Icon = Smile;
  } else if (label === "Negative") {
    badgeStyle = "bg-rose-100 text-rose-800 border-rose-200 font-semibold";
    Icon = Frown;
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${badgeStyle} shadow-sm`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      {score !== undefined && (
        <span className="opacity-80 font-mono text-[10px]">
          ({score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2)})
        </span>
      )}
    </span>
  );
};
