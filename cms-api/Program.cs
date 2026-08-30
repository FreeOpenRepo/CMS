using cms_api.Data;
using cms_api.Models;
using cms_api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:5030");

// Add services
builder.Services.AddOpenApi();
builder.Services.AddSingleton<IImageWebpService, ImageWebpService>();
builder.Services.AddScoped<IArticleService, ArticleService>();

// CORS for Next.js frontend (cms-web)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure Database: PostgreSQL if connection string is set, else InMemory
var postgresConn = builder.Configuration.GetConnectionString("PostgresConnection");
if (!string.IsNullOrEmpty(postgresConn))
{
    builder.Services.AddDbContext<CmsDbContext>(opt =>
        opt.UseNpgsql(postgresConn));
}
else
{
    builder.Services.AddDbContext<CmsDbContext>(opt =>
        opt.UseInMemoryDatabase("CmsInMemoryDb"));
}

var app = builder.Build();

// Ensure Database is Created
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CmsDbContext>();
    db.Database.EnsureCreated();
}

app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Health Check
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    system = "06_CMS_ENGINE",
    timestamp = DateTime.UtcNow,
    engine = ".NET 10 + SixLabors.ImageSharp + PostgreSQL FTS + On-Demand ISR"
}));

// Articles Listing & Filtering
app.MapGet("/api/articles", async (string? status, string? category, IArticleService articleService) =>
{
    var articles = await articleService.GetAllArticlesAsync(status, category);
    return Results.Ok(articles);
});

app.MapGet("/api/articles/{id:int}", async (int id, IArticleService articleService) =>
{
    var article = await articleService.GetArticleByIdAsync(id);
    return article != null ? Results.Ok(article) : Results.NotFound();
});

app.MapGet("/api/articles/slug/{slug}", async (string slug, IArticleService articleService) =>
{
    var article = await articleService.GetArticleBySlugAsync(slug);
    return article != null ? Results.Ok(article) : Results.NotFound();
});

// Full-Text Search
app.MapGet("/api/articles/search", async (string? q, IArticleService articleService) =>
{
    var results = await articleService.SearchArticlesAsync(q ?? "");
    return Results.Ok(results);
});

// Create Draft Article (Invariant: UniqueArticleSlug)
app.MapPost("/api/articles", async (CreateArticleRequest request, IArticleService articleService) =>
{
    try
    {
        var article = await articleService.CreateArticleAsync(request);
        return Results.Created($"/api/articles/{article.Id}", article);
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// Update Article
app.MapPut("/api/articles/{id:int}", async (int id, UpdateArticleRequest request, IArticleService articleService) =>
{
    try
    {
        var article = await articleService.UpdateArticleAsync(id, request);
        return Results.Ok(article);
    }
    catch (KeyNotFoundException)
    {
        return Results.NotFound();
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Transition 1: DRAFT -> IN_REVIEW (Trigger: SUBMIT_REVIEW)
app.MapPost("/api/articles/{id:int}/submit", async (int id, IArticleService articleService) =>
{
    try
    {
        var article = await articleService.SubmitReviewAsync(id);
        return Results.Ok(article);
    }
    catch (KeyNotFoundException)
    {
        return Results.NotFound();
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Transition 2: IN_REVIEW -> PUBLISHED (Trigger: PUBLISH)
// Validation: PublishedRequiresCoverImage (Invariant)
// Side-effects: ImageSharp.ProcessWebp, EFCore.UpdateTsVector, NextJs.RevalidateTag('news')
app.MapPost("/api/articles/{id:int}/publish", async (int id, IArticleService articleService) =>
{
    try
    {
        var article = await articleService.PublishArticleAsync(id);
        return Results.Ok(article);
    }
    catch (KeyNotFoundException)
    {
        return Results.NotFound();
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Next.js On-Demand Tag Revalidation Webhook
app.MapPost("/api/revalidate", (RevalidateRequest req, ILogger<Program> logger) =>
{
    logger.LogInformation("Webhook: Next.js RevalidateTag('{Tag}') acknowledged.", req.Tag);
    return Results.Ok(new { revalidated = true, tag = req.Tag, timestamp = DateTime.UtcNow });
});

// Categories list
app.MapGet("/api/categories", () => Results.Ok(new[]
{
    "All",
    "Technology",
    "Architecture",
    "Engineering",
    "Design",
    "Performance"
}));

app.Run();

public record RevalidateRequest(string Tag);

