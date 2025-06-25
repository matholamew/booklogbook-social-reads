import { Calendar, User as UserIcon, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LottieAnimation } from '@/components/ui/lottie-animation';
import { useAnimation } from '@/hooks/useAnimation';
import starAnimation from '../../public/animations/star.json';

interface Book {
  id: string;
  title: string;
  author: string;
  dateStarted?: string;
  dateFinished?: string;
  notes?: string;
  status: 'reading' | 'finished' | 'planned' | 'did_not_finish';
  favorite?: boolean;
}

interface BookCardProps {
  book: Book;
  onClick?: () => void;
}

// Helper to parse YYYY-MM-DD as local date
function parseLocalDate(dateString?: string) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export const BookCard = ({ book, onClick }: BookCardProps) => {
  const {
    lottieRef: starLottieRef,
    play: playStar,
    stop: stopStar,
    handleMouseEnter: handleStarMouseEnter,
    handleMouseLeave: handleStarMouseLeave,
    handleComplete: handleStarComplete
  } = useAnimation({ autoplay: false, loop: false });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    // TODO: Implement favorite toggle logic
    if (book.favorite) {
      // Unfavoriting - play animation then remove
      playStar();
    } else {
      // Favoriting - play animation
      playStar();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reading': return 'bg-slate-200 text-slate-900 hover:bg-slate-300 border border-slate-400';
      case 'finished': return 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-800';
      case 'planned': return 'bg-white text-slate-900 hover:bg-slate-100 border border-slate-400';
      case 'did_not_finish': return 'bg-red-100 text-red-800 border border-red-400';
      default: return 'bg-slate-200 text-slate-900 border border-slate-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'reading': return 'Currently Reading';
      case 'finished': return 'Finished';
      case 'planned': return 'To Be Read';
      case 'did_not_finish': return 'Did Not Finish';
      default: return status;
    }
  };

  return (
    <Card 
      className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer border-2 border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.98] active:shadow-md relative"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `View details for ${book.title}` : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      {/* Favorite Star Indicator */}
      <div className="absolute top-2 right-2">
        <button
          type="button"
          className="p-1 rounded-full border border-slate-200 bg-white hover:bg-yellow-100 transition-all duration-200 shadow-sm"
          aria-label={book.favorite ? "Unfavorite this book" : "Favorite this book"}
          onClick={handleFavoriteClick}
          onMouseEnter={handleStarMouseEnter}
          onMouseLeave={handleStarMouseLeave}
        >
          {book.favorite ? (
            <LottieAnimation
              lottieRef={starLottieRef}
              animationData={starAnimation}
              width={20}
              height={20}
              style={{ filter: 'drop-shadow(0 0 4px #facc15)' }}
              onComplete={handleStarComplete}
            />
          ) : (
            <img 
              src="/star.svg" 
              alt="Star" 
              className="w-5 h-5 opacity-60 hover:opacity-100 transition-opacity duration-200"
            />
          )}
        </button>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <Badge className={`${getStatusColor(book.status)} transition-all duration-200 font-medium text-xs`}>
            {getStatusText(book.status)}
          </Badge>
        </div>
        
        <h3 className="font-semibold text-lg text-slate-900 mb-1 line-clamp-2 font-serif">
          {book.title}
        </h3>
        
        <div className="flex items-center text-slate-800 mb-3">
          <UserIcon className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">{book.author}</span>
        </div>

        {(book.dateStarted || book.dateFinished) && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-700 mb-2">
            {book.dateStarted && (
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Started: {parseLocalDate(book.dateStarted)?.toLocaleDateString()}
              </div>
            )}
            {book.dateFinished && (
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Finished: {parseLocalDate(book.dateFinished)?.toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {book.notes && (
          <p className="text-sm text-slate-800 line-clamp-2 mt-2 whitespace-pre-line">
            {book.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
