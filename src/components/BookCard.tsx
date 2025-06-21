
import { Calendar, User as UserIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Book {
  id: string;
  title: string;
  author: string;
  dateStarted?: string;
  dateFinished?: string;
  notes?: string;
  status: 'reading' | 'finished' | 'planned';
}

interface BookCardProps {
  book: Book;
  onClick?: () => void;
}

export const BookCard = ({ book, onClick }: BookCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reading': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'finished': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'planned': return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'reading': return 'Currently Reading';
      case 'finished': return 'Finished';
      case 'planned': return 'Want to Read';
      default: return status;
    }
  };

  return (
    <Card 
      className="book-card-shadow transition-all duration-200 hover:scale-[1.02] cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <Badge className={`${getStatusColor(book.status)} transition-colors`}>
            {getStatusText(book.status)}
          </Badge>
        </div>
        
        <h3 className="font-semibold text-lg text-slate-900 mb-1 line-clamp-2 font-serif">
          {book.title}
        </h3>
        
        <div className="flex items-center text-slate-600 mb-3">
          <UserIcon className="h-4 w-4 mr-1" />
          <span className="text-sm">{book.author}</span>
        </div>

        {(book.dateStarted || book.dateFinished) && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-600 mb-2">
            {book.dateStarted && (
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Started: {new Date(book.dateStarted).toLocaleDateString()}
              </div>
            )}
            {book.dateFinished && (
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Finished: {new Date(book.dateFinished).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {book.notes && (
          <p className="text-sm text-slate-700 line-clamp-2 mt-2">
            {book.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
