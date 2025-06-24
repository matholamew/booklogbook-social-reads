
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

      // Get total books
      const { count: totalBooks, error: totalError } = await supabase
        .from('user_books')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (totalError) throw totalError;

      // Get books this year
      const currentYear = new Date().getFullYear();
      const { count: booksThisYear, error: yearError } = await supabase
        .from('user_books')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('date_finished', `${currentYear}-01-01`)
        .lte('date_finished', `${currentYear}-12-31`);

      if (yearError) throw yearError;

      // Get following count
      const { count: following, error: followingError } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      return {
        totalBooks: totalBooks || 0,
        booksThisYear: booksThisYear || 0,
        following: following || 0,
      };
    },
    enabled: !!user,
  });
};
