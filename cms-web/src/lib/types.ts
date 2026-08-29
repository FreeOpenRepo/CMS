export type ArticleStatus = 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type ActorRole = 'Author' | 'Editor' | 'Reader';

export interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  contentHtml: string;
  category: string;
  tags: string;
  authorName: string;
  coverImageUrl?: string;
  webpCoverImageUrl?: string;
  status: ArticleStatus;
  readingTimeMinutes: number;
  viewCount: number;
  searchVector?: string;
  createdAt: string;
  submittedAt?: string;
  publishedAt?: string;
}
