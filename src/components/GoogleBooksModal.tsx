import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { Star, StarOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface GoogleBooksModalProps {
  open: boolean;
  book: any | null;
  onClose: () => void;
}

export const GoogleBooksModal = ({ open, book, onClose }: GoogleBooksModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [favorite, setFavorite] = useState<boolean>(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch favorite status for this user/book (by ISBN)
  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (open && user && book?.isbn) {
        setFavoriteLoading(true);
        const { data, error } = await supabase
          .from('user_books')
          .select('id, favorite, book_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!error && data && data.favorite && data.book_id) {
          // Optionally, you could check if the book_id matches a book with this ISBN
          setFavorite(!!data.favorite);
        } else {
          setFavorite(false);
        }
        setFavoriteLoading(false);
      } else {
        setFavorite(false);
      }
    };
    fetchFavoriteStatus();
  }, [open, user, book]);

  // Toggle favorite handler (by ISBN)
  const handleToggleFavorite = async () => {
    if (!user || !book?.isbn) return;
    setFavoriteLoading(true);
    try {
      // Find the book by ISBN
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('id')
        .eq('isbn', book.isbn)
        .maybeSingle();
      if (bookError || !bookData?.id) throw bookError || new Error('Book not found');
      // Find user_book
      const { data: userBook, error: userBookError } = await supabase
        .from('user_books')
        .select('id, favorite')
        .eq('user_id', user.id)
        .eq('book_id', bookData.id)
        .maybeSingle();
      if (userBookError) throw userBookError;
      if (userBook && userBook.id) {
        // Toggle favorite
        const { error: updateError } = await supabase
          .from('user_books')
          .update({ favorite: !userBook.favorite })
          .eq('id', userBook.id);
        if (updateError) throw updateError;
        setFavorite(!userBook.favorite);
      } else {
        // Insert as favorite if not present
        const { error: insertError } = await supabase
          .from('user_books')
          .insert({ user_id: user.id, book_id: bookData.id, favorite: true, status: 'planned' });
        if (insertError) throw insertError;
        setFavorite(true);
      }
      toast({ title: favorite ? 'Book Unfavorited' : 'Book Favorited', description: favorite ? 'Book removed from your favorites.' : 'Book added to your favorites.' });
      queryClient.invalidateQueries({ queryKey: ['user-books', user.id] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update favorite status.' });
    }
    setFavoriteLoading(false);
  };

  // Add to Library handler
  const handleAddToLibrary = async () => {
    if (!user || !book) return;
    
    setLoading(true);
    try {
      // 1. Ensure author exists
      let authorId = null;
      const authorName = book.authors && book.authors.length > 0 ? book.authors[0] : 'Unknown Author';
      
      if (authorName) {
        const { data: authorData, error: authorError } = await supabase
          .from('authors')
          .select('id')
          .eq('name', authorName)
          .maybeSingle();
        if (authorError) throw authorError;
        if (authorData && authorData.id) {
          authorId = authorData.id;
        } else {
          const { data: newAuthor, error: authorInsertError } = await supabase
            .from('authors')
            .insert({ name: authorName })
            .select('id')
            .single();
          if (authorInsertError) throw authorInsertError;
          authorId = newAuthor.id;
        }
      }

      // 2. Ensure book exists
      let bookId = null;
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .insert({
          title: book.title,
          author_id: authorId,
          cover_image_url: book.coverUrl,
          description: book.description,
          page_count: book.pageCount,
          published_date: book.publishedDate,
          isbn: book.isbn,
        })
        .select('id')
        .single();
      if (bookError) throw bookError;
      if (bookData && bookData.id) {
        bookId = bookData.id;
      } else {
        const { data: newBook, error: bookInsertError } = await supabase
          .from('books')
          .insert({
            title: book.title,
            author_id: authorId,
            cover_image_url: book.coverUrl,
            description: book.description,
            page_count: book.pageCount,
            published_date: book.publishedDate,
            isbn: book.isbn,
          })
          .select('id')
          .single();
        if (bookInsertError) throw bookInsertError;
        bookId = newBook.id;
      }

      // 3. Add to user_books if not already present
      const { data: userBook, error: userBookFetchError } = await supabase
        .from('user_books')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();
      if (userBookFetchError) throw userBookFetchError;
      if (userBook && userBook.id) {
        toast({ title: 'Already in Library', description: 'This book is already in your reading list.' });
        queryClient.invalidateQueries({ queryKey: ['user-books', user.id] });
        onClose();
        return;
      }
      
      const { error: insertError } = await supabase
        .from('user_books')
        .insert({
          user_id: user.id,
          book_id: bookId,
          status: 'planned',
        });
      if (insertError) throw insertError;
      
      toast({ title: 'Book Added', description: 'Book added to your "To Be Read" list.' });
      queryClient.invalidateQueries({ queryKey: ['user-books', user.id] });
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add book to library.' });
    }
    setLoading(false);
  };

  if (!open || !book) return null;

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
        <div className="flex flex-row items-start gap-4 mb-4">
          <img
            src={book.coverUrl || '/public/placeholder.svg'}
            alt={book.title + ' cover'}
            className="w-32 h-48 object-cover rounded shadow border border-slate-200 bg-white"
          />
          <div className="flex flex-col justify-center">
            <h2 className="font-serif text-2xl text-slate-900 mb-2">{book.title}</h2>
            <div className="text-slate-700 mb-2">by {book.authors?.join(', ') || 'Unknown Author'}</div>
            {book.publishedDate && <div className="text-xs text-slate-500 mb-1">Published: {book.publishedDate}</div>}
            {book.pageCount && <div className="text-xs text-slate-500 mb-1">Pages: {book.pageCount}</div>}
            {book.isbn && <div className="text-xs text-slate-500 mb-1">ISBN: {book.isbn}</div>}
            <a 
              href={book.googleBooksUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 underline text-xs hover:text-blue-800"
            >
              View on Google Books
            </a>
          </div>
        </div>
        
        {book.description && (
          <div className="text-slate-800 text-sm mb-4 max-h-40 overflow-y-auto border-t border-slate-200 pt-4">
            {book.description}
          </div>
        )}
        
        <Button 
          className="w-full bg-slate-700 hover:bg-slate-800 text-white" 
          onClick={handleAddToLibrary}
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add to Library'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}; 