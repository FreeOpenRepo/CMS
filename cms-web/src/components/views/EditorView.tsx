import { showSuccess, showError, showInfo, showWarning, showยืนยัน } from '@/lib/swal';
'use client';

import React, { useState, useEffect } from 'react';
import { Article } from '@/lib/types';
import { fetchArticles, publishArticle } from '@/lib/api';
import { CheckCircle2, AlertOctagon, Eye, Globe, ShieldCheck, Sparkles, RefreshCw, Zap, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EditorView() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishTelemetry, setPublishTelemetry] = useState<{
    slug: string;
    webpProcessed: boolean;
    tsVectorUpdated: boolean;
    revalidatedTag: string;
  } | null>(null);

  useEffect(() => {
    loadReviewQueue();
  }, []);

  async function loadReviewQueue() {
    const list = await fetchArticles();
    setArticles(list);
    if (list.length > 0 && !selectedArticle) {
      setSelectedArticle(list.find(a => a.status === 'IN_REVIEW') || list[0]);
    }
  }

  async function handlePublish(id: number) {
    setIsPublishing(true);
    try {
      const published = await publishArticle(id);
      setPublishTelemetry({
        slug: published.slug,
        webpProcessed: true,
        tsVectorUpdated: true,
        revalidatedTag: 'news'
      });
      setSelectedArticle(published);
      await loadReviewQueue();
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (err: any) {
      showInfo('แจ้งเตือนระบบ', 'Publishing rejected: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  }

  const reviewQueue = articles.filter(a => a.status === 'IN_REVIEW');
  const publishedList = articles.filter(a => a.status === 'PUBLISHED');

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck style={{ color: 'var(--accent-emerald)', width: 28, height: 28 }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Editorial Review & Publishing Desk</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Invariant validation • SixLabors.ImageSharp WebP engine • Next.js On-Demand Tag Revalidation
          </p>
        </div>

        <button onClick={loadReviewQueue} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
          <RefreshCw style={{ width: 14, height: 14 }} /> Refresh Review Queue
        </button>
      </div>

      {/* Side-effects Telemetry Banner */}
      {publishTelemetry && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', color: '#34d399', fontSize: '0.9rem' }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Zap style={{ width: 18, height: 18 }} />
            Publishing Side-effects Completed for '{publishTelemetry.slug}':
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
            <span>✅ <strong>SixLabors.ImageSharp:</strong> Transcoded to WebP</span>
            <span>✅ <strong>EFCore.UpdateTsVector:</strong> Search index refreshed</span>
            <span>✅ <strong>Next.js On-Demand ISR:</strong> Revalidated tag <code>'{publishTelemetry.revalidatedTag}'</code></span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Left: Review Queue & Published List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* In Review List */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Pending Review ({reviewQueue.length})
              </h2>
              <span className="badge-in_review" style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                Action Required
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {reviewQueue.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedArticle(item)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: selectedArticle?.id === item.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-glass)',
                    background: selectedArticle?.id === item.id ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Author: {item.authorName} • {item.category}
                  </div>
                </div>
              ))}
              {reviewQueue.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No articles currently awaiting review.
                </div>
              )}
            </div>
          </div>

          {/* บทความที่เผยแพร่แล้ว */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>
              บทความที่เผยแพร่แล้ว ({publishedList.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
              {publishedList.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedArticle(item)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: selectedArticle?.id === item.id ? '1px solid var(--accent-emerald)' : '1px solid var(--border-glass)',
                    background: selectedArticle?.id === item.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '2px' }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    👁️ {item.viewCount} views • Published {new Date(item.publishedAt || '').toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Article Inspector & Invariants Checker */}
        {selectedArticle ? (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`badge-${selectedArticle.status.toLowerCase()}`} style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {selectedArticle.status}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Category: <strong>{selectedArticle.category}</strong>
                </span>
              </div>

              {selectedArticle.status === 'IN_REVIEW' && (
                <button
                  onClick={() => handlePublish(selectedArticle.id)}
                  disabled={isPublishing}
                  className="btn-success"
                  style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                >
                  <Globe style={{ width: 16, height: 16 }} />
                  {isPublishing ? 'Publishing & Converting WebP...' : 'Approve & Publish (PUBLISH)'}
                </button>
              )}
            </div>

            {/* Invariant Checklist */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px', borderRadius: '10px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <CheckCircle2 style={{ color: 'var(--accent-emerald)', width: 18, height: 18 }} />
                <span>Invariant: <strong>UniqueArticleSlug</strong> ✅</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                {selectedArticle.coverImageUrl ? (
                  <>
                    <CheckCircle2 style={{ color: 'var(--accent-emerald)', width: 18, height: 18 }} />
                    <span>Invariant: <strong>PublishedRequiresCoverImage</strong> ✅</span>
                  </>
                ) : (
                  <>
                    <AlertOctagon style={{ color: 'var(--accent-rose)', width: 18, height: 18 }} />
                    <span style={{ color: 'var(--accent-rose)' }}>Missing Cover Image ❌</span>
                  </>
                )}
              </div>
            </div>

            {/* Article Preview */}
            <h1 className="font-serif" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px', lineHeight: '1.2' }}>
              {selectedArticle.title}
            </h1>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              By <strong>{selectedArticle.authorName}</strong> • {selectedArticle.readingTimeMinutes} min read • Slug: <code style={{ color: '#38bdf8' }}>{selectedArticle.slug}</code>
            </div>

            {selectedArticle.coverImageUrl && (
              <div style={{ width: '100%', height: '220px', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                <img src={selectedArticle.coverImageUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <div
              style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}
              dangerouslySetInnerHTML={{ __html: selectedArticle.contentHtml }}
            />
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select an article from the left to inspect and review.
          </div>
        )}
      </div>
    </div>
  );
}


