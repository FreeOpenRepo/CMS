'use client';

import React, { useState, useEffect } from 'react';
import { Article } from '@/lib/types';
import { fetchArticles, searchArticles, fetchCategories } from '@/lib/api';
import { Search, BookOpen, Clock, Eye, Sparkles, X, Share2, ArrowRight } from 'lucide-react';

export default function ReaderView() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCategoriesAndArticles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const debounce = setTimeout(handleSearch, 300);
      return () => clearTimeout(debounce);
    } else {
      loadArticlesByCategory(activeCategory);
    }
  }, [searchQuery, activeCategory]);

  async function loadCategoriesAndArticles() {
    const [cats, arts] = await Promise.all([
      fetchCategories(),
      fetchArticles({ status: 'PUBLISHED' })
    ]);
    setCategories(cats);
    setArticles(arts);
  }

  async function loadArticlesByCategory(category: string) {
    setIsLoading(true);
    try {
      const arts = await fetchArticles({
        status: 'PUBLISHED',
        category: category !== 'All' ? category : undefined
      });
      setArticles(arts);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch() {
    setIsLoading(true);
    try {
      const results = await searchArticles(searchQuery);
      setArticles(results);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh' }}>
      {/* Hero Banner */}
      <div style={{ textAlign: 'center', margin: '30px 0 40px 0' }}>
        <h1 className="font-serif" style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '12px' }}>
          ENGINEERING & ARCHITECTURE DISPATCH
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
          Ultra-low latency content delivered via Next.js 16 Partial Prerendering and .NET 10 HybridCache.
        </p>

        {/* Search Bar */}
        <div style={{ maxWidth: '540px', margin: '24px auto 0 auto', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '16px', top: '14px', width: 20, height: 20, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search articles by title, content, or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              borderRadius: '30px',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border-glass-bright)',
              color: '#fff',
              fontSize: '0.95rem',
              outline: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setSearchQuery('');
            }}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: activeCategory === cat ? '1px solid var(--accent-cyan)' : '1px solid var(--border-glass)',
              background: activeCategory === cat ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: activeCategory === cat ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: activeCategory === cat ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
        {articles.map(article => (
          <article
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="glass-panel glass-panel-hover"
            style={{ padding: '0', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
          >
            {/* Cover Image */}
            {article.coverImageUrl && (
              <div style={{ width: '100%', height: '180px', position: 'relative' }}>
                <img src={article.coverImageUrl} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {article.category}
                </span>
              </div>
            )}

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span>{article.authorName}</span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock style={{ width: 12, height: 12 }} /> {article.readingTimeMinutes} min read
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Eye style={{ width: 12, height: 12 }} /> {article.viewCount}
                </span>
              </div>

              <h2 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '8px', lineHeight: '1.3' }}>
                {article.title}
              </h2>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px', flex: 1 }}>
                {article.summary}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Read Article <ArrowRight style={{ width: 14, height: 14 }} />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {articles.length === 0 && !isLoading && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          No published articles found matching your criteria.
        </div>
      )}

      {/* Full Article Reading Modal */}
      {selectedArticle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}>
          <div className="glass-panel" style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                {selectedArticle.category} • {selectedArticle.readingTimeMinutes} min read
              </span>
              <button onClick={() => setSelectedArticle(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X style={{ width: 22, height: 22 }} />
              </button>
            </div>

            <div style={{ padding: '28px', overflowY: 'auto', flex: 1 }}>
              <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px', lineHeight: '1.2' }}>
                {selectedArticle.title}
              </h1>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', display: 'flex', gap: '12px' }}>
                <span>By <strong>{selectedArticle.authorName}</strong></span>
                <span>•</span>
                <span>Published on {new Date(selectedArticle.publishedAt || '').toLocaleDateString()}</span>
                <span>•</span>
                <span>👁️ {selectedArticle.viewCount} views</span>
              </div>

              {selectedArticle.coverImageUrl && (
                <div style={{ width: '100%', height: '280px', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
                  <img src={selectedArticle.coverImageUrl} alt={selectedArticle.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div
                style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#e2e8f0' }}
                dangerouslySetInnerHTML={{ __html: selectedArticle.contentHtml }}
              />
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                SEO Canonical Slug: <code style={{ color: '#38bdf8' }}>/{selectedArticle.slug}</code>
              </div>
              <button onClick={() => setSelectedArticle(null)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
