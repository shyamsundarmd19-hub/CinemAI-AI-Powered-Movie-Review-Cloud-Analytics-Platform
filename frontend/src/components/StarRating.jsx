import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({ rating = 0, onChange, interactive = false, size = "w-4 h-4", showNumber = true }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const filled = starIndex <= displayRating;
          return (
            <button
              key={starIndex}
              type={interactive ? "button" : undefined}
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starIndex)}
              onMouseEnter={() => interactive && setHoverRating(starIndex)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform p-0.5' : 'cursor-default'} focus:outline-none`}
            >
              <Star
                className={`${size} ${
                  filled
                    ? 'fill-amber-400 text-amber-500 drop-shadow-sm'
                    : 'text-[#FECDD3] fill-[#FFFBEB]'
                } transition-colors`}
              />
            </button>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-xs font-bold text-[#881337] ml-1">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
};
