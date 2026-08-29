using cms_api.Data;
using cms_api.Models;
using cms_api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace cms_api.Tests;

public class DomainInvariantTests
{
    private CmsDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<CmsDbContext>()
            .UseInMemoryDatabase(databaseName: $"CmsTestDb_{Guid.NewGuid()}")
            .Options;

        var db = new CmsDbContext(options);
        db.Database.EnsureCreated();
        return db;
    }

    [Fact]
    public async Task Invariant_UniqueArticleSlug_RejectsDuplicateSlug()
    {
        using var db = CreateInMemoryDbContext();
        var webpService = new ImageWebpService(NullLogger<ImageWebpService>.Instance);
        var articleService = new ArticleService(db, webpService, NullLogger<ArticleService>.Instance);

        // First article with custom slug
        await articleService.CreateArticleAsync(new CreateArticleRequest(
            Title: "First Post on Next.js 16",
            Slug: "nextjs-16-deep-dive",
            Summary: "Introduction to Next.js 16 features",
            ContentHtml: "<p>Hello World</p>",
            Category: "Technology",
            Tags: "nextjs, react",
            AuthorName: "Alice"
        ));

        // Second article with DUPLICATE slug
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            articleService.CreateArticleAsync(new CreateArticleRequest(
                Title: "Another Next.js 16 Article",
                Slug: "nextjs-16-deep-dive", // Duplicate!
                Summary: "Duplicate slug test",
                ContentHtml: "<p>Testing duplicate slug</p>",
                Category: "Technology",
                Tags: "nextjs",
                AuthorName: "Bob"
            ))
        );

        Assert.Contains("UniqueArticleSlug", ex.Message);
    }

    [Fact]
    public async Task Invariant_PublishedRequiresCoverImage_RejectsPublishingWithoutCoverImage()
    {
        using var db = CreateInMemoryDbContext();
        var webpService = new ImageWebpService(NullLogger<ImageWebpService>.Instance);
        var articleService = new ArticleService(db, webpService, NullLogger<ArticleService>.Instance);

        // Create draft article without cover image (CoverImageUrl = null)
        var article = await articleService.CreateArticleAsync(new CreateArticleRequest(
            Title: "Article without image",
            Slug: "article-without-image",
            Summary: "Testing published requires image",
            ContentHtml: "<p>Text content only</p>",
            Category: "Architecture",
            Tags: "testing",
            AuthorName: "Charlie",
            CoverImageUrl: null // Missing!
        ));

        // Submit for review (DRAFT -> IN_REVIEW)
        await articleService.SubmitReviewAsync(article.Id);

        // Attempting to PUBLISH without cover image
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            articleService.PublishArticleAsync(article.Id)
        );

        Assert.Contains("PublishedRequiresCoverImage", ex.Message);
    }

    [Fact]
    public async Task StateTransitions_PublishArticle_ProcessesWebpAndUpdatesSearchTsVector()
    {
        using var db = CreateInMemoryDbContext();
        var webpService = new ImageWebpService(NullLogger<ImageWebpService>.Instance);
        var articleService = new ArticleService(db, webpService, NullLogger<ArticleService>.Instance);

        // 1. Create DRAFT
        var article = await articleService.CreateArticleAsync(new CreateArticleRequest(
            Title: "High Performance Cloudflare R2 Storage",
            Slug: "cloudflare-r2-storage",
            Summary: "Using R2 for zero-egress cost asset hosting",
            ContentHtml: "<p>Cloudflare R2 provides S3 compatible API with zero egress fees.</p>",
            Category: "Engineering",
            Tags: "cloudflare, storage, r2",
            AuthorName: "Dave",
            CoverImageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80"
        ));
        Assert.Equal(ArticleStatus.DRAFT, article.Status);

        // 2. Submit Review (IN_REVIEW)
        var inReview = await articleService.SubmitReviewAsync(article.Id);
        Assert.Equal(ArticleStatus.IN_REVIEW, inReview.Status);
        Assert.NotNull(inReview.SubmittedAt);

        // 3. Publish Article (PUBLISHED)
        var published = await articleService.PublishArticleAsync(article.Id);
        Assert.Equal(ArticleStatus.PUBLISHED, published.Status);
        Assert.NotNull(published.PublishedAt);
        Assert.NotNull(published.WebpCoverImageUrl);
        Assert.StartsWith("data:image/webp;base64,", published.WebpCoverImageUrl);

        // 4. Verify Full-Text Search
        var searchResults = await articleService.SearchArticlesAsync("Cloudflare R2");
        Assert.NotEmpty(searchResults);
        Assert.Contains(searchResults, a => a.Id == article.Id);
    }
}
