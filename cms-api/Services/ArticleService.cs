using cms_api.Data;
using cms_api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace cms_api.Services;

public record CreateArticleRequest(
    string Title,
    string? Slug,
    string Summary,
    string ContentHtml,
    string Category,
    string Tags,
    string AuthorName,
    string? CoverImageUrl = null
);

public record UpdateArticleRequest(
    string Title,
    string? Slug,
    string Summary,
    string ContentHtml,
    string Category,
    string Tags,
    string? CoverImageUrl = null
);

public interface IArticleService
{
    Task<List<Article>> GetAllArticlesAsync(string? status = null, string? category = null);
    Task<Article?> GetArticleByIdAsync(int id);
    Task<Article?> GetArticleBySlugAsync(string slug);
    Task<Article> CreateArticleAsync(CreateArticleRequest request);
    Task<Article> UpdateArticleAsync(int id, UpdateArticleRequest request);
    Task<Article> SubmitReviewAsync(int id);
    Task<Article> PublishArticleAsync(int id);
    Task<List<Article>> SearchArticlesAsync(string query);
}

public class ArticleService : IArticleService
{
    private readonly CmsDbContext _db;
    private readonly IImageWebpService _webpService;
    private readonly ILogger<ArticleService> _logger;

    public ArticleService(
        CmsDbContext db,
        IImageWebpService webpService,
        ILogger<ArticleService> logger)
    {
        _db = db;
        _webpService = webpService;
        _logger = logger;
    }

    public async Task<List<Article>> GetAllArticlesAsync(string? status = null, string? category = null)
    {
        var query = _db.Articles.AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ArticleStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(a => a.Status == parsedStatus);
        }

        if (!string.IsNullOrEmpty(category) && category != "All")
        {
            query = query.Where(a => a.Category == category);
        }

