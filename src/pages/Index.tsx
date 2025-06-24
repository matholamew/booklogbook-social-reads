import { useAuth } from '@/hooks/useAuth';
import { useUserBooks } from '@/hooks/useUserBooks';
import { useUserStats } from '@/hooks/useUserStats';
import { Header } from '@/components/Header';
import { StatsOverview } from '@/components/StatsOverview';
import { ActivityFeed } from '@/components/ActivityFeed';
import { BookCard } from '@/components/BookCard';
import { AddBookButton } from '@/components/AddBookButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Book, Users, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { EditBookModal } from '@/components/EditBookModal';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Footer from '@/components/Footer';

// Mock data for unauthenticated users
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
  const { user, loading } = useAuth();
  const { data: userBooks = [], isLoading: booksLoading } = useUserBooks();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [viewAllPage, setViewAllPage] = useState(1);
  const booksPerPage = 10;
  const totalPages = Math.ceil(userBooks.length / booksPerPage);
  const paginatedBooks = userBooks.slice((viewAllPage - 1) * booksPerPage, viewAllPage * booksPerPage);

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setEditModalOpen(true);
  };

  const handleOpenViewAll = () => {
    setViewAllPage(1);
    setViewAllOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-6 pt-4 sm:pt-4 md:pt-4 lg:pt-0">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif text-slate-900 mb-2">
            {user ? `Welcome back, Reader! 📚` : 'Track Your Reading Journey 📚'}
          </h1>
          <p className="text-slate-800 text-lg">
            {user 
              ? 'Track your reading journey and discover what your friends are reading.'
              : 'Join BookLogBook to organize your reading, track progress, and connect with fellow book lovers.'
            }
          </p>
        </div>

        {user ? (
          <>
            {/* Stats Overview */}
            <div className="mb-8">
              <StatsOverview 
                totalBooks={stats?.totalBooks}
                booksThisYear={stats?.booksThisYear}
                following={stats?.following}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Current Reading & Recent Books */}
              <div className="lg:col-span-2 space-y-6">
                {/* Currently Reading */}
                <Card className="transition-all duration-300 hover:shadow-lg border-2 border-slate-300 bg-white hover:bg-slate-50">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-serif text-slate-900">Currently Reading</CardTitle>
                    <Badge variant="secondary" className="bg-slate-200 text-slate-900 border border-slate-300">
                      {userBooks.filter(book => book.status === 'reading').length} books
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    {booksLoading ? (
                      <div className="text-slate-600">Loading your books...</div>
                    ) : userBooks.filter(book => book.status === 'reading').length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userBooks
                          .filter(book => book.status === 'reading')
                          .map(book => (
                            <BookCard key={book.id} book={book} onClick={() => handleBookClick(book)} />
                          ))}
                      </div>
                    ) : (
                      <p className="text-slate-600">No books currently being read. Start reading something new!</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Books */}
                <Card className="transition-all duration-300 hover:shadow-lg border-2 border-slate-300 bg-white hover:bg-slate-50">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-serif text-slate-900">Your Library</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleOpenViewAll}>
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {booksLoading ? (
                      <div className="text-slate-600">Loading your library...</div>
                    ) : userBooks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userBooks.slice(0, 6).map(book => (
                          <BookCard key={book.id} book={book} onClick={() => handleBookClick(book)} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600">Your library is empty. Add your first book to get started!</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Activity Feed */}
              <div className="space-y-6">
                <ActivityFeed />
                
                {/* Quick Actions */}
                <Card className="transition-all duration-300 hover:shadow-lg border-2 border-slate-300 bg-white hover:bg-slate-50">
                  <CardHeader>
                    <CardTitle className="text-lg font-serif text-slate-900">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start text-slate-900 border-2 border-slate-400 hover:border-slate-600 bg-white hover:bg-slate-50">
                      <span>Browse Friends' Reading</span>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-slate-900 border-2 border-slate-400 hover:border-slate-600 bg-white hover:bg-slate-50">
                      <span>Discover New Books</span>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-slate-900 border-2 border-slate-400 hover:border-slate-600 bg-white hover:bg-slate-50">
                      <span>View Reading Stats</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* View All Modal */}
            <Dialog open={viewAllOpen} onOpenChange={setViewAllOpen}>
              <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-slate-300 bg-white">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl text-slate-900">All Books in Your Library</DialogTitle>
                </DialogHeader>
                {booksLoading ? (
                  <div className="text-slate-600">Loading your library...</div>
                ) : userBooks.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {paginatedBooks.map(book => (
                        <BookCard key={book.id} book={book} onClick={() => { setViewAllOpen(false); handleBookClick(book); }} />
                      ))}
                    </div>
                    {/* Pagination Controls */}
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <button
                        className="p-2 rounded border border-slate-300 bg-white disabled:opacity-50"
                        onClick={() => setViewAllPage(p => Math.max(1, p - 1))}
                        disabled={viewAllPage === 1}
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i + 1}
                          className={`px-3 py-1 rounded border ${viewAllPage === i + 1 ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          onClick={() => setViewAllPage(i + 1)}
                          aria-label={`Go to page ${i + 1}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        className="p-2 rounded border border-slate-300 bg-white disabled:opacity-50"
                        onClick={() => setViewAllPage(p => Math.min(totalPages, p + 1))}
                        disabled={viewAllPage === totalPages}
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-600">Your library is empty. Add your first book to get started!</p>
                )}
              </DialogContent>
            </Dialog>

            {/* Edit Book Modal */}
            {selectedBook && (
              <EditBookModal open={editModalOpen} onOpenChange={setEditModalOpen} book={selectedBook} />
            )}

            <AddBookButton />
          </>
        ) : (
          <>
            {/* Features showcase for non-authenticated users */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="transition-all duration-300 hover:shadow-lg border-2 border-slate-300 bg-white hover:bg-slate-50 text-center p-6">
                <Book className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-serif text-slate-900 mb-2">Track Your Reading</h3>
                <p className="text-slate-600">Keep a digital log of all the books you've read, are reading, or want to read.</p>
              </Card>
              
              <Card className="transition-all duration-300 hover:shadow-lg border-2 border-slate-300 bg-white hover:bg-slate-50 text-center p-6">
                <TrendingUp className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-serif text-slate-900 mb-2">Monitor Progress</h3>
                <p className="text-slate-600">Set reading goals and track your progress throughout the year.</p>
              </Card>
              
              <Card className="transition-all duration-300 hover:shadow-lg border-2 border-slate-300 bg-white hover:bg-slate-50 text-center p-6">
                <Users className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-serif text-slate-900 mb-2">Connect with Readers</h3>
                <p className="text-slate-600">Follow friends and family to see what they're reading and get recommendations.</p>
              </Card>
            </div>

            {/* Sample books preview */}
            <Card className="mb-8 border-2 border-slate-300 bg-white">
              <CardHeader>
                <CardTitle className="font-serif text-slate-900">What BookLogBook looks like</CardTitle>
                <p className="text-slate-600">Here's a preview of how you can organize your reading:</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mockBooks.map(book => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Call to action */}
            <div className="text-center bg-slate-50 rounded-lg p-8 border-2 border-slate-300">
              <h2 className="text-2xl font-serif text-slate-900 mb-4">Ready to start your reading journey?</h2>
              <p className="text-slate-600 mb-6">Join thousands of readers who are already tracking their books with BookLogBook.</p>
              <Link to="/auth">
                <Button size="lg" className="bg-slate-800 hover:bg-slate-900 text-white">
                  Get Started with Email
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
