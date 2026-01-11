import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

console.log('🚀 useUserBooks.ts MODULE LOADED - BUILD:', new Date().toISOString());

export const useUserBooks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userBooks', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_books')
        .select(`
          *,
          books (
            id,
            title,
            cover_url,
            authors (
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Debug: Log the raw structure from Supabase
      console.log('🔍 DEBUG useUserBooks - Total books fetched:', data?.length);
      console.log('🔍 DEBUG useUserBooks - First book raw data:', data?.[0]);
      console.log('🔍 DEBUG useUserBooks - First book.books object:', data?.[0]?.books);
      console.log('🔍 DEBUG useUserBooks - First book cover_url:', data?.[0]?.books?.cover_url);
      
      return data.map((userBook: any) => {
        const mapped = {
          id: userBook.id,
          bookId: userBook.book_id,
          title: userBook.books?.title || 'Unknown',
          author: userBook.books?.authors?.name || 'Unknown Author',
          status: userBook.status,
          dateStarted: userBook.date_started,
          dateFinished: userBook.date_finished,
          rating: userBook.rating,
          notes: userBook.notes,
          isFavorite: userBook.is_favorite,
          coverUrl: userBook.books?.cover_url || null,
          cover_image_url: userBook.books?.cover_url || null,
          updatedAt: userBook.updated_at,
          createdAt: userBook.created_at,
        };
        
        // Debug: Log each mapped book
        if (mapped.title.includes('Thank You for Arguing')) {
          console.log('🔍 DEBUG Mapping "Thank You for Arguing":', mapped);
        }
        
        return mapped;
      });
    },
    enabled: !!user,
  });
};