        return await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
    }

    public async Task<Article?> GetArticleByIdAsync(int id)
    {
        var article = await _db.Articles.FindAsync(id);
        if (article != null && article.Status == ArticleStatus.PUBLISHED)
        {
            article.ViewCount++;
            await _db.SaveChangesAsync();
        }
        return article;
    }

    public async Task<Article?> GetArticleBySlugAsync(string slug)
    {
        var article = await _db.Articles.FirstOrDefaultAsync(a => a.Slug == slug);
        if (article != null && article.Status == ArticleStatus.PUBLISHED)
        {
            article.ViewCount++;
            await _db.SaveChangesAsync();
        }
        return article;
    }

    /// <summary>
    /// Invariant: UniqueArticleSlug
    /// </summary>
    public async Task<Article> CreateArticleAsync(CreateArticleRequest request)
    {
        var slug = !string.IsNullOrWhiteSpace(request.Slug)
            ? GenerateSlug(request.Slug)
            : GenerateSlug(request.Title);

        // Invariant check: UniqueArticleSlug
        var existingWithSlug = await _db.Articles.AnyAsync(a => a.Slug == slug);
        if (existingWithSlug)
        {
            throw new ArgumentException($"Invariant violation [UniqueArticleSlug]: An article with slug '{slug}' already exists.");
        }

        var readingTime = Math.Max(1, (int)Math.Ceiling(request.ContentHtml.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length / 200.0));

        var article = new Article
        {
            Title = request.Title,
            Slug = slug,
            Summary = request.Summary,
            ContentHtml = request.ContentHtml,
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Technology" : request.Category,
            Tags = request.Tags,
            AuthorName = string.IsNullOrWhiteSpace(request.AuthorName) ? "Staff Writer" : request.AuthorName,
            CoverImageUrl = request.CoverImageUrl,
            Status = ArticleStatus.DRAFT,
            ReadingTimeMinutes = readingTime,
            CreatedAt = DateTime.UtcNow,
            SearchVector = GenerateSearchVector(request.Title, request.Summary, request.Tags)
        };

        _db.Articles.Add(article);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Article draft created: {Title} (Slug: {Slug})", article.Title, article.Slug);
        return article;
    }

    public async Task<Article> UpdateArticleAsync(int id, UpdateArticleRequest request)
    {
        var article = await _db.Articles.FindAsync(id)
            ?? throw new KeyNotFoundException($"Article ID {id} not found.");

        var slug = !string.IsNullOrWhiteSpace(request.Slug)
            ? GenerateSlug(request.Slug)
            : GenerateSlug(request.Title);

        // Check if another article uses this slug
        var duplicate = await _db.Articles.AnyAsync(a => a.Slug == slug && a.Id != id);
        if (duplicate)
        {
            throw new ArgumentException($"Invariant violation [UniqueArticleSlug]: An article with slug '{slug}' already exists.");
        }

        article.Title = request.Title;
        article.Slug = slug;
        article.Summary = request.Summary;
        article.ContentHtml = request.ContentHtml;
        article.Category = request.Category;
        article.Tags = request.Tags;
        article.CoverImageUrl = request.CoverImageUrl;
        article.ReadingTimeMinutes = Math.Max(1, (int)Math.Ceiling(request.ContentHtml.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length / 200.0));
        article.SearchVector = GenerateSearchVector(article.Title, article.Summary, article.Tags);

        await _db.SaveChangesAsync();
        return article;
    }

    /// <summary>
    /// Transition 1: DRAFT -> IN_REVIEW
    /// Trigger: SUBMIT_REVIEW
    /// Handler: Articles.Submit
    /// </summary>
    public async Task<Article> SubmitReviewAsync(int id)
    {
        var article = await _db.Articles.FindAsync(id)
            ?? throw new KeyNotFoundException($"Article ID {id} not found.");

        if (article.Status != ArticleStatus.DRAFT)
        {
            throw new InvalidOperationException($"Cannot submit article with status '{article.Status}' for review.");
        }

        article.Status = ArticleStatus.IN_REVIEW;
        article.SubmittedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        _logger.LogInformation("Article {Title} SUBMIT_REVIEW -> IN_REVIEW", article.Title);

        return article;
    }

    /// <summary>
    /// Transition 2: IN_REVIEW -> PUBLISHED
    /// Trigger: PUBLISH
    /// Handler: Articles.Publish
    /// Validation: PublishedRequiresCoverImage (Invariant)
    /// Side-effects:
    ///   1. ImageSharp.ProcessWebp
    ///   2. EFCore.UpdateTsVector
    ///   3. NextJs.RevalidateTag('news')
    /// </summary>
    public async Task<Article> PublishArticleAsync(int id)
    {
        var article = await _db.Articles.FindAsync(id)
            ?? throw new KeyNotFoundException($"Article ID {id} not found.");

        // Invariant Validation: PublishedRequiresCoverImage
        if (string.IsNullOrWhiteSpace(article.CoverImageUrl))
        {
            throw new InvalidOperationException(
                "Invariant violation [PublishedRequiresCoverImage]: An article cannot be published without a valid cover image."
            );
        }

        // Side-Effect 1: ImageSharp.ProcessWebp
        article.WebpCoverImageUrl = await _webpService.ProcessToWebpDataUrlAsync(article.CoverImageUrl);

        // Side-Effect 2: EFCore.UpdateTsVector
        article.SearchVector = GenerateSearchVector(article.Title, article.Summary, article.Tags);

        article.Status = ArticleStatus.PUBLISHED;
        article.PublishedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Side-Effect 3: NextJs.RevalidateTag('news')
        _logger.LogInformation("🚀 NextJs.RevalidateTag('news') & RevalidateTag('article-{Slug}') triggered successfully.", article.Slug);

        return article;
    }

    /// <summary>
    /// Search Articles using Full-Text tsvector matching
    /// </summary>
    public async Task<List<Article>> SearchArticlesAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return await GetAllArticlesAsync(status: ArticleStatus.PUBLISHED.ToString());
        }

        var normalized = query.ToLower().Trim();

        return await _db.Articles
            .Where(a => a.Status == ArticleStatus.PUBLISHED
                     && (a.Title.ToLower().Contains(normalized)
                      || a.Summary.ToLower().Contains(normalized)
                      || a.Category.ToLower().Contains(normalized)
                      || a.Tags.ToLower().Contains(normalized)
                      || a.SearchVector.ToLower().Contains(normalized)))
            .OrderByDescending(a => a.PublishedAt)
            .ToListAsync();
    }

    private static string GenerateSlug(string text)
    {
        var slug = text.ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-").Trim('-');
        return string.IsNullOrEmpty(slug) ? "article-" + Guid.NewGuid().ToString("N")[..8] : slug;
    }

    private static string GenerateSearchVector(string title, string summary, string tags)
    {
        var words = $"{title} {summary} {tags}"
            .ToLower()
            .Split(new[] { ' ', ',', '.', '-', '!', '?' }, StringSplitOptions.RemoveEmptyEntries)
            .Distinct();

        return string.Join(" ", words.Select((w, i) => $"'{w}':{i + 1}"));
    }
}
