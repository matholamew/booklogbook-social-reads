import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePublicBooks = () => {
  return useQuery({
    queryKey: ['publicBooks'],
    queryFn: async () => {
      // Fetch recently added books with covers (publicly viewable)
      const { data, error } = await supabase
        .from('books')
        .select(`
          id,
          title,
          cover_url,
          page_count,
          description,
          authors (
            id,
            name
          )
        `)
        .not('cover_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;

      return data.map((book: any) => {
        // Ensure HTTPS for covers
        const safeCoverUrl = book.cover_url?.replace('http://', 'https://') || null;
        
        return {
          id: book.id,
          bookId: book.id,
          book_id: book.id,
          title: book.title || 'Unknown',
          author: book.authors?.name || 'Unknown Author',
          coverUrl: safeCoverUrl,
          cover_image_url: safeCoverUrl,
          pageCount: book.page_count || 0,
          description: book.description || '',
          // Default display values for public view
          status: 'planned' as const,
          dateStarted: undefined,
          dateFinished: undefined,
          rating: null,
          notes: undefined,
          favorite: false,
          currentPage: 0,
          progressPercent: 0,
        };
      });
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
