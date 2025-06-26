import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  if (!q) {
    return new Response('Missing search query', { status: 400 });
  }

  const apiKey = env.GOOGLE_BOOKS_API_KEY;
  const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&key=${apiKey}`;

  const apiRes = await fetch(apiUrl);
  const data = await apiRes.text();

  return new Response(data, {
    status: apiRes.status,
    headers: { 'Content-Type': 'application/json' },
  });
}; 