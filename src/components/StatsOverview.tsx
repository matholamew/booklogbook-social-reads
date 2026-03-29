import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, Calendar, User } from 'lucide-react';
import { useState } from 'react';
import { FollowingModal } from './FollowingModal';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsOverviewProps {
  totalBooks?: number;
  booksThisYear?: number;
  following?: number;
  isLoading?: boolean;
}

export const StatsOverview = ({ 
  totalBooks = 0, 
  booksThisYear = 0, 
  following = 0,
  isLoading = false,
}: StatsOverviewProps) => {
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer border-2 border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.98] active:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Total Books</CardTitle>
          <Book className="h-4 w-4 text-slate-700" />
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-8 w-12 mb-1" /> : <div className="text-2xl font-bold text-slate-900">{totalBooks}</div>}
          <p className="text-xs text-slate-700">All time reading</p>
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer border-2 border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.98] active:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">This Year</CardTitle>
          <Calendar className="h-4 w-4 text-slate-700" />
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-8 w-12 mb-1" /> : <div className="text-2xl font-bold text-slate-900">{booksThisYear}</div>}
          <p className="text-xs text-slate-700">Books read in {new Date().getFullYear()}</p>
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer border-2 border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.98] active:shadow-md" onClick={() => setFollowingModalOpen(true)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Following</CardTitle>
          <User className="h-4 w-4 text-slate-700" />
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-8 w-12 mb-1" /> : <div className="text-2xl font-bold text-slate-900">{following}</div>}
          <p className="text-xs text-slate-700">Friends & family</p>
        </CardContent>
      </Card>
      <FollowingModal open={followingModalOpen} onOpenChange={setFollowingModalOpen} />
    </div>
  );
};
