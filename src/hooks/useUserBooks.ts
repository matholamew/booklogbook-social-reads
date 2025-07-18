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
            cover_url,
            authors (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      console.log('Supabase user_books data:', data); // Debug log for cover_url troubleshooting
      console.log('First book cover_url:', data?.[0]?.books?.cover_url); // Debug specific cover_url

      if (error) throw error;

    console.log('Supabase user_books data:', data); // Debug log for raw data

    // Map the data to a more usable format
      const mappedData = data.map((userBook: any) => {
        const transformedBook = {
          id: userBook.id,
          title: userBook.books?.title || 'Unknown Title',
          author: userBook.books?.authors?.name || 'Unknown Author',
          status: userBook.status,
          dateStarted: userBook.date_started,
          dateFinished: userBook.date_finished,
          notes: userBook.notes || '',
          updatedAt: userBook.updated_at,
          favorite: !!userBook.favorite,
          coverUrl: userBook.books?.cover_url || '',
          book_id: userBook.books?.id,
        };
        return transformedBook;
      });
      console.log('Mapped data:', mappedData); // Debug log for mapped data
      return mappedData;
