
import { Header } from '@/components/Header';
import { StatsOverview } from '@/components/StatsOverview';
import { ActivityFeed } from '@/components/ActivityFeed';
import { BookCard } from '@/components/BookCard';
import { AddBookButton } from '@/components/AddBookButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Mock data for current user's books
const mockBooks = [
  {
    id: '1',
    title: 'The Thursday Murder Club',
    author: 'Richard Osman',
    dateStarted: '2024-01-15',
    dateFinished: undefined,
    status: 'reading' as const,
    notes: 'Such a delightful mystery! The characters are wonderfully developed.'
  },
  {
    id: '2',
    title: 'Educated',
    author: 'Tara Westover',
    dateStarted: '2024-01-01',
    dateFinished: '2024-01-10',
    status: 'finished' as const,
    notes: 'Incredibly powerful memoir about education and family.'
  },
  {
    id: '3',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    dateStarted: undefined,
    dateFinished: undefined,
    status: 'planned' as const,
    notes: ''
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif text-foreground mb-2">
            Welcome back, Reader! 📚
          </h1>
          <p className="text-muted-foreground">
            Track your reading journey and discover what your friends are reading.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <StatsOverview />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Current Reading & Recent Books */}
          <div className="lg:col-span-2 space-y-6">
            {/* Currently Reading */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif">Currently Reading</CardTitle>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {mockBooks.filter(book => book.status === 'reading').length} books
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockBooks
                    .filter(book => book.status === 'reading')
                    .map(book => (
                      <BookCard key={book.id} book={book} />
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Books */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif">Your Library</CardTitle>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockBooks.map(book => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Feed */}
          <div className="space-y-6">
            <ActivityFeed />
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-serif">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <span>Browse Friends' Reading</span>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <span>Discover New Books</span>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <span>View Reading Stats</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AddBookButton />
    </div>
  );
};

export default Index;
