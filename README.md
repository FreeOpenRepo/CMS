# 06_CMS_ENGINE: High-Performance Headless CMS & Publishing Engine

ระบบจัดการเนื้อหา (Headless Content Management System) ที่ออกแบบมาเพื่อรองรับ Traffic ระดับล้านเพจวิวต่อวัน ด้วยสถาปัตยกรรม Next.js 16 Partial Prerendering (PPR) ผสานพลังกับ .NET 10 HybridCache และระบบแปลงรูปภาพ WebP อัตโนมัติ

---

## 🔄 ภาพรวม Workflow การทำงาน (Business & Technical Workflow)

```mermaid
flowchart TD
    Author["Author (นักเขียน / ครีเอเตอร์)<br/>เขียนบทความผ่าน Rich-text Editor"] -->|"1. Submit Review (DRAFT to IN_REVIEW)"| InReview["In Review<br/>อยู่ระหว่างการตรวจทาน"]
    InReview --> Editor["Editor (บรรณาธิการ)<br/>ตรวจสอบความถูกต้องและ SEO"]
    Editor -->|"2. Publish Article (IN_REVIEW to PUBLISHED)"| Validator{"Validation Invariants<br/>1. UniqueArticleSlug<br/>2. PublishedRequiresCoverImage"}
    Validator -->|"ไม่ผ่านเกณฑ์"| Reject["Reject (ปฏิเสธการเผยแพร่)"]
    Validator -->|"ผ่านเกณฑ์"| SideEffects["Automated Side-effects:"]
    SideEffects --> ImageSharp["SixLabors.ImageSharp<br/>บีบอัดและแปลงรูปภาพเป็น WebP"]
    SideEffects --> FTS["PostgreSQL Full-Text Search<br/>อัปเดต tsvector สำหรับระบบค้นหาทันที"]
    SideEffects --> NextISR["Next.js On-Demand Tag Revalidation<br/>สั่งล้างแคชแท็ก news ทันทีแบบ Zero-downtime"]
    NextISR --> Reader["Reader (ผู้อ่าน)<br/>เปิดอ่านบทความเร็วระดับเสี้ยววินาที (<50ms)"]
```

### รายละเอียดขั้นตอนการเปลี่ยนสถานะ (State Transitions):
1. **`DRAFT ➔ IN_REVIEW` (Trigger: `SUBMIT_REVIEW`)**: นักเขียนเขียนบทความผ่าน Tiptap WYSIWYG Editor และส่งเข้าสู่กระบวนการตรวจทาน
2. **`IN_REVIEW ➔ PUBLISHED` (Trigger: `PUBLISH`)**: บรรณาธิการตรวจสอบและกดเผยแพร่ ระบบจะรันกระบวนการเบื้องหลังแบบอัตโนมัติ:
   - แปลงภาพปกและภาพประกอบเป็นฟอร์แมต WebP ขนาดกะทัดรัด
   - อัปเดต Full-Text Search Index ในฐานข้อมูล
   - ยิง Tag Revalidation ไปยัง Next.js Edge เพื่อให้ผู้อ่านทั่วโลกเห็นเนื้อหาใหม่ทันทีโดยไม่ต้อง Build เว็บใหม่

---

## 🗄️ Database Design & Entity Relationships (PostgreSQL 18)

### 1. Entity-Relationship Diagram (ER Diagram)

```mermaid
erDiagram
    Categories ||--o{ Articles : "contains published articles"
    Articles ||--o{ MediaAssets : "embeds uploaded media"

    Categories {
        int Id PK
        string Name
        string Slug UK
        string Description
    }

    Articles {
        int Id PK
        string Title
        string Slug UK
        string Content
        string Excerpt
        string Status
        int CategoryId FK
        string CoverImageUrl
        timestamp PublishedAt
        timestamp CreatedAt
        timestamp UpdatedAt
    }

    MediaAssets {
        int Id PK
        string FileName
        string ContentType
        bigint Size
        string WebpUrl
        int Width
        int Height
        timestamp UploadedAt
    }
```

### 2. รายละเอียดตารางและความสัมพันธ์ (Schema & Relationships)
- **`Categories` (หมวดหมู่เนื้อหา)**:
  - จัดเก็บหมวดหมู่บทความ (เช่น Cloud Architecture, DevOps, Security) พร้อม URL Slug ที่ไม่ซ้ำกัน
  - ความสัมพันธ์: `1 Category` เชื่อมโยงไปยัง `N Articles`
