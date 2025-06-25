import { useState, useEffect } from 'react';
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

interface EditBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: {
    id: string;
    title: string;
    author: string;
    status: 'reading' | 'finished' | 'planned' | 'did_not_finish';
    dateStarted?: string;
    dateFinished?: string;
    notes?: string;
  };
}

export const EditBookModal = ({ open, onOpenChange, book }: EditBookModalProps) => {
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
  const queryClient = useQueryClient();

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

  useEffect(() => {
    const fetchBook = async () => {
      setFetching(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('user_books')
        .select('status, date_started, date_finished, notes')
        .eq('id', book.id)
        .single();
      if (fetchError) {
        setError('Failed to fetch latest book data.');
      } else if (data) {
        setFormData({
          status: data.status,
          dateStarted: data.date_started || '',
          dateFinished: data.date_finished || '',
          notes: data.notes || '',
        });
      }
      setFetching(false);
    };
    if (open) {
      fetchBook();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, book.id]);

  useEffect(() => {
    const fetchFavorite = async () => {
      if (open && book.id && user) {
        setFavoriteLoading(true);
        const { data } = await supabase
          .from('user_books')
          .select('favorite')
          .eq('user_id', user.id)
          .eq('book_id', book.id)
          .maybeSingle();
        setFavorite(!!data?.favorite);
        setFavoriteLoading(false);
      } else {
        setFavorite(false);
      }
    };
    fetchFavorite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, book.id, user]);

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
      onOpenChange(false);
      queryClient.invalidateQueries();
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating the book.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !book.id) return;
    setFavoriteLoading(true);
    // Find the user_books row for this user/book
    const { data } = await supabase
      .from('user_books')
      .select('id, favorite')
      .eq('user_id', user.id)
      .eq('book_id', book.id)
      .maybeSingle();
    if (data && data.id) {
      // Row exists, update favorite
      const { error } = await supabase
        .from('user_books')
        .update({ favorite: !favorite })
        .eq('id', data.id);
      if (!error) setFavorite(fav => !fav);
    } else {
      // Row does not exist, need to insert
      // Find the book's author_id
      const { data: bookData } = await supabase
        .from('books')
        .select('id, author_id')
        .eq('id', book.id)
        .single();
      if (!bookData) {
        setFavoriteLoading(false);
        return;
      }
      const { error } = await supabase
        .from('user_books')
        .insert({
          user_id: user.id,
          book_id: book.id,
          favorite: true,
          status: formData.status,
          date_started: formData.dateStarted || null,
          date_finished: formData.dateFinished || null,
          notes: formData.notes || null,
        });
      if (!error) setFavorite(true);
    }
    setFavoriteLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-2 border-slate-300 bg-white">
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
            <Button type="submit" className="bg-slate-700 hover:bg-slate-800 text-white" disabled={loading}>
              Save Changes
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}; 