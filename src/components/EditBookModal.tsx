import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Star, StarOff } from 'lucide-react';
import { toggleFavoriteBook } from '@/lib/favorite';

interface EditBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: {
    id: string;
    book_id: string;
    title: string;
    author: string;
    status: 'reading' | 'finished' | 'planned' | 'did_not_finish';
    dateStarted?: string;
    dateFinished?: string;
    notes?: string;
    coverUrl?: string;
  };
}

export const EditBookModal = ({ open, onOpenChange, book }: EditBookModalProps) => {
  console.log('=== EditBookModal RENDERED ===');
  console.log('open:', open);
  console.log('book:', book);
  console.log('book.coverUrl:', book?.coverUrl);
  
  const [coverUrl, setCoverUrl] = useState(book.coverUrl);

  // Debug logging
  useEffect(() => {
    if (open) {
      console.log('EditBookModal - Book prop:', book);
      console.log('EditBookModal - coverUrl from prop:', book.coverUrl);
      console.log('EditBookModal - coverUrl state:', coverUrl);
    }
  }, [open, book, coverUrl]);

  useEffect(() => {
    const fetchCover = async () => {
      if (!coverUrl && book.title && book.author) {
        try {
          const response = await fetch(`/api/get-book-cover?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.coverUrl) {
              setCoverUrl(data.coverUrl);
              // Update the book in the database
              await supabase
                .from('books')
                .update({ cover_image_url: data.coverUrl })
                .eq('id', book.book_id); // Use book_id to update the books table
            }
          }
        } catch (error) {
          console.error('Error fetching book cover:', error);
        }
      }
    };

    if (open) {
      fetchCover();
    }
  }, [open, coverUrl, book.title, book.author, book.book_id]);

  const { user } = useAuth();
  const [formData, setFormData] = useState({
    status: book.status,
    dateStarted: book.dateStarted || '',
    dateFinished: book.dateFinished || '',
    notes: book.notes || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [favorite, setFavorite] = useState<boolean>(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [userBookId, setUserBookId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

  const statusOptions = [
    { value: 'planned', label: 'To Be Read' },
    { value: 'reading', label: 'Currently Reading' },
    { value: 'finished', label: 'Finished' },
    { value: 'did_not_finish', label: 'Did Not Finish' },
  ];

  const getStatusText = (status: string) => {
    switch (status) {
      case 'reading': return 'Currently Reading';
      case 'finished': return 'Finished';
      case 'planned': return 'To Be Read';
      case 'did_not_finish': return 'Did Not Finish';
      default: return status;
    }
  };

  

  // Fetch favorite status for this user/book
  const fetchFavoriteStatus = async () => {
    if (!open || !user) return;
    setFavoriteLoading(true);
    const { data: userBook, error } = await supabase
      .from('user_books')
      .select('id, favorite')
      .eq('user_id', user.id)
      .eq('book_id', book.book_id)
      .maybeSingle();
    if (error) {
      setFavorite(false);
      setUserBookId(null);
    } else {
      setFavorite(!!userBook?.favorite);
      setUserBookId(userBook?.id || null);
    }
    setFavoriteLoading(false);
  };

  // Subscribe to real-time updates for this user/book
  useEffect(() => {
    if (!open || !user) return;
    const sub = supabase
      .channel('user_books_favorite_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_books',
          filter: `user_id=eq.${user.id},book_id=eq.${book.book_id}`,
        },
        (payload) => {
          // Refetch favorite status on any change
          fetchFavoriteStatus();
        }
      )
      .subscribe();
    subscriptionRef.current = sub;
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, book.book_id, user]);

  useEffect(() => {
    if (open) fetchFavoriteStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, book.book_id, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Validation: require both dates if status is finished or did_not_finish
    if ((formData.status === 'finished' || formData.status === 'did_not_finish') && (!formData.dateStarted || !formData.dateFinished)) {
      setError('Both Date Started and Date Finished are required when marking a book as Read.');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('user_books')
        .update({
          status: formData.status,
          date_started: formData.dateStarted || null,
          date_finished: formData.dateFinished || null,
          notes: formData.notes || null,
        })
        .eq('id', book.id);
      if (updateError) throw updateError;
      toast({
        title: 'Book updated!',
        description: `${book.title} has been updated.`
      });
      queryClient.invalidateQueries({ queryKey: ['user-books', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed', user?.id] });
      onOpenChange(false);
      queryClient.invalidateQueries(); // fallback: invalidate all queries for extra reliability
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating the book.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !book.id) return;
    setFavoriteLoading(true);
    try {
      const { result, errorMessage } = await toggleFavoriteBook({
        userId: user.id,
        bookId: book.book_id, // Use the book_id from the book object
        currentFavorite: favorite,
      });
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

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange(false)}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto border-2 border-slate-300 bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-slate-900 flex items-center gap-2">
            Edit Book
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
        {fetching ? (
          <div className="p-8 text-center text-slate-600">Loading latest book data...</div>
        ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-row items-start gap-4 mb-4">
            <img
              src={coverUrl || '/placeholder.svg'}
              alt={book.title + ' cover'}
              className="w-32 h-48 object-cover rounded shadow border border-slate-200 bg-white"
            />
            <div className="flex flex-col justify-center">
              <div className="font-serif text-2xl text-slate-900 mb-2">{book.title}</div>
              <div className="text-slate-700 mb-4">by {book.author}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="text-slate-800 font-medium">Title</Label>
              <Input value={book.title} disabled className="mt-1 border-2 border-slate-300 text-slate-900 bg-slate-100" />
            </div>
            <div>
              <Label className="text-slate-800 font-medium">Author</Label>
              <Input value={book.author} disabled className="mt-1 border-2 border-slate-300 text-slate-900 bg-slate-100" />
            </div>
            <div>
              <Label htmlFor="status" className="text-slate-800 font-medium">Reading Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                <SelectTrigger className="mt-1 border-2 border-slate-300 focus:border-slate-700 text-slate-900 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-slate-300 bg-white">
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-slate-900">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateStarted" className="text-slate-800 font-medium">Date Started</Label>
                <Input
                  id="dateStarted"
                  type="date"
                  value={formData.dateStarted}
                  onChange={(e) => setFormData({ ...formData, dateStarted: e.target.value })}
                  className="mt-1 border-2 border-slate-300 focus:border-slate-700 text-slate-900 bg-white"
                />
              </div>
              <div>
                <Label htmlFor="dateFinished" className="text-slate-800 font-medium">Date Finished</Label>
                <Input
                  id="dateFinished"
                  type="date"
                  value={formData.dateFinished}
                  onChange={(e) => setFormData({ ...formData, dateFinished: e.target.value })}
                  className="mt-1 border-2 border-slate-300 focus:border-slate-700 text-slate-900 bg-white"
                  disabled={formData.status === 'planned' || formData.status === 'reading'}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes" className="text-slate-800 font-medium">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Your thoughts, quotes, or reflections..."
                className="mt-1 min-h-[100px] border-2 border-slate-300 focus:border-slate-700 text-slate-900 bg-white"
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200" aria-live="polite">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-2 border-slate-400 text-slate-800 bg-white hover:bg-slate-50" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="w-full bg-slate-700 hover:bg-slate-800 text-white" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}; 