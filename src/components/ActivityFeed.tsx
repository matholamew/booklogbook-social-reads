import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Book, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const ActivityFeed = () => {
  const { user } = useAuth();

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activity-feed', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // 1. Get friend IDs
      const { data: follows, error: followsError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);
      if (followsError) throw followsError;
      const friendIds = follows?.map(f => f.following_id) || [];
      // Optionally include the user's own activity
      friendIds.push(user.id);
      // 2. Get recent activities for friends (and self)
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select(`
          id,
          activity_type,
          created_at,
          note,
          user_id,
          user_books (
            id,
            status,
            books (
              title,
              authors (name)
            )
          ),
          profiles:profiles!user_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .in('user_id', friendIds)
        .order('created_at', { ascending: false })
        .limit(20);
      if (activitiesError) throw activitiesError;
      // Transform for display
      return (activitiesData || []).map((a: any) => ({
        id: a.id,
        userName: a.profiles?.display_name || a.profiles?.username || 'Unknown',
        userInitials: (a.profiles?.display_name || a.profiles?.username || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2),
        avatarUrl: a.profiles?.avatar_url || '',
        action: a.activity_type,
        bookTitle: a.user_books?.books?.title || 'Unknown Title',
        bookAuthor: a.user_books?.books?.authors?.name || 'Unknown Author',
        timestamp: new Date(a.created_at).toLocaleString(),
        note: a.note || ''
      }));
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
  });

  const getActionText = (action: string) => {
    switch (action) {
      case 'started': return 'started reading';
      case 'finished': return 'finished reading';
      case 'noted': return 'added a note to';
      case 'added': return 'added';
      default: return action;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'started': return <Book className="h-4 w-4 text-slate-700" />;
      case 'finished': return <Book className="h-4 w-4 text-slate-900" />;
      case 'noted': return <Calendar className="h-4 w-4 text-slate-700" />;
      case 'added': return <Book className="h-4 w-4 text-slate-500" />;
      default: return <Book className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-2 border-slate-300 bg-white hover:bg-slate-50">
      <CardHeader>
        <CardTitle className="text-lg font-serif text-slate-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <div className="text-slate-600">Loading activity...</div>}
        {error && <div className="text-red-600">Error loading activity.</div>}
        {activities && activities.length === 0 && !isLoading && (
          <div className="text-slate-600">No recent activity from you or your friends yet.</div>
        )}
        {activities && activities.map((activity) => (
          <div key={activity.id} className="transition-all duration-300 hover:scale-[1.01] cursor-pointer flex items-start gap-3 p-3 rounded-lg hover:bg-slate-100 border border-slate-200 bg-white active:scale-[0.99]">
            <Avatar className="h-10 w-10">
              {activity.avatarUrl ? (
                <img src={activity.avatarUrl} alt={activity.userName} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <AvatarFallback className="bg-slate-200 text-slate-900 font-medium border border-slate-300">
                  {activity.userInitials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getActionIcon(activity.action)}
                <p className="text-sm text-slate-900">
                  <span className="font-semibold">{activity.userName}</span>
                  <span className="text-slate-700"> {getActionText(activity.action)} </span>
                  <span className="font-semibold font-serif">{activity.bookTitle}</span>
                  <span className="text-slate-700"> by {activity.bookAuthor}</span>
                </p>
              </div>
              {activity.note && (
                <p className="text-sm text-slate-800 bg-slate-100 p-2 rounded mt-2 border border-slate-200">
                  "{activity.note}"
                </p>
              )}
              <p className="text-xs text-slate-700 mt-1 font-medium">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
