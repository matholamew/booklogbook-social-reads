import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface AuthorModalProps {
  open: boolean;
  authorId: string | null;
  onClose: () => void;
  onBookClick: (bookId: string) => void;
}

export const AuthorModal = ({ open, authorId, onClose, onBookClick }: AuthorModalProps) => {
  const [author, setAuthor] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && authorId) {
      setLoading(true);
      supabase
        .from('authors')
        .select('id, name, bio')
        .eq('id', authorId)
        .single()
        .then(({ data }) => setAuthor(data));
      supabase
        .from('books')
        .select('id, title')
        .eq('author_id', authorId)
        .then(({ data }) => {
          setBooks(data || []);
          setLoading(false);
        });
    }
    if (!open) {
      setAuthor(null);
      setBooks([]);
    }
  }, [open, authorId]);

  if (!open || !authorId) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto border-2 border-slate-300 bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-slate-900">Author</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-slate-700">Loading...</div>
        ) : author ? (
          <>
            <h2 className="font-serif text-2xl text-slate-900 mb-2">{author.name}</h2>
            {author.bio && <div className="text-slate-700 mb-4">{author.bio}</div>}
            <div className="font-semibold text-slate-800 mb-2">Books by this author:</div>
            <ul className="mb-4">
              {books.map((book) => (
                <li
                  key={book.id}
                  className="text-slate-900 mb-1 hover:underline cursor-pointer"
                  onClick={() => { onClose(); onBookClick(book.id); }}
                >
                  {book.title}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="text-slate-700">Author not found.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 