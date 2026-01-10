import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY')
    
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get books without covers
    const { data: books, error: fetchError } = await supabase
      .from('books')
      .select('id, title, author_id, authors(name)')
      .is('cover_url', null)
      .limit(50)

    if (fetchError) {
      console.error('Error fetching books:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch books' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${books?.length || 0} books without covers`)

    const results: { title: string; success: boolean; coverUrl?: string }[] = []

    for (const book of books || []) {
      const authorName = (book.authors as any)?.name || ''
      
      try {
        const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(book.title)}+inauthor:${encodeURIComponent(authorName)}&maxResults=1&key=${googleApiKey}`
        
        console.log(`Fetching cover for: ${book.title} by ${authorName}`)
        
        const response = await fetch(googleBooksUrl)
        if (!response.ok) {
          console.error(`Google API error for ${book.title}:`, response.status)
          results.push({ title: book.title, success: false })
          continue
        }

        const data = await response.json()
        const imageLinks = data.items?.[0]?.volumeInfo?.imageLinks
        const coverUrl = (
          imageLinks?.large ||
          imageLinks?.medium ||
          imageLinks?.small ||
          imageLinks?.thumbnail
        )?.replace('http://', 'https://')

        if (coverUrl) {
          const { error: updateError } = await supabase
            .from('books')
            .update({ cover_url: coverUrl })
            .eq('id', book.id)

          if (updateError) {
            console.error(`Failed to update ${book.title}:`, updateError)
            results.push({ title: book.title, success: false })
          } else {
            console.log(`Updated cover for ${book.title}: ${coverUrl}`)
            results.push({ title: book.title, success: true, coverUrl })
          }
        } else {
          console.log(`No cover found for ${book.title}`)
          results.push({ title: book.title, success: false })
        }

        // Rate limit: wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error processing ${book.title}:`, error)
        results.push({ title: book.title, success: false })
      }
    }

    return new Response(
      JSON.stringify({ 
        processed: results.length,
        successful: results.filter(r => r.success).length,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Backfill error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
