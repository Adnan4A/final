import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  showNumber = false,
  className
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starRating: number) => {
    if (readonly || !onRatingChange) return;
    onRatingChange(starRating);
  };

  const handleStarHover = (starRating: number) => {
    if (readonly) return;
    setHoveredRating(starRating);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoveredRating(0);
  };

  const displayRating = hoveredRating > 0 ? hoveredRating : rating;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.floor(displayRating);
          const isHalfFilled = star === Math.ceil(displayRating) && displayRating % 1 !== 0;
          
          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              className={cn(
                "relative transition-colors",
                readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
                sizeClasses[size]
              )}
              data-testid={`star-${star}`}
            >
              <Star
                className={cn(
                  "absolute inset-0 transition-colors",
                  isFilled || isHalfFilled 
                    ? "fill-white text-white" 
                    : "fill-transparent text-gray-400",
                  !readonly && "hover:text-white/80"
                )}
              />
              {isHalfFilled && (
                <Star
                  className={cn(
                    "absolute inset-0 transition-colors fill-white text-white",
                    sizeClasses[size]
                  )}
                  style={{
                    clipPath: `polygon(0 0, ${(displayRating % 1) * 100}% 0, ${(displayRating % 1) * 100}% 100%, 0 100%)`
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      
      {showNumber && (
        <span className="ml-2 text-sm text-gray-400">
          {rating > 0 ? rating.toFixed(1) : 'No rating'}
        </span>
      )}
    </div>
  );
}

export default StarRating;