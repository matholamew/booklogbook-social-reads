import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, BookOpen, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Recommendation {
  title: string;
  author: string;
  reason: string;
}

export const BookRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchRecommendations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        'https://fabdzoyrghfjvxbgdgnm.supabase.co/functions/v1/get-book-recommendations',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          toast({ title: 'Rate Limited', description: 'Please wait a moment before trying again.' });
        } else if (response.status === 402) {
          toast({ title: 'Credits Required', description: 'AI credits are depleted.' });
        } else {
          toast({ title: 'Error', description: error.error || 'Failed to get recommendations.' });
        }
        return;
      }

      const data = await response.json();
      
      if (data.message) {
        toast({ title: 'Note', description: data.message });
      }
      
      setRecommendations(data.recommendations || []);
      setHasLoaded(true);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({ title: 'Error', description: 'Failed to fetch recommendations.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = async (rec: Recommendation) => {
    if (!user) return;

    try {
      // Check/create author
      let { data: authorData } = await supabase
        .from('authors')
        .select('id')
        .eq('name', rec.author)
        .maybeSingle();

      let authorId = authorData?.id;
      if (!authorId) {
        const { data: newAuthor, error: authorError } = await supabase
          .from('authors')
          .insert({ name: rec.author, created_by: user.id })
          .select('id')
          .single();
        if (authorError) throw authorError;
        authorId = newAuthor.id;
      }

      // Check/create book
      let { data: bookData } = await supabase
        .from('books')
        .select('id')
        .eq('title', rec.title)
        .eq('author_id', authorId)
        .maybeSingle();

      let bookId = bookData?.id;
      if (!bookId) {
        // Fetch cover from Google Books API via Edge Function
        let cover_url: string | null = null;
        try {
          const session = await supabase.auth.getSession();
          const coverResponse = await fetch(
            `https://fabdzoyrghfjvxbgdgnm.supabase.co/functions/v1/get-book-cover?title=${encodeURIComponent(rec.title)}&author=${encodeURIComponent(rec.author)}`,
            {
              headers: {
                'Authorization': `Bearer ${session.data.session?.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (coverResponse.ok) {
            const data = await coverResponse.json();
            cover_url = data.coverUrl?.replace('http://', 'https://') || null;
          }
        } catch (coverError) {
          console.error('Error fetching cover for recommendation:', coverError);
        }

        const { data: newBook, error: bookError } = await supabase
          .from('books')
          .insert({ 
            title: rec.title, 
            author_id: authorId, 
            created_by: user.id,
            cover_url 
          })
          .select('id')
          .single();
        if (bookError) throw bookError;
        bookId = newBook.id;
      }

      // Check if already in library
      const { data: existingBook } = await supabase
        .from('user_books')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();

      if (existingBook) {
        toast({ title: 'Already Added', description: 'This book is already in your library.' });
        return;
      }

      // Add to user_books
      const { error: insertError } = await supabase
        .from('user_books')
        .insert({ user_id: user.id, book_id: bookId, status: 'planned' });

      if (insertError) throw insertError;

      toast({ title: 'Book Added!', description: `"${rec.title}" added to your reading list.` });
    } catch (error: any) {
      console.error('Error adding book:', error);
      toast({ title: 'Error', description: error.message || 'Failed to add book.' });
    }
  };

  if (!user) return null;

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-serif flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Recommendations
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRecommendations}
          disabled={loading}
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : hasLoaded ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            'Get Recommendations'
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {!hasLoaded && !loading ? (
          <p className="text-muted-foreground text-sm">
            Click "Get Recommendations" to get personalized book suggestions based on your reading history.
          </p>
        ) : loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Analyzing your reading taste...
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Add more books to your library to get better recommendations!
          </p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                      <h4 className="font-medium text-foreground truncate">{rec.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">by {rec.author}</p>
                    <p className="text-sm text-foreground/80 mt-1">{rec.reason}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleAddToLibrary(rec)}
                    className="flex-shrink-0"
                    title="Add to library"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
