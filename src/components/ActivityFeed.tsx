
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Book, Calendar } from 'lucide-react';

interface Activity {
  id: string;
  userName: string;
  userInitials: string;
  action: 'started' | 'finished' | 'noted';
  bookTitle: string;
  bookAuthor: string;
  timestamp: string;
  note?: string;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    userName: 'Sarah Johnson',
    userInitials: 'SJ',
    action: 'finished',
    bookTitle: 'The Seven Husbands of Evelyn Hugo',
    bookAuthor: 'Taylor Jenkins Reid',
    timestamp: '2 hours ago'
  },
  {
    id: '2',
    userName: 'Mike Chen',
    userInitials: 'MC',
    action: 'started',
    bookTitle: 'Project Hail Mary',
    bookAuthor: 'Andy Weir',
    timestamp: '5 hours ago'
  },
  {
    id: '3',
    userName: 'Emma Wilson',
    userInitials: 'EW',
    action: 'noted',
    bookTitle: 'Atomic Habits',
    bookAuthor: 'James Clear',
    timestamp: '1 day ago',
    note: 'Really loving the practical approach to habit formation!'
  }
];

export const ActivityFeed = () => {
  const getActionText = (action: string) => {
    switch (action) {
      case 'started': return 'started reading';
      case 'finished': return 'finished reading';
      case 'noted': return 'added a note to';
      default: return action;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'started': return <Book className="h-4 w-4 text-slate-700" />;
      case 'finished': return <Book className="h-4 w-4 text-slate-900" />;
      case 'noted': return <Calendar className="h-4 w-4 text-slate-700" />;
      default: return <Book className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <Card className="border-2 border-slate-300 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-serif text-slate-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockActivities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200 bg-white">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-slate-200 text-slate-900 font-medium border border-slate-300">
                {activity.userInitials}
              </AvatarFallback>
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
