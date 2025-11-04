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
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

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

type SectionType = 'reading' | 'planned' | 'finished';

const Index = () => {
  const { user, loading } = useAuth();
  const { data: userBooks = [], isLoading: booksLoading } = useUserBooks();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [viewAllPage, setViewAllPage] = useState(1);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [currentSection, setCurrentSection] = useState<SectionType>('reading');
  const [sectionPage, setSectionPage] = useState(1);
  const booksPerPage = 10;
  const booksPerSection = 6;

  console.log('Index page rendered');

  useEffect(() => {
    if (!booksLoading && userBooks.length > 0) {
        console.log('Index.tsx: userBooks data received:', userBooks);
        console.log('Index.tsx: First book coverUrl:', userBooks[0]?.coverUrl);
    }
  }, [userBooks, booksLoading]);

  // Get books for each section
  const readingBooks = userBooks.filter(book => book.status === 'reading')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const plannedBooks = userBooks.filter(book => book.status === 'planned')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const finishedBooks = userBooks.filter(book => book.status === 'finished' || book.status === 'did_not_finish')
    .sort((a, b) => {
      // Sort by dateStarted descending (most recent first)
      if (!a.dateStarted && !b.dateStarted) return 0;
      if (!a.dateStarted) return 1;
      if (!b.dateStarted) return -1;
      return new Date(b.dateStarted).getTime() - new Date(a.dateStarted).getTime();
    });

  // Get paginated books for current section
  const getCurrentSectionBooks = () => {
    switch (currentSection) {
      case 'reading':
        return readingBooks;
      case 'planned':
        return plannedBooks;
      case 'finished':
        return finishedBooks;
      default:
        return [];
    }
  };

  const currentSectionBooks = getCurrentSectionBooks();
  const totalPages = Math.ceil(currentSectionBooks.length / booksPerPage);
  const paginatedSectionBooks = currentSectionBooks.slice(
    (sectionPage - 1) * booksPerPage, 
    sectionPage * booksPerPage
  );

  // Fetch user's display name when user is available
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setUserDisplayName('');
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        setUserDisplayName(data?.display_name || data?.username || user.email?.split('@')[0] || 'Reader');
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setUserDisplayName(user.email?.split('@')[0] || 'Reader');
      }
    };
    fetchUserProfile();
  }, [user]);

  // Debug logging for modal state
  useEffect(() => {
    if (selectedBook) {
      console.log('Selected book for editing:', selectedBook.title);
    }
  }, [selectedBook, editModalOpen]);

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setEditModalOpen(true);
  };

  const handleOpenViewAll = (section: SectionType) => {
    setCurrentSection(section);
    setSectionPage(1);
    setViewAllOpen(true);
  };

  const getSectionTitle = (section: SectionType) => {
    switch (section) {
      case 'reading':
        return 'Currently Reading';
      case 'planned':
        return 'To Be Read';
      case 'finished':
        return 'Read';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8 pt-4 md:pt-6 lg:pt-[24px]">
          <h1 className="text-3xl font-bold font-serif text-foreground mb-2">
            {user ? `Welcome back, ${userDisplayName}! 📚` : 'Track Your Reading Journey 📚'}
          </h1>
          <p className="text-foreground/80 text-lg">
            {user 
              ? 'Track your reading journey and discover what your friends are reading.'
              : 'Join BookLogBook to organize your reading, track progress, and connect with fellow book lovers.'
            }
          </p>
        </div>

        {user ? (
          <>
            <div className="mb-8">
              <StatsOverview 
                totalBooks={stats?.totalBooks}
                booksThisYear={stats?.booksThisYear}
                following={stats?.following}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Book Sections */}
              <div className="lg:col-span-2 space-y-6">
                {/* Currently Reading */}
                <Card className="transition-all duration-300 hover:shadow-lg border-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-serif">Currently Reading</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {readingBooks.length} books
                      </Badge>
                      {readingBooks.length > booksPerSection && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenViewAll('reading')}
                        >
                          View All
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {booksLoading ? (
                      <div className="text-muted-foreground">Loading your books...</div>
                    ) : readingBooks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {readingBooks
                          .slice(0, booksPerSection)
                          .map(book => (
                            <BookCard key={book.id} book={book} onClick={() => handleBookClick(book)} />
                          ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No books currently being read. Start reading something new!</p>
                    )}
                  </CardContent>
                </Card>

                {/* To Be Read */}
                <Card className="transition-all duration-300 hover:shadow-lg border-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-serif">To Be Read</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {plannedBooks.length} books
                      </Badge>
                      {plannedBooks.length > booksPerSection && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenViewAll('planned')}
                        >
                          View All
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {booksLoading ? (
                      <div className="text-muted-foreground">Loading your books...</div>
                    ) : plannedBooks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plannedBooks
                          .slice(0, booksPerSection)
                          .map(book => (
                            <BookCard key={book.id} book={book} onClick={() => handleBookClick(book)} />
                          ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No books in your reading list. Add some books you want to read!</p>
                    )}
                  </CardContent>
                </Card>

                {/* Read */}
                <Card className="transition-all duration-300 hover:shadow-lg border-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-serif">Read</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary text-primary-foreground">
                        {finishedBooks.length} books
                      </Badge>
                      {finishedBooks.length > booksPerSection && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenViewAll('finished')}
                        >
                          View All
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {booksLoading ? (
                      <div className="text-muted-foreground">Loading your books...</div>
                    ) : finishedBooks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {finishedBooks
                          .slice(0, booksPerSection)
                          .map(book => (
                            <BookCard key={book.id} book={book} onClick={() => handleBookClick(book)} />
                          ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No books completed yet. Keep reading!</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Activity Feed */}
              <div className="space-y-6">
                <ActivityFeed />
                
                {/* Quick Actions */}
                <Card className="transition-all duration-300 hover:shadow-lg border-2">
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

            {/* Section View All Modal */}
            <Dialog open={viewAllOpen} onOpenChange={setViewAllOpen}>
              <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">
                    {getSectionTitle(currentSection)} - All Books
                  </DialogTitle>
                </DialogHeader>
                {booksLoading ? (
                  <div className="text-muted-foreground">Loading your books...</div>
                ) : currentSectionBooks.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {paginatedSectionBooks.map(book => (
                        <BookCard key={book.id} book={book} onClick={() => { setViewAllOpen(false); handleBookClick(book); }} />
                      ))}
                    </div>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <button
                          className="p-2 rounded border disabled:opacity-50 hover:bg-muted"
                          onClick={() => setSectionPage(p => Math.max(1, p - 1))}
                          disabled={sectionPage === 1}
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i + 1}
                            className={`px-3 py-1 rounded border ${sectionPage === i + 1 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                            onClick={() => setSectionPage(i + 1)}
                            aria-label={`Go to page ${i + 1}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          className="p-2 rounded border disabled:opacity-50 hover:bg-muted"
                          onClick={() => setSectionPage(p => Math.min(totalPages, p + 1))}
                          disabled={sectionPage === totalPages}
                          aria-label="Next page"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No books in this section.</p>
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
              <Card className="transition-all duration-300 hover:shadow-lg border-2 text-center p-6">
                <Book className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-serif mb-2">Track Your Reading</h3>
                <p className="text-muted-foreground">Keep a digital log of all the books you've read, are reading, or want to read.</p>
              </Card>
              
              <Card className="transition-all duration-300 hover:shadow-lg border-2 text-center p-6">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-serif mb-2">Monitor Progress</h3>
                <p className="text-muted-foreground">Set reading goals and track your progress throughout the year.</p>
              </Card>
              
              <Card className="transition-all duration-300 hover:shadow-lg border-2 text-center p-6">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-serif mb-2">Connect with Readers</h3>
                <p className="text-muted-foreground">Follow friends and family to see what they're reading and get recommendations.</p>
              </Card>
            </div>

            {/* Sample books preview */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold font-serif mb-6">Sample Reading Journey</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>

            {/* Call to action */}
            <div className="text-center py-12">
              <h2 className="text-3xl font-bold font-serif mb-4">Ready to Start Your Reading Journey?</h2>
              <p className="text-foreground/80 mb-6 text-lg">Join thousands of readers who are already tracking their books with BookLogBook.</p>
              <Link to="/auth">
                <Button className="px-8 py-3 text-lg">
                  Get Started Today
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
