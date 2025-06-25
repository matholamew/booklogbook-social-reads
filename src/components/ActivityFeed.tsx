import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Book, Calendar, User, Edit } from 'lucide-react';
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
      // Include the user's own activity
      friendIds.push(user.id);

      if (friendIds.length === 0) return [];

      // 2. Get recent book activities from user_books
      const { data: bookActivities, error: bookError } = await supabase
        .from('user_books')
        .select(`
          id,
          status,
          date_started,
          date_finished,
          notes,
          updated_at,
          books (
            title,
            authors (name)
          ),
          profiles:profiles!user_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .in('user_id', friendIds)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (bookError) throw bookError;

      // 3. Get recent profile updates
      const { data: profileActivities, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          username,
          avatar_url,
          bio,
          updated_at
        `)
        .in('id', friendIds)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (profileError) throw profileError;

      // 4. Combine and sort all activities by updated_at
      const allActivities = [
        ...(bookActivities || []).map((activity: any) => ({
          id: `book-${activity.id}`,
          type: 'book',
          data: activity,
          updated_at: activity.updated_at,
          user: activity.profiles
        })),
        ...(profileActivities || []).map((activity: any) => ({
          id: `profile-${activity.id}`,
          type: 'profile',
          data: activity,
          updated_at: activity.updated_at,
          user: activity
        }))
      ];

      // Sort by updated_at and take top 10
      return allActivities
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 10)
        .map((activity: any) => {
          if (activity.type === 'book') {
            return {
              id: activity.id,
              userName: activity.user?.display_name || activity.user?.username || 'Unknown',
              userInitials: (activity.user?.display_name || activity.user?.username || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2),
              avatarUrl: activity.user?.avatar_url || '',
              action: getBookAction(activity.data),
              bookTitle: activity.data.books?.title || 'Unknown Title',
              bookAuthor: activity.data.books?.authors?.name || 'Unknown Author',
              timestamp: new Date(activity.updated_at).toLocaleString(),
              note: activity.data.notes || '',
              type: 'book'
            };
          } else {
            return {
              id: activity.id,
              userName: activity.user?.display_name || activity.user?.username || 'Unknown',
              userInitials: (activity.user?.display_name || activity.user?.username || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2),
              avatarUrl: activity.user?.avatar_url || '',
              action: 'updated their profile',
              bookTitle: '',
              bookAuthor: '',
              timestamp: new Date(activity.updated_at).toLocaleString(),
              note: '',
              type: 'profile'
            };
          }
        });
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
  });

  const getBookAction = (bookData: any) => {
    if (bookData.status === 'reading') return 'started reading';
    if (bookData.status === 'finished') return 'finished reading';
    if (bookData.status === 'did_not_finish') return 'stopped reading';
    if (bookData.notes) return 'added a note to';
    if (bookData.status === 'planned') return 'added to their reading list';
    return 'updated';
  };

  const getActionIcon = (activity: any) => {
    if (activity.type === 'profile') return <User className="h-4 w-4 text-slate-600" />;
    
    switch (activity.action) {
      case 'started reading': return <Book className="h-4 w-4 text-slate-700" />;
      case 'finished reading': return <Book className="h-4 w-4 text-slate-900" />;
      case 'stopped reading': return <Book className="h-4 w-4 text-red-600" />;
      case 'added a note to': return <Calendar className="h-4 w-4 text-slate-700" />;
      case 'added to their reading list': return <Book className="h-4 w-4 text-slate-500" />;
      default: return <Edit className="h-4 w-4 text-slate-600" />;
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
                {getActionIcon(activity)}
                <p className="text-sm text-slate-900">
                  <span className="font-semibold">{activity.userName}</span>
                  <span className="text-slate-700"> {activity.action}</span>
                  {activity.bookTitle && (
                    <>
                      <span className="font-semibold font-serif"> {activity.bookTitle}</span>
                      {activity.bookAuthor && <span className="text-slate-700"> by {activity.bookAuthor}</span>}
                    </>
                  )}
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
