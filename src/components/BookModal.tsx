import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { Star, StarOff } from 'lucide-react';
import { toggleFavoriteBook } from '@/lib/favorite';
import { toast } from '@/hooks/use-toast';

interface BookModalProps {
  open: boolean;
  bookId: string | null;
  onClose: () => void;
  onAddToLibrary?: () => void;
}

export const BookModal = ({ open, bookId, onClose, onAddToLibrary }: BookModalProps) => {
  const { user } = useAuth();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [favorite, setFavorite] = useState<boolean>(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

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

  // Fetch favorite status for this user/book
  const fetchFavoriteStatus = async () => {
    try {
      if (open && bookId && user) {
        setFavoriteLoading(true);
        const { data, error } = await supabase
          .from('user_books')
          .select('id, favorite')
          .eq('user_id', user.id)
          .eq('book_id', bookId)
          .maybeSingle();
        if (error) {
          console.error('Fetch favorite error:', error);
          toast({ title: 'Error', description: 'Failed to fetch favorite status.' });
        }
        setFavorite(!!data?.favorite);
        setFavoriteId(data?.id || null);
        setFavoriteLoading(false);
        console.log('Fetched favorite:', data);
      } else {
        setFavorite(false);
        setFavoriteId(null);
      }
    } catch (err) {
      console.error('Fetch favorite exception:', err);
      toast({ title: 'Error', description: 'Exception fetching favorite status.' });
    }
  };

  useEffect(() => {
    fetchFavoriteStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bookId, user]);

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!user || !bookId || !book) return;
    setFavoriteLoading(true);
    try {
      const { result, errorMessage } = await toggleFavoriteBook({
        userId: user.id,
        bookId,
        currentFavorite: favorite,
        bookTitle: book.title,
        bookAuthor: book.authors?.name,
      });
      console.log('Toggle favorite result:', result, errorMessage);
      if (result === 'favorited') {
        toast({ title: 'Book Favorited', description: 'Book added to your favorites.' });
      } else if (result === 'unfavorited') {
        toast({ title: 'Book Unfavorited', description: 'Book removed from your favorites.' });
      } else if (result === 'removed') {
        toast({ title: 'Book Removed', description: 'Book removed from your reading list.' });
      } else {
        toast({ title: 'Error', description: errorMessage || 'Failed to update favorite status.' });
        if (errorMessage) console.error('Supabase error:', errorMessage);
      }
      await fetchFavoriteStatus();
    } catch (err) {
      console.error('Toggle favorite exception:', err);
      toast({ title: 'Error', description: 'Exception toggling favorite status.' });
    }
    setFavoriteLoading(false);
  };

  // Add to Library handler
  const handleAddToLibrary = async () => {
    if (!user || !bookId || !book) return;
    try {
      // 1. Ensure author exists
      let authorId = null;
      if (book.authors?.name) {
        const { data: authorData, error: authorError } = await supabase
          .from('authors')
          .select('id')
          .eq('name', book.authors.name)
          .maybeSingle();
        if (authorError) throw authorError;
        if (authorData && authorData.id) {
          authorId = authorData.id;
        } else {
          const { data: newAuthor, error: authorInsertError } = await supabase
            .from('authors')
            .insert({ name: book.authors.name })
            .select('id')
            .single();
          if (authorInsertError) throw authorInsertError;
          authorId = newAuthor.id;
        }
      }
      // 2. Ensure book exists
      let realBookId = bookId;
      const { data: bookData, error: bookFetchError } = await supabase
        .from('books')
        .select('id')
        .eq('id', bookId)
        .maybeSingle();
      if (bookFetchError) throw bookFetchError;
      if (!bookData && book.title && authorId) {
        const { data: newBook, error: bookInsertError } = await supabase
          .from('books')
          .insert({ title: book.title, author_id: authorId })
          .select('id')
          .single();
        if (bookInsertError) throw bookInsertError;
        realBookId = newBook.id;
      }
      // 3. Add to user_books if not already present
      const { data: userBook, error: userBookFetchError } = await supabase
        .from('user_books')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', realBookId)
        .maybeSingle();
      if (userBookFetchError) throw userBookFetchError;
      if (userBook && userBook.id) {
        toast({ title: 'Already in Library', description: 'This book is already in your reading list.' });
        return;
      }
      const { error: insertError } = await supabase
        .from('user_books')
        .insert({
          user_id: user.id,
          book_id: realBookId,
          status: 'planned',
          favorite: false,
        });
      if (insertError) throw insertError;
      toast({ title: 'Book Added', description: 'Book added to your "To Be Read" list.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add book to library.' });
    }
  };

  if (!open || !bookId) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto border-2 border-slate-300 bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-slate-900 flex items-center gap-2">
            Book
            {user && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                aria-label={favorite ? 'Unfavorite' : 'Favorite'}
              >
                {favorite ? <Star className="text-yellow-400 fill-yellow-400" /> : <StarOff className="text-slate-400" />}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-slate-700">Loading...</div>
        ) : book ? (
          <>
            <h2 className="font-serif text-2xl text-slate-900 mb-2">{book.title}</h2>
            <div className="text-slate-700 mb-4">by {book.authors?.name || 'Unknown Author'}</div>
            <Button className="w-full bg-slate-700 hover:bg-slate-800 text-white" onClick={handleAddToLibrary}>Add to Library</Button>
          </>
        ) : (
          <div className="text-slate-700">Book not found.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 