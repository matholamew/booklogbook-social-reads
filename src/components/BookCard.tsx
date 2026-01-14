import { Calendar, User as UserIcon, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Book {
  id: string;
  title: string;
  author: string;
  dateStarted?: string;
  dateFinished?: string;
  notes?: string;
  status: 'reading' | 'finished' | 'planned' | 'did_not_finish';
  favorite?: boolean;
  coverUrl?: string;
  currentPage?: number;
  pageCount?: number;
  progressPercent?: number;
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

console.log('🔥🔥🔥 BookCard.tsx MODULE LOADED - BUILD:', new Date().toISOString());

export const BookCard = ({ book, onClick }: BookCardProps) => {
  // Use correct placeholder path (not /public/placeholder.svg)
  const displayCoverUrl = book.coverUrl || '/placeholder.svg';
  
  console.log('🔥 BookCard:', book.title, '| coverUrl:', book.coverUrl, '| display:', displayCoverUrl);
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
      className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer border-2 border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.98] active:shadow-md"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `View details for ${book.title}` : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <CardContent className="p-4 flex gap-4 items-start">
        <img
          src={displayCoverUrl}
          alt={book.title + ' cover'}
          className="w-16 h-24 object-cover rounded shadow border border-slate-200 bg-white flex-shrink-0"
        />
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-3">
            <Badge className={`${getStatusColor(book.status)} transition-all duration-200 font-medium text-xs`}>
              {getStatusText(book.status)}
            </Badge>
            {book.favorite && (
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 ml-2" />
            )}
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

          {book.status === 'reading' && book.pageCount && book.pageCount > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span>Progress</span>
                <span className="font-medium">{book.progressPercent || 0}%</span>
              </div>
              <Progress value={book.progressPercent || 0} className="h-1.5" />
              {book.currentPage !== undefined && (
                <div className="text-xs text-slate-500 mt-0.5">
                  Page {book.currentPage} of {book.pageCount}
                </div>
              )}
            </div>
          )}

          {book.notes && (
            <p className="text-sm text-slate-800 line-clamp-2 mt-2 whitespace-pre-line">
              {book.notes}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
