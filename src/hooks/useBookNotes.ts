import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BookNote {
  id: string;
  user_book_id: string;
  content: string;
  highlight_text: string | null;
  tags: string[];
  page_number: number | null;
  created_at: string;
  updated_at: string;
  book_title?: string;
  book_author?: string;
}

export const useBookNotes = (userBookId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookNotes', user?.id, userBookId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('book_notes')
        .select(`
          *,
          user_books (
            books (
              title,
              authors (name)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userBookId) {
        query = query.eq('user_book_id', userBookId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((note: any) => ({
        id: note.id,
        user_book_id: note.user_book_id,
        content: note.content,
        highlight_text: note.highlight_text,
        tags: note.tags || [],
        page_number: note.page_number,
        created_at: note.created_at,
        updated_at: note.updated_at,
        book_title: note.user_books?.books?.title,
        book_author: note.user_books?.books?.authors?.name,
      }));
    },
    enabled: !!user,
  });
};

export const useAllBookNotes = () => {
  return useBookNotes();
};