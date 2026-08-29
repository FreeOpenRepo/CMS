system: 06_CMS_ENGINE
tech_stack:
  frontend: "Next.js 16 (PPR, On-Demand ISR) + @tiptap/react + next-seo"
  backend: ".NET 10 + SixLabors.ImageSharp + HybridCache"
  orm: "EF Core 10 (Npgsql Full-Text Search Extensions)"
  storage: "PostgreSQL 18 + Cloudflare R2 / MinIO"
  protocols: "HTTPS, Next.js On-Demand Tag Revalidation"
spec:
  actors: [Author, Editor, Reader]
  invariants: [UniqueArticleSlug, PublishedRequiresCoverImage]
  state_transitions:
    - { from: DRAFT, to: IN_REVIEW, trigger: SUBMIT_REVIEW, handler: "Articles.Submit" }
    - { from: IN_REVIEW, to: PUBLISHED, trigger: PUBLISH, handler: "Articles.Publish", side_effects: ["ImageSharp.ProcessWebp", "EFCore.UpdateTsVector", "NextJs.RevalidateTag('news')"] }