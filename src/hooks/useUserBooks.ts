
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Book {
  id: string;
  title: string;
  author: string;
  status: 'reading' | 'finished' | 'planned';
  dateStarted?: string;
  dateFinished?: string;
  notes: string;
}

export const useUserBooks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-books', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_books')
        .select(`
          id,
          status,
          date_started,
          date_finished,
          notes,
          books (
            id,
            title,
            authors (
              name
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Transform the data to match the expected Book interface
      return data.map((userBook: any) => ({
        id: userBook.id,
        title: userBook.books?.title || 'Unknown Title',
        author: userBook.books?.authors?.name || 'Unknown Author',
        status: userBook.status,
        dateStarted: userBook.date_started,
        dateFinished: userBook.date_finished,
        notes: userBook.notes || ''
      })) as Book[];
    },
    enabled: !!user,
  });
};
