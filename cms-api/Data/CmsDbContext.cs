using Microsoft.EntityFrameworkCore;
using cms_api.Models;

namespace cms_api.Data;

public class CmsDbContext : DbContext
{
    public CmsDbContext(DbContextOptions<CmsDbContext> options) : base(options)
    {
    }

    public DbSet<Article> Articles => Set<Article>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Article>().HasIndex(a => a.Slug).IsUnique();

        // Seed initial articles
        modelBuilder.Entity<Article>().HasData(
            new Article
            {
                Id = 1,
                Title = "Architecting Ultra-Low Latency Web Engines with .NET 10 & Next.js 16",
                Slug = "architecting-ultra-low-latency-web-engines-dotnet-10-nextjs-16",
                Summary = "Discover how combining Next.js 16 Partial Prerendering (PPR) with .NET 10 Minimal APIs achieves sub-30ms response times for million-scale traffic.",
                ContentHtml = "<p>Modern web engineering requires a paradigm shift from traditional monolithic rendering to edge-first hybrid static-dynamic architectures. By leveraging <strong>Next.js 16 Partial Prerendering (PPR)</strong>, the outer document shell and navigational layouts are streamed immediately from edge CDN caches while dynamic personalization blocks resolve asynchronously.</p><h3>The Backend Advantage with .NET 10</h3><p>.NET 10 introduces revolutionary JIT optimizations, Tiered PGO, and native Ahead-of-Time (AOT) compilation that drastically reduce memory footprint while processing tens of thousands of requests per second.</p><blockquote>Combining Edge Prerendering with High-Throughput Micro-Engines is the gold standard for enterprise publishing platforms.</blockquote>",
                Category = "Architecture",
                Tags = "dotnet, nextjs, performance, ppr, csharp",
                AuthorName = "Aung G. (Principal Architect)",
                CoverImageUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
                WebpCoverImageUrl = "data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vv95gAAA=",
                Status = ArticleStatus.PUBLISHED,
                ReadingTimeMinutes = 5,
                ViewCount = 1420,
                SearchVector = "'architecting':1 'ultra-low':2 'latency':3 'web':4 'engines':5 'dotnet':6 'nextjs':7 'performance':8",
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                SubmittedAt = DateTime.UtcNow.AddDays(-2),
                PublishedAt = DateTime.UtcNow.AddDays(-2)
            },
            new Article
            {
                Id = 2,
                Title = "Why SixLabors.ImageSharp & WebP Optimization Drastically Cuts CDN Bandwidth",
                Slug = "sixlabors-imagesharp-webp-optimization-cuts-cdn-bandwidth",
                Summary = "A deep dive into automated image transcoding on the server side: how WebP generation saves 70% of payload size without perceptual quality loss.",
                ContentHtml = "<p>Images represent over 65% of total page payload on modern media publications. Delivering unoptimized high-resolution JPEG or PNG assets to mobile clients causes severe Largest Contentful Paint (LCP) regressions and inflates bandwidth egress costs.</p><p>By incorporating <code>SixLabors.ImageSharp</code> into the publishing pipeline, raw uploads are automatically resized to device viewports and transcoded to next-generation WebP formats with perceptual quantization algorithms.</p>",
                Category = "Engineering",
                Tags = "imagesharp, webp, optimization, cdn, performance",
                AuthorName = "Elena Vance (Media Systems Lead)",
                CoverImageUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
                WebpCoverImageUrl = "data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vv95gAAA=",
                Status = ArticleStatus.PUBLISHED,
                ReadingTimeMinutes = 4,
                ViewCount = 890,
                SearchVector = "'sixlabors':1 'imagesharp':2 'webp':3 'optimization':4 'cdn':5 'bandwidth':6 'image':7",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                SubmittedAt = DateTime.UtcNow.AddDays(-1),
                PublishedAt = DateTime.UtcNow.AddDays(-1)
            },
            new Article
            {
                Id = 3,
                Title = "Designing Headless Content Workflows with Tiptap and Invariant Verification",
                Slug = "designing-headless-content-workflows-tiptap-invariant-verification",
                Summary = "Draft article exploring how domain invariants like unique slug validation and mandatory cover images prevent editorial publishing errors.",
                ContentHtml = "<p>Editorial workflows in high-velocity newsrooms require strict guardrails. When authors submit drafts, the editorial engine must validate constraints before content hits the CDN.</p><p>This article examines the transition from <code>DRAFT</code> to <code>IN_REVIEW</code> and finally <code>PUBLISHED</code>, including automated tag revalidation hooks.</p>",
                Category = "Technology",
                Tags = "tiptap, cms, workflow, invariants",
                AuthorName = "Marcus Brody (Editorial Staff)",
                CoverImageUrl = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
                Status = ArticleStatus.IN_REVIEW,
                ReadingTimeMinutes = 3,
                ViewCount = 45,
                SearchVector = "'designing':1 'headless':2 'content':3 'workflows':4 'tiptap':5 'invariant':6",
                CreatedAt = DateTime.UtcNow.AddHours(-3),
                SubmittedAt = DateTime.UtcNow.AddHours(-1)
            }
        );
    }
}
