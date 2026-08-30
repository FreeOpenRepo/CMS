-- =============================================================================
-- Headless CMS Engine Initial Database Schema & Seed Data (cms_db)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS "MediaAssets" CASCADE;
DROP TABLE IF EXISTS "Articles" CASCADE;
DROP TABLE IF EXISTS "Categories" CASCADE;

-- 1. Categories
CREATE TABLE "Categories" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Slug" VARCHAR(100) NOT NULL UNIQUE,
    "Description" TEXT
);

-- 2. Articles (Full-Text Search & Draft/Published State Machine)
CREATE TABLE "Articles" (
    "Id" SERIAL PRIMARY KEY,
    "Title" VARCHAR(255) NOT NULL,
    "Slug" VARCHAR(255) NOT NULL UNIQUE,
    "Content" TEXT NOT NULL,
    "Excerpt" TEXT,
    "Status" VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, ARCHIVED
    "CategoryId" INT REFERENCES "Categories"("Id") ON DELETE SET NULL,
    "CoverImageUrl" VARCHAR(500),
    "PublishedAt" TIMESTAMP WITH TIME ZONE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Media Assets (ImageSharp WebP transcoding)
CREATE TABLE "MediaAssets" (
    "Id" SERIAL PRIMARY KEY,
    "FileName" VARCHAR(255) NOT NULL,
    "ContentType" VARCHAR(100) NOT NULL,
    "Size" BIGINT NOT NULL,
    "WebpUrl" VARCHAR(500) NOT NULL,
    "Width" INT,
    "Height" INT,
    "UploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Categories & Articles
INSERT INTO "Categories" ("Id", "Name", "Slug", "Description") VALUES
(1, 'Cloud Architecture', 'cloud-architecture', 'Scalable systems & cloud native patterns'),
(2, 'DevOps & SRE', 'devops-sre', 'Continuous deployment and observability'),
(3, 'Security & Cryptography', 'security-crypto', 'Zero-trust architecture and cryptographic signing')
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "Articles" ("Id", "Title", "Slug", "Content", "Excerpt", "Status", "CategoryId", "PublishedAt") VALUES
(1, 'Building Resilient Micro-Engines with .NET 10 & PostgreSQL', 'resilient-micro-engines-dotnet-10', '<h2>Architecture Overview</h2><p>In this deep dive, we explore how .NET 10 Minimal APIs paired with PostgreSQL 18 provide unmatched throughput and domain invariant isolation...</p>', 'Deep dive into .NET 10 minimal APIs and PostgreSQL domain partitioning.', 'PUBLISHED', 1, CURRENT_TIMESTAMP),
(2, 'Next.js 16 Glassmorphism Design System Best Practices', 'nextjs-16-glassmorphism-design', '<h2>Modern Aesthetics</h2><p>Creating dark-mode glassmorphic user interfaces with subtle micro-animations elevates enterprise software experiences...</p>', 'Aesthetic guide to building high-end enterprise web applications.', 'PUBLISHED', 2, CURRENT_TIMESTAMP)
ON CONFLICT ("Id") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Categories"', 'Id'), COALESCE(max("Id"), 1)) FROM "Categories";
SELECT setval(pg_get_serial_sequence('"Articles"', 'Id'), COALESCE(max("Id"), 1)) FROM "Articles";
