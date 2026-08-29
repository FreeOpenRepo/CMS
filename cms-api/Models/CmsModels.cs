namespace cms_api.Models;

public enum ArticleStatus
{
    DRAFT,
    IN_REVIEW,
    PUBLISHED,
    ARCHIVED
}

public enum ActorRole
{
    Author,
    Editor,
    Reader
}

public class Article
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    
    // Invariant: UniqueArticleSlug
    public string Slug { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string ContentHtml { get; set; } = string.Empty;
    public string Category { get; set; } = "Technology";
    public string Tags { get; set; } = string.Empty;
    public string AuthorName { get; set; } = "Staff Writer";
    
    // Invariant: PublishedRequiresCoverImage
    public string? CoverImageUrl { get; set; }
    public string? WebpCoverImageUrl { get; set; }

    public ArticleStatus Status { get; set; } = ArticleStatus.DRAFT;
    public int ReadingTimeMinutes { get; set; } = 3;
    public int ViewCount { get; set; } = 0;

    // Full-Text Search tsvector representation
    public string SearchVector { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
}
