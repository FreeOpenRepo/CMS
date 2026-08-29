import { Article } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export async function fetchArticles(params?: { status?: string; category?: string }): Promise<Article[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.category && params.category !== 'All') query.set('category', params.category);

  const res = await fetch(`${API_BASE}/api/articles?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function fetchArticleById(id: number): Promise<Article> {
  const res = await fetch(`${API_BASE}/api/articles/${id}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function fetchArticleBySlug(slug: string): Promise<Article> {
  const res = await fetch(`${API_BASE}/api/articles/slug/${slug}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function createArticle(payload: {
  title: string;
  slug?: string;
  summary: string;
  contentHtml: string;
  category: string;
  tags: string;
  authorName: string;
  coverImageUrl?: string;
}): Promise<Article> {
  const res = await fetch(`${API_BASE}/api/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Article creation failed' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }

  return await res.json();
}

export async function updateArticle(id: number, payload: {
  title: string;
  slug?: string;
  summary: string;
  contentHtml: string;
  category: string;
  tags: string;
  coverImageUrl?: string;
}): Promise<Article> {
  const res = await fetch(`${API_BASE}/api/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Update failed' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }

  return await res.json();
}

export async function submitReview(id: number): Promise<Article> {
  const res = await fetch(`${API_BASE}/api/articles/${id}/submit`, {
    method: 'POST'
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Submission failed' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }

  return await res.json();
}

export async function publishArticle(id: number): Promise<Article> {
  const res = await fetch(`${API_BASE}/api/articles/${id}/publish`, {
    method: 'POST'
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Publishing failed' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }

  return await res.json();
}

export async function searchArticles(query: string): Promise<Article[]> {
  const res = await fetch(`${API_BASE}/api/articles/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/categories`);
  if (!res.ok) return ['All', 'Technology', 'Architecture', 'Engineering', 'Design', 'Performance'];
  return await res.json();
}
