
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserStats {
  totalBooks: number;
  booksThisYear: number;
  following: number;
}

export const useUserStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async (): Promise<UserStats> => {
      if (!user) return { totalBooks: 0, booksThisYear: 0, following: 0 };

      const [booksResult, followingResult] = await Promise.all([
        supabase
          .from('user_books')
          .select('book_id, status, date_finished')
          .eq('user_id', user.id),
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', user.id),
      ]);

      if (booksResult.error) throw booksResult.error;

      const rows = booksResult.data || [];
      const totalBooks = new Set(rows.map((row) => row.book_id)).size;

      const currentYear = new Date().getFullYear();
      const yearPrefix = `${currentYear}-`;

      const booksThisYear = new Set(
        rows
          .filter((row) => {
            if (row.status !== 'finished' || !row.date_finished) return false;
            return row.date_finished.startsWith(yearPrefix);
          })
          .map((row) => row.book_id)
      ).size;

      const following = followingResult.error ? 0 : followingResult.count || 0;

      return {
        totalBooks,
        booksThisYear,
        following,
      };
    },
    enabled: !!user,
  });
};
