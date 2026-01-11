import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request parameters
    const url = new URL(req.url)
    const query = url.searchParams.get('q')
    const maxResults = url.searchParams.get('maxResults') || '10'

    if (!query) {
      console.log('Missing query parameter')
      return new Response(
        JSON.stringify({ error: 'Missing query parameter', items: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Google API key from secrets
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY')
    if (!googleApiKey) {
      console.error('GOOGLE_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Server configuration error', items: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call Google Books API
    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${googleApiKey}`
    
    console.log('Searching Google Books for:', query)
    
    const response = await fetch(googleBooksUrl)
    if (!response.ok) {
      console.error('Google Books API error:', response.status, await response.text())
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Google Books API', items: [] }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    
    console.log(`Found ${data.totalItems || 0} results for "${query}"`)
    
    // Transform and return results
    const items = (data.items || []).map((item: any) => {
      const info = item.volumeInfo || {}
      const imageLinks = info.imageLinks || {}
      
      return {
        id: item.id,
        title: info.title || 'Unknown Title',
        authors: info.authors || [],
        coverUrl: (imageLinks.large || imageLinks.medium || imageLinks.small || imageLinks.thumbnail || '')
          .replace('http://', 'https://'),
        description: info.description || '',
        pageCount: info.pageCount || null,
        publishedDate: info.publishedDate || null,
        isbn: (info.industryIdentifiers || []).find((id: any) => id.type === 'ISBN_13')?.identifier 
          || (info.industryIdentifiers || []).find((id: any) => id.type === 'ISBN_10')?.identifier 
          || null,
        googleBooksUrl: info.infoLink || null,
        categories: info.categories || [],
        language: info.language || null,
        publisher: info.publisher || null,
      }
    })

    return new Response(
      JSON.stringify({ items, totalItems: data.totalItems || 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in search-google-books:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', items: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