- **`Articles` (บทความและสิ่งพิมพ์)**:
  - Foreign Key: `CategoryId` ➔ `Categories(Id)`
  - บันทึกสถานะบทความ (`DRAFT`, `IN_REVIEW`, `PUBLISHED`, `ARCHIVED`), เนื้อหา HTML/Markdown จาก WYSIWYG, ภาพปก และเวลาเผยแพร่
  - บังคับใช้ Invariant `UniqueArticleSlug` (Slug ต้องไม่ซ้ำ) และ Invariant `PublishedRequiresCoverImage` (ต้องมี `CoverImageUrl` เมื่อสถานะเป็น `PUBLISHED`)
  - มี PostgreSQL GIN Index บน `to_tsvector('english', Title || ' ' || Content)` สำหรับ Full-Text Search
- **`MediaAssets` (คลังรูปภาพและไฟล์สื่อ)**:
  - จัดเก็บรูปภาพที่ผ่านการแปลงและบีบอัดเป็น Next-Gen WebP อัตโนมัติด้วย SixLabors.ImageSharp พร้อมขนาดกว้างxสูง

---

## 🛡️ กฎเหล็กของระบบ (Domain Invariants)

1. **`UniqueArticleSlug` (URL Slug ต้องไม่ซ้ำกันเด็ดขาด)**:
   - ป้องกันปัญหา URL ชนกัน ซึ่งส่งผลเสียต่อการจัดอันดับ SEO และการเข้าถึงบทความ
2. **`PublishedRequiresCoverImage` (บทความที่เผยแพร่ต้องมีภาพหน้าปกเสมอ)**:
   - ป้องกันบทความที่ไม่มีภาพประกอบหลุดออกสู่หน้าหลัก ซึ่งจะทำให้ Layout ของเว็บและการแชร์ไปยัง Social Media (OpenGraph) เสียหาย

---

## 💻 Tech Stack & เหตุผลในการเลือกใช้

| ส่วนประกอบ | เทคโนโลยีที่เลือก | เหตุผลที่เลือก | ข้อดีหลัก (Advantages) |
|---|---|---|---|
| **Database** | **PostgreSQL 18** | มี Full-Text Search (tsvector) และ JSONB ในตัว | ค้นหาบทความรวดเร็ว จัดเก็บข้อมูลยืดหยุ่น พร้อม `db/init.sql` |
| **Frontend UI** | **Next.js 16 (PPR & ISR)** | รองรับ Partial Prerendering และ On-Demand Incremental Static Regeneration | เนื้อหาโหลดได้เร็วระดับ Static Page แต่ยังสามารถอัปเดตแบบ Dynamic ได้ทันที |
| **Rich-Text Editor** | **@tiptap/react** | Headless WYSIWYG Editor ไร้ข้อจำกัดเรื่อง Styling | จัดการเนื้อหาแบบบล็อก (Headings, Code, Tables, Images) ได้อย่างยืดหยุ่น |
| **SEO Optimizer** | **next-seo** | จัดการ Meta Tags, OpenGraph, และ JSON-LD Structured Data อัตโนมัติ | เพิ่มคะแนน Core Web Vitals และการติดอันดับบน Google Search |
| **Backend API** | **.NET 10 (C#)** | ประสิทธิภาพการประมวลผลสูง รองรับ HybridCache ตัวใหม่ล่าสุด | แคชเนื้อหาแบบ Multi-tier (L1 Memory + L2 Distributed) ได้อย่างรวดเร็ว |
| **Image Processing** | **SixLabors.ImageSharp** | ไลบรารีจัดการรูปภาพ Native C# ประสิทธิภาพสูง ไม่พึ่งพา C++ Library ภายนอก | ย่อขนาดรูปและแปลงเป็น WebP ได้รวดเร็ว ประหยัด Bandwidth ของ CDN ได้กว่า 70% |
| **Search Engine** | **EF Core 10 + Npgsql FTS** | ใช้ PostgreSQL Full-Text Search (tsvector / tsquery) | ค้นหาบทความภาษาไทยและอังกฤษได้อย่างแม่นยำโดยไม่ต้องติดตั้ง Elasticsearch แยก |

---

## 🚀 วิธีการรันระบบ (Quick Start)

### ตัวเลือกที่ 1: รันด้วย Docker Compose (แนะนำ)
```bash
docker compose up --build -d
```
> ระบบจะรัน **PostgreSQL 18** (`:5432`), **.NET 10 API** (`:5030`), และ **Next.js 16 Web** (`:3003`) พร้อม Seed หมวดหมู่และบทความตัวอย่างทันที

### ตัวเลือกที่ 2: รันแบบแยก Service (Manual)
1. **รัน Backend API**:
   ```powershell
   cd cms-api
   dotnet run
   ```
   > API พร้อมทำงานที่: `http://localhost:5030`
2. **รัน Frontend Web**:
   ```powershell
   cd cms-web
   bun run dev
   ```
   > เข้าใช้งานได้ที่: `http://localhost:3003`
