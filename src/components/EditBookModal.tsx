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

interface EditBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: {
    id: string;
    title: string;
    author: string;
    status: 'reading' | 'finished' | 'planned';
    dateStarted?: string;
    dateFinished?: string;
    notes?: string;
  };
}

export const EditBookModal = ({ open, onOpenChange, book }: EditBookModalProps) => {
  const [formData, setFormData] = useState({
    status: book.status,
    dateStarted: book.dateStarted || '',
    dateFinished: book.dateFinished || '',
    notes: book.notes || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const queryClient = useQueryClient();

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-2 border-slate-300 bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-slate-900">Edit Book</DialogTitle>
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
                  <SelectItem value="planned" className="text-slate-900">Want to Read</SelectItem>
                  <SelectItem value="reading" className="text-slate-900">Currently Reading</SelectItem>
                  <SelectItem value="finished" className="text-slate-900">Finished</SelectItem>
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