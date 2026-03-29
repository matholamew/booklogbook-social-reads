
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

      // Read once, then compute deduplicated stats to avoid inflated counts from duplicate entries
      const { data: userBookRows, error: booksError } = await supabase
        .from('user_books')
        .select('book_id, status, date_finished')
        .eq('user_id', user.id);

      if (booksError) throw booksError;

      const rows = userBookRows || [];
      const totalBooks = new Set(rows.map((row) => row.book_id)).size;

      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear + 1, 0, 1);

      const booksThisYear = new Set(
        rows
          .filter((row) => {
            if (row.status !== 'finished' || !row.date_finished) return false;
            const finishedDate = new Date(row.date_finished);
            return finishedDate >= yearStart && finishedDate < yearEnd;
          })
          .map((row) => row.book_id)
      ).size;

      // Get following count
      const { count: following, error: followingError } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      return {
        totalBooks,
        booksThisYear,
        following: following || 0,
      };
    },
    enabled: !!user,
  });
};
