import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Book {
  id: string;
  title: string;
  author: string;
  status: 'reading' | 'finished' | 'planned' | 'did_not_finish';
  dateStarted?: string;
  dateFinished?: string;
  notes: string;
  updatedAt: string;
  favorite?: boolean;
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
          updated_at,
          favorite,
          books (
            id,
            title,
            authors (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match the expected Book interface
      return data.map((userBook: any) => ({
        id: userBook.id,
        title: userBook.books?.title || 'Unknown Title',
        author: userBook.books?.authors?.name || 'Unknown Author',
        status: userBook.status,
        dateStarted: userBook.date_started,
        dateFinished: userBook.date_finished,
        notes: userBook.notes || '',
        updatedAt: userBook.updated_at,
        favorite: !!userBook.favorite,
      })) as Book[];
    },
    enabled: !!user,
  });
};
