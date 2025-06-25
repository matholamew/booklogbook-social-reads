import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface BookModalProps {
  open: boolean;
  bookId: string | null;
  onClose: () => void;
  onAddToLibrary?: () => void;
}

export const BookModal = ({ open, bookId, onClose, onAddToLibrary }: BookModalProps) => {
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

  if (!open || !bookId) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto border-2 border-slate-300 bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-slate-900">Book</DialogTitle>
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