import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export const AddBookButton = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    dateStarted: '',
    dateFinished: '',
    status: 'reading',
    notes: ''
  });
  const [error, setError] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.author) {
      setError("Please fill in both title and author.");
      return;
    }
    if (!user) {
      setError("You must be logged in to add a book.");
      return;
    }
    // Validation: require both dates if status is finished or did_not_finish
    if ((formData.status === 'finished' || formData.status === 'did_not_finish') && (!formData.dateStarted || !formData.dateFinished)) {
      setError('Both Date Started and Date Finished are required when marking a book as Read.');
      return;
    }

    try {
      // Use edge function for validated book/author creation
      const { data: bookResult, error: bookError } = await supabase.functions.invoke('create-book', {
        body: {
          title: formData.title,
          author_name: formData.author,
        }
      });

      if (bookError) throw bookError;
      const book_id = bookResult.book_id;

      // 3. Check if user already has this book
      const { data: userBookData, error: userBookError } = await supabase
        .from('user_books')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', book_id)
        .maybeSingle();
      if (userBookData && userBookData.id) {
        setError('You have already added this book to your library.');
        return;
      }

      // 4. Insert into user_books
      const { error: insertUserBookError } = await supabase
        .from('user_books')
        .insert({
          user_id: user.id,
          book_id,
          status: formData.status,
          date_started: formData.dateStarted || null,
          date_finished: formData.dateFinished || null,
          notes: formData.notes || null,
        });
      if (insertUserBookError) throw insertUserBookError;

      toast({
        title: "Book Added!",
        description: `${formData.title} has been added to your library.`
      });
      setFormData({
        title: '',
        author: '',
        dateStarted: '',
        dateFinished: '',
        status: 'reading',
        notes: ''
      });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['user-books', user.id] });
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding the book.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 bg-slate-700 hover:bg-slate-800" aria-label="Add a book">
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-2 border-slate-300 bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-slate-900">Add a Book</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title" className="text-slate-800 font-medium">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter book title..."
                className="mt-1 border-2 border-slate-300 focus:border-slate-700 text-slate-900 bg-white"
                aria-required="true"
              />
            </div>
            
            <div>
              <Label htmlFor="author" className="text-slate-800 font-medium">Author *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Enter author name..."
                className="mt-1 border-2 border-slate-300 focus:border-slate-700 text-slate-900 bg-white"
                aria-required="true"
              />
            </div>
            
            <div>
              <Label htmlFor="status" className="text-slate-800 font-medium">Reading Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-2 border-slate-400 text-slate-800 bg-white hover:bg-slate-50">
              Cancel
            </Button>
            <Button type="submit" className="bg-slate-700 hover:bg-slate-800 text-white">Add Book</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
