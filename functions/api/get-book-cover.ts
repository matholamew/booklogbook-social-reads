
interface Env {
  GOOGLE_API_KEY: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const title = url.searchParams.get('title');
  const author = url.searchParams.get('author');

  if (!title || !author) {
    return new Response('Missing title or author', { 
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}&maxResults=1&key=${env.GOOGLE_API_KEY}`;

  try {
    const response = await fetch(googleBooksUrl);
    if (!response.ok) {
      throw new Error(`Google Books API responded with status ${response.status}`);
    }
    const data = await response.json();
    
    // Try to get the highest quality image available
    const imageLinks = data.items?.[0]?.volumeInfo?.imageLinks;
    const coverUrl = (
      imageLinks?.large ||
      imageLinks?.medium ||
      imageLinks?.small ||
      imageLinks?.thumbnail
    )?.replace('http://', 'https://');

    if (coverUrl) {
      return new Response(JSON.stringify({ coverUrl }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    } else {
      return new Response('Cover not found', { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error) {
    console.error('Error fetching from Google Books API:', error);
    return new Response('Error fetching book cover', { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
