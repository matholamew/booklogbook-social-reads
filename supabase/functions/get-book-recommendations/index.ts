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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching reading history for user:', user.id)

    // Fetch user's reading history with book details
    const { data: userBooks, error: booksError } = await supabase
      .from('user_books')
      .select(`
        status,
        favorite,
        books (
          title,
          description,
          authors (name)
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (booksError) {
      console.error('Error fetching user books:', booksError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch reading history' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!userBooks || userBooks.length === 0) {
      return new Response(
        JSON.stringify({ 
          recommendations: [],
          message: 'Add some books to your library to get personalized recommendations!'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build reading profile for AI
    const finishedBooks = userBooks
      .filter((ub: any) => ub.status === 'finished')
      .map((ub: any) => `"${ub.books?.title}" by ${ub.books?.authors?.name || 'Unknown'}`)
    
    const currentlyReading = userBooks
      .filter((ub: any) => ub.status === 'reading')
      .map((ub: any) => `"${ub.books?.title}" by ${ub.books?.authors?.name || 'Unknown'}`)
    
    const favorites = userBooks
      .filter((ub: any) => ub.favorite)
      .map((ub: any) => `"${ub.books?.title}" by ${ub.books?.authors?.name || 'Unknown'}`)
    
    const plannedBooks = userBooks
      .filter((ub: any) => ub.status === 'planned')
      .map((ub: any) => `"${ub.books?.title}" by ${ub.books?.authors?.name || 'Unknown'}`)

    const readingProfile = `
Reading Profile:
- Books completed: ${finishedBooks.length > 0 ? finishedBooks.join(', ') : 'None yet'}
- Currently reading: ${currentlyReading.length > 0 ? currentlyReading.join(', ') : 'Nothing currently'}
- Favorite books: ${favorites.length > 0 ? favorites.join(', ') : 'No favorites marked'}
- Books on TBR list: ${plannedBooks.length > 0 ? plannedBooks.join(', ') : 'None'}
`.trim()

    console.log('Reading profile:', readingProfile)

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are a book recommendation expert. Based on a user's reading history, suggest 5 books they might enjoy. Focus on:
1. Similar genres and themes to books they've finished or favorited
2. Authors with similar writing styles
3. Books that complement their current reading
4. Avoid suggesting books already in their library

Return recommendations in valid JSON format only, no additional text. Use this exact structure:
{
  "recommendations": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "reason": "Brief explanation of why this book matches their taste (1-2 sentences)"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Based on this reading profile, suggest 5 books:\n\n${readingProfile}`
          }
        ],
      }),
    })

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.error('AI gateway error:', aiResponse.status)
      return new Response(
        JSON.stringify({ error: 'Failed to generate recommendations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content || ''
    
    console.log('AI response content:', content)

    // Parse the JSON response
    let recommendations = []
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        recommendations = parsed.recommendations || []
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      return new Response(
        JSON.stringify({ error: 'Failed to parse recommendations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ recommendations }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in get-book-recommendations:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
