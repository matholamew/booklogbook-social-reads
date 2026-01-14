import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number | null;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating = ({ rating, onChange, readonly = false, size = 'md' }: StarRatingProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = (starValue: number) => {
    if (readonly || !onChange) return;
    // If clicking same star, remove rating
    if (rating === starValue) {
      onChange(0);
    } else {
      onChange(starValue);
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((starValue) => (
        <button
          key={starValue}
          type="button"
          onClick={() => handleClick(starValue)}
          disabled={readonly}
          className={cn(
            'transition-all duration-150',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          )}
          aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              sizeClasses[size],
              'transition-colors',
              (rating || 0) >= starValue
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-slate-300'
            )}
          />
        </button>
      ))}
    </div>
  );
};