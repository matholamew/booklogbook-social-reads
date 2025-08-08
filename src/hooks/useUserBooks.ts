import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Book {
  id: string;
  book_id: string;
  title: string;
  author: string;
  status: 'reading' | 'finished' | 'planned' | 'did_not_finish';
  dateStarted?: string;
  dateFinished?: string;
  notes: string;
  updatedAt: string;
  favorite?: boolean;
  coverUrl?: string;
}

export const useUserBooks = () => {
  const { user } = useAuth();
  console.log('useUserBooks hook initiated. User authenticated:', !!user);

  return useQuery({
    queryKey: ['user-books', user?.id],
    queryFn: async () => {
      console.log('queryFn started for user:', user?.id);
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
            cover_image_url,
            authors (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });


      if (error) throw error;

    // Map the data to a more usable format
      const mappedData = data.map((userBook: any) => {
        const transformedBook = {
          id: userBook.id,
          book_id: userBook.books?.id || '',
          title: userBook.books?.title || 'Unknown Title',
          author: userBook.books?.authors?.name || 'Unknown Author',
          status: userBook.status,
          dateStarted: userBook.date_started,
          dateFinished: userBook.date_finished,
          notes: userBook.notes || '',
          updatedAt: userBook.updated_at,
          favorite: !!userBook.favorite,
          coverUrl: userBook.books?.cover_image_url || '',
        };
        return transformedBook;
      });
      return mappedData;
