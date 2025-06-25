import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const TABLES = ['books', 'authors', 'user_books'];

export function useSupabaseRealtime() {
  const queryClient = useQueryClient();
  const channelsRef = useRef<any[]>([]);

  useEffect(() => {
    // Subscribe to all tables
    TABLES.forEach((table) => {
      const channel = supabase
        .channel(`realtime_${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          (payload) => {
            // Invalidate all queries on any change
            queryClient.invalidateQueries();
          }
        )
        .subscribe();
      channelsRef.current.push(channel);
    });
    return () => {
      // Cleanup all channels
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
} 