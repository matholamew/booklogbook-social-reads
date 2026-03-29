import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
            page_count,
            authors (
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      
      return data.map((userBook: any) => {
        const pageCount = userBook.books?.page_count || 0;
        const currentPage = userBook.current_page || 0;
        const progressPercent = pageCount > 0 ? Math.round((currentPage / pageCount) * 100) : 0;
        
        // Ensure cover URLs use HTTPS to avoid mixed content issues
        const rawCoverUrl = userBook.books?.cover_url || null;
        const safeCoverUrl = rawCoverUrl?.replace('http://', 'https://') || null;
        
        const mapped = {
          id: userBook.id,
          bookId: userBook.book_id,
          book_id: userBook.book_id,
          title: userBook.books?.title || 'Unknown',
          author: userBook.books?.authors?.name || 'Unknown Author',
          status: userBook.status,
          dateStarted: userBook.date_started,
          dateFinished: userBook.date_finished,
          rating: userBook.rating || null,
          notes: userBook.notes,
          favorite: userBook.favorite,
          isFavorite: userBook.is_favorite,
          coverUrl: safeCoverUrl,
          cover_image_url: safeCoverUrl,
          updatedAt: userBook.updated_at,
          createdAt: userBook.created_at,
          currentPage: currentPage,
          pageCount: pageCount,
          progressPercent: progressPercent,
        };
        
        return mapped;
      });
    },
    enabled: !!user,
  });
};
