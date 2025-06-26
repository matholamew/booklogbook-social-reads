import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  GOOGLE_BOOKS_API_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  if (!q) {
    return new Response('Missing search query', { status: 400 }) as unknown as Response;
  }

  const apiKey = env.GOOGLE_BOOKS_API_KEY;
  const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&key=${apiKey}`;

  const apiRes = await fetch(apiUrl);
  const data = await apiRes.text();

  return new Response(data, {
    status: apiRes.status,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Response;
}; 