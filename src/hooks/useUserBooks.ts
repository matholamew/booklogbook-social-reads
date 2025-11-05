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
            authors (
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map((userBook: any) => ({
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
        cover_image_url: userBook.books?.cover_url || null, // For backward compatibility
        updatedAt: userBook.updated_at,
        createdAt: userBook.created_at,
      }));
    },
    enabled: !!user,
  });
};
