import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const bookSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(500, 'Title must be less than 500 characters'),
  author_name: z.string().trim().min(1, 'Author name is required').max(200, 'Author name must be less than 200 characters'),
  cover_url: z.string().url('Invalid cover URL').optional().nullable(),
  description: z.string().max(10000, 'Description must be less than 10000 characters').optional().nullable(),
  isbn: z.string().max(20, 'ISBN must be less than 20 characters').optional().nullable(),
  page_count: z.number().int().min(1, 'Page count must be at least 1').max(100000, 'Page count seems unreasonably large').optional().nullable(),
  published_date: z.string().optional().nullable(),
  google_books_url: z.string().url('Invalid Google Books URL').optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    console.log('Received request body:', body);

    const validatedData = bookSchema.parse(body);
    console.log('Validated data:', validatedData);

    // 1. Check or create author
    let authorId: string | null = null;
    const { data: existingAuthor } = await supabaseClient
      .from('authors')
      .select('id')
      .eq('name', validatedData.author_name)
      .maybeSingle();

    if (existingAuthor) {
      authorId = existingAuthor.id;
      console.log('Found existing author:', authorId);
    } else {
      const { data: newAuthor, error: authorError } = await supabaseClient
        .from('authors')
        .insert({ name: validatedData.author_name })
        .select('id')
        .single();

      if (authorError) {
        console.error('Error creating author:', authorError);
        throw new Error('Failed to create author');
      }
      authorId = newAuthor.id;
      console.log('Created new author:', authorId);
    }

    // 2. Check if book already exists (by title and author)
    const { data: existingBook } = await supabaseClient
      .from('books')
      .select('id')
      .eq('title', validatedData.title)
      .eq('author_id', authorId)
      .maybeSingle();

    if (existingBook) {
      console.log('Book already exists:', existingBook.id);
      return new Response(JSON.stringify({ 
        book_id: existingBook.id,
        author_id: authorId,
        message: 'Book already exists' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Create new book
    const { data: newBook, error: bookError } = await supabaseClient
      .from('books')
      .insert({
        title: validatedData.title,
        author_id: authorId,
        cover_url: validatedData.cover_url,
        description: validatedData.description,
        isbn: validatedData.isbn,
        page_count: validatedData.page_count,
        published_date: validatedData.published_date,
        google_books_url: validatedData.google_books_url,
      })
      .select('id')
      .single();

    if (bookError) {
      console.error('Error creating book:', bookError);
      throw new Error('Failed to create book');
    }

    console.log('Created new book:', newBook.id);

    return new Response(JSON.stringify({ 
      book_id: newBook.id,
      author_id: authorId,
      message: 'Book created successfully'
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        details: error.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.error('Server error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
