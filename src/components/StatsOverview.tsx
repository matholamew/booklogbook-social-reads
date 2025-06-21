
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, Calendar, User } from 'lucide-react';

interface StatsOverviewProps {
  totalBooks?: number;
  booksThisYear?: number;
  following?: number;
}

export const StatsOverview = ({ 
  totalBooks = 47, 
  booksThisYear = 12, 
  following = 8 
}: StatsOverviewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-2 border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-800">Total Books</CardTitle>
          <Book className="h-4 w-4 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-700">{totalBooks}</div>
          <p className="text-xs text-slate-600">All time reading</p>
        </CardContent>
      </Card>

      <Card className="border-2 border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-800">This Year</CardTitle>
          <Calendar className="h-4 w-4 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">{booksThisYear}</div>
          <p className="text-xs text-slate-600">Books read in 2024</p>
        </CardContent>
      </Card>

      <Card className="border-2 border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-800">Following</CardTitle>
          <User className="h-4 w-4 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700">{following}</div>
          <p className="text-xs text-slate-600">Friends & family</p>
        </CardContent>
      </Card>
    </div>
  );
};
