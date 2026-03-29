import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Book, Calendar, Edit, BookOpen, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const ActivityFeed = () => {
  const { user } = useAuth();

  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ['activity-feed', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Query the activities table — RLS allows own + followed users
      const { data, error: fetchError } = await supabase
        .from('activities')
        .select(`
          id,
          activity_type,
          note,
          created_at,
          user_id,
          user_books:user_book_id (
            books (
              title,
              authors (name)
            )
          ),
          profiles:user_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      return (data || []).map((row: any) => {
        const profile = row.profiles;
        const name = profile?.display_name || profile?.username || 'Unknown';
        const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        const isMe = row.user_id === user.id;
        return {
          id: row.id,
          userName: isMe ? 'You' : name,
          userInitials: isMe ? 'Y' : initials,
          avatarUrl: profile?.avatar_url || '',
          action: getActionLabel(row.activity_type),
          bookTitle: row.user_books?.books?.title || '',
          bookAuthor: row.user_books?.books?.authors?.name || '',
          timestamp: new Date(row.created_at).toLocaleString(),
          note: row.note || '',
          activityType: row.activity_type,
        };
      });
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
  });

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'started': return 'started reading';
      case 'finished': return 'finished reading';
      case 'noted': return 'added a note to';
      case 'added': return 'added to their reading list';
      default: return 'updated';
    }
  };

  const getActionIcon = (activity: any) => {
    switch (activity.activityType) {
      case 'started': return <BookOpen className="h-4 w-4 text-primary" />;
      case 'finished': return <Book className="h-4 w-4 text-primary" />;
      case 'noted': return <Calendar className="h-4 w-4 text-muted-foreground" />;
      case 'added': return <PlusCircle className="h-4 w-4 text-muted-foreground" />;
      default: return <Edit className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-2">
      <CardHeader>
        <CardTitle className="text-lg font-serif">Friends & Your Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <div className="text-muted-foreground">Loading activity...</div>}
        {error && <div className="text-destructive">Error loading activity.</div>}
        {activities && activities.length === 0 && !isLoading && (
          <div className="text-muted-foreground">No recent activity yet. Follow friends to see their updates here!</div>
        )}
        {activities && activities.map((activity) => (
          <div key={activity.id} className="transition-all duration-300 hover:scale-[1.01] cursor-pointer flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 border active:scale-[0.99]">
            <Avatar className="h-10 w-10">
              {activity.avatarUrl ? (
                <img src={activity.avatarUrl} alt={activity.userName} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <AvatarFallback className="bg-muted text-foreground font-medium border">
                  {activity.userInitials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getActionIcon(activity)}
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{activity.userName}</span>
                  <span className="text-muted-foreground"> {activity.action}</span>
                  {activity.bookTitle && (
                    <>
                      <span className="font-semibold font-serif"> {activity.bookTitle}</span>
                      {activity.bookAuthor && <span className="text-muted-foreground"> by {activity.bookAuthor}</span>}
                    </>
                  )}
                </p>
              </div>
              {activity.note && (
                <p className="text-sm text-foreground bg-muted p-2 rounded mt-2 border">
                  "{activity.note}"
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1 font-medium">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
