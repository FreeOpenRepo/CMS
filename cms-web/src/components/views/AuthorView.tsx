import { showSuccess, showError, showInfo, showWarning, showยืนยัน } from '@/lib/swal';
'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Article } from '@/lib/types';
import { fetchArticles, createArticle, submitReview } from '@/lib/api';
import { PenTool, Bold, Italic, Heading1, Heading2, List, Quote, Code, Send, Save, Sparkles, Image as ImageIcon, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AuthorView() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('Technology');
  const [tags, setTags] = useState('nextjs, dotnet, ppr');
  const [authorName, setAuthorName] = useState('Aung G.');
  const [coverImageUrl, setCoverImageUrl] = useState('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [myDrafts, setMyDrafts] = useState<Article[]>([]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start drafting your high-impact story here with rich formatting, code blocks, and blockquotes...</p>',
    immediatelyRender: false
  });

  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
    const articles = await fetchArticles();
    setMyDrafts(articles.filter(a => a.status === 'DRAFT' || a.status === 'IN_REVIEW'));
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
    setSlug(autoSlug);
  }

  async function handleSaveDraft(andSubmit = false) {
    if (!title || !editor) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const htmlContent = editor.getHTML();
      const created = await createArticle({
        title,
        slug,
        summary: summary || title,
        contentHtml: htmlContent,
        category,
        tags,
        authorName,
        coverImageUrl: coverImageUrl || undefined
      });

      if (andSubmit) {
        await submitReview(created.id);
      }

      setTitle('');
      setSlug('');
      setSummary('');
      editor.commands.setContent('<p>Write another inspiring article...</p>');
      await loadDrafts();
      confetti({ particleCount: 60, spread: 70 });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save draft.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitExistingDraft(id: number) {
    try {
      await submitReview(id);
      await loadDrafts();
      confetti({ particleCount: 40, spread: 60 });
    } catch (err: any) {
      showInfo('แจ้งเตือนระบบ', 'Submit failed: ' + err.message);
    }
  }

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh' }}>
      {/* Author Header */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PenTool style={{ color: 'var(--accent-cyan)', width: 26, height: 26 }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Headless Article Composer</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Tiptap WYSIWYG Editor • Slug generation & Invariant validation • Submit to review queue
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleSaveDraft(false)}
            disabled={isSubmitting || !title}
            className="btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <Save style={{ width: 16, height: 16 }} /> Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSaveDraft(true)}
            disabled={isSubmitting || !title}
            className="btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <Send style={{ width: 16, height: 16 }} /> Submit for Review
          </button>
        </div>
      </div>

      {errorMessage && (
        <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.4)', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', color: '#fca5a5', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle style={{ width: 20, height: 20, flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main Editor Pane */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {/* Article Title */}
          <input
            type="text"
            placeholder="Enter an engaging headline..."
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            style={{
              width: '100%',
              fontSize: '1.6rem',
              fontWeight: 800,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              marginBottom: '16px',
              borderBottom: '1px solid var(--border-glass)',
              paddingBottom: '12px'
            }}
          />

          {/* Tiptap Formatting Toolbar */}
          {editor && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: editor.isActive('bold') ? 'rgba(6,182,212,0.3)' : 'transparent', color: editor.isActive('bold') ? 'var(--accent-cyan)' : '#cbd5e1', cursor: 'pointer' }}
              >
                <Bold style={{ width: 15, height: 15 }} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: editor.isActive('italic') ? 'rgba(6,182,212,0.3)' : 'transparent', color: editor.isActive('italic') ? 'var(--accent-cyan)' : '#cbd5e1', cursor: 'pointer' }}
              >
                <Italic style={{ width: 15, height: 15 }} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: editor.isActive('heading', { level: 1 }) ? 'rgba(6,182,212,0.3)' : 'transparent', color: '#cbd5e1', cursor: 'pointer' }}
              >
                <Heading1 style={{ width: 15, height: 15 }} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: editor.isActive('heading', { level: 2 }) ? 'rgba(6,182,212,0.3)' : 'transparent', color: '#cbd5e1', cursor: 'pointer' }}
              >
                <Heading2 style={{ width: 15, height: 15 }} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: editor.isActive('bulletList') ? 'rgba(6,182,212,0.3)' : 'transparent', color: '#cbd5e1', cursor: 'pointer' }}
              >
                <List style={{ width: 15, height: 15 }} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: editor.isActive('blockquote') ? 'rgba(6,182,212,0.3)' : 'transparent', color: '#cbd5e1', cursor: 'pointer' }}
              >
                <Quote style={{ width: 15, height: 15 }} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: editor.isActive('codeBlock') ? 'rgba(6,182,212,0.3)' : 'transparent', color: '#cbd5e1', cursor: 'pointer' }}
              >
                <Code style={{ width: 15, height: 15 }} />
              </button>
            </div>
          )}

          {/* Tiptap Editor Content */}
          <div style={{ minHeight: '300px', padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-glass)' }}>
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Sidebar: Metadata & Publishing Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metadata Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>Article Metadata</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  URL Slug (UniqueArticleSlug Invariant) *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#38bdf8', fontSize: '0.85rem' }}
                  className="font-mono"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="Technology" style={{ background: '#0f172a' }}>Technology</option>
                  <option value="Architecture" style={{ background: '#0f172a' }}>Architecture</option>
                  <option value="Engineering" style={{ background: '#0f172a' }}>Engineering</option>
                  <option value="Design" style={{ background: '#0f172a' }}>Design</option>
                  <option value="Performance" style={{ background: '#0f172a' }}>Performance</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Author Name
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Short Summary / Abstract
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Cover Image URL (PublishedRequiresCoverImage)
                </label>
                <input
                  type="text"
                  value={coverImageUrl}
                  onChange={e => setCoverImageUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.8rem' }}
                />
                {coverImageUrl && (
                  <div style={{ marginTop: '8px', width: '100%', height: '100px', borderRadius: '6px', overflow: 'hidden' }}>
                    <img src={coverImageUrl} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drafts Queue */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px' }}>
              My Drafts & Submissions ({myDrafts.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
              {myDrafts.map(draft => (
                <div key={draft.id} style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{draft.title}</div>
                    <span className={`badge-${draft.status.toLowerCase()}`} style={{ padding: '2px 6px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>
                      {draft.status}
                    </span>
                  </div>
                  {draft.status === 'DRAFT' && (
                    <button
                      onClick={() => handleSubmitExistingDraft(draft.id)}
                      className="btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    >
                      Submit →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


