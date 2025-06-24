import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export interface Book {
  id: string;
  title: string;
  author: string;
  status: 'reading' | 'finished' | 'planned';
  dateStarted?: string;
  dateFinished?: string;
  notes: string;
  updatedAt: string;
}

export const useUserBooks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    // Subscribe to user_books, books, and authors changes
    const channels = [
      supabase.channel('user_books-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_books' }, () => {
          queryClient.invalidateQueries({ queryKey: ['user-books', user.id] });
        }),
      supabase.channel('books-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => {
          queryClient.invalidateQueries({ queryKey: ['user-books', user.id] });
        }),
      supabase.channel('authors-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'authors' }, () => {
          queryClient.invalidateQueries({ queryKey: ['user-books', user.id] });
        })
    ];
    channels.forEach(channel => channel.subscribe());
    return () => { channels.forEach(channel => channel.unsubscribe()); };
  }, [user, queryClient]);

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
        updatedAt: userBook.updated_at
      })) as Book[];
    },
    enabled: !!user,
  });
};
