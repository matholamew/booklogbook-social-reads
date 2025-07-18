
interface Env {
  // Add any environment variables needed here
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const title = url.searchParams.get('title');
  const author = url.searchParams.get('author');

  if (!title || !author) {
    return new Response('Missing title or author', { status: 400 });
  }

  const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}&maxResults=1`;

  try {
    const response = await fetch(googleBooksUrl);
    if (!response.ok) {
      throw new Error(`Google Books API responded with status ${response.status}`);
    }
    const data = await response.json();
    const coverUrl = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;

    if (coverUrl) {
      return new Response(JSON.stringify({ coverUrl }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Cover not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching from Google Books API:', error);
    return new Response('Error fetching book cover', { status: 500 });
  }
};
