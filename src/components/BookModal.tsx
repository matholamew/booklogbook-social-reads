import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { LottieAnimation } from '@/components/ui/lottie-animation';
import { useAnimation } from '@/hooks/useAnimation';
import starAnimation from '../../public/animations/star.json';

interface BookModalProps {
  open: boolean;
  bookId: string | null;
  onClose: () => void;
  onAddToLibrary?: () => void;
}

export const BookModal = ({ open, bookId, onClose, onAddToLibrary }: BookModalProps) => {
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userBook, setUserBook] = useState<any>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { user } = useAuth();

  const {
    lottieRef: starLottieRef,
    play: playStar,
    stop: stopStar,
    handleMouseEnter: handleStarMouseEnter,
    handleMouseLeave: handleStarMouseLeave,
    handleComplete: handleStarComplete
  } = useAnimation({ autoplay: false, loop: false });

  // Fetch book info
  useEffect(() => {
    if (open && bookId) {
      setLoading(true);
      supabase
        .from('books')
        .select('id, title, authors (name)')
        .eq('id', bookId)
        .single()
        .then(({ data }) => {
          setBook(data);
          setLoading(false);
        });
    }
    if (!open) setBook(null);
  }, [open, bookId]);

  // Fetch user_book info for favorite state
  useEffect(() => {
    if (open && bookId && user) {
      supabase
        .from('user_books')
        .select('id, favorite')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .single()
        .then(({ data }) => {
          setUserBook(data);
        });
    } else {
      setUserBook(null);
    }
  }, [open, bookId, user]);

  const handleToggleFavorite = async () => {
    if (!user || !bookId || !userBook) return;
    setFavoriteLoading(true);
    const newFavorite = !userBook.favorite;
    const { error } = await supabase
      .from('user_books')
      .update({ favorite: newFavorite })
      .eq('id', userBook.id);
    if (!error) {
      setUserBook({ ...userBook, favorite: newFavorite });
      playStar();
    }
    setFavoriteLoading(false);
  };

  if (!open || !bookId) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto border-2 border-slate-300 bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-slate-900 flex items-center gap-2">
            Book
            {userBook && (
              <button
                type="button"
                className="ml-2 p-1 rounded-full border border-slate-200 bg-white hover:bg-yellow-100 transition"
                aria-label={userBook.favorite ? 'Unfavorite' : 'Favorite'}
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                onMouseEnter={handleStarMouseEnter}
                onMouseLeave={handleStarMouseLeave}
              >
                <LottieAnimation
                  lottieRef={starLottieRef}
                  animationData={starAnimation}
                  width={28}
                  height={28}
                  style={{ filter: userBook.favorite ? 'drop-shadow(0 0 4px #facc15)' : 'none' }}
                  onComplete={handleStarComplete}
                />
              </button>
            )}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-slate-700">Loading...</div>
        ) : book ? (
          <>
            <h2 className="font-serif text-2xl text-slate-900 mb-2">{book.title}</h2>
            <div className="text-slate-700 mb-4">by {book.authors?.name || 'Unknown Author'}</div>
            <Button className="w-full bg-slate-700 hover:bg-slate-800 text-white" onClick={onAddToLibrary}>Add to Library</Button>
          </>
        ) : (
          <div className="text-slate-700">Book not found.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 