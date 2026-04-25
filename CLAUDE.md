@AGENTS.md

# PriceIQ — Project Notes for Claude

## What this project is

BTech final year project. AI-powered Indian electronics price comparison app — like BuyHatke. Searches Amazon.in, Flipkart, and Vijay Sales, shows real-time INR prices, and generates a Groq LLaMA-3 recommendation.

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma 7 + PostgreSQL (Docker Compose)
- Playwright for Flipkart scraping
- Groq SDK (`groq-sdk`) — model: `llama-3.3-70b-versatile`

## Critical Prisma 7 quirks

- Database URL goes in `prisma.config.ts`, NOT `schema.prisma`
- PrismaClient requires `@prisma/adapter-pg` — see `src/lib/db.ts`
- After any schema change: `npx prisma db push` then `npx prisma generate`
- Force reset needs env var: `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes" npx prisma db push --force-reset`

## Running the app

```bash
docker compose up -d          # start PostgreSQL
npm run db:push               # apply schema
npm run seed                  # scrape 12 products (~3-5 min)
npm run dev                   # start Next.js at localhost:3000
```

## Environment — `.env.local`

```
DATABASE_URL=""
GROQ_API_KEY=""
SCRAPE_SECRET=""
```

## Data sources

| Source | Method | Notes |
|---|---|---|
| Vijay Sales | GraphQL API at `vsprod.vijaysales.com/graphql` | No browser needed. Rating is 0–100, divide by 20 for stars. Appends SKU to names — strip with `/[A-Z][A-Z0-9]{4,}$/` |
| Amazon.in | HTTP fetch | Extract ASINs from `data-asin` in search HTML, then fetch `/dp/{ASIN}` |
| Flipkart | Playwright (headless Chromium) | Price class: `.hZ3P6w` / `.Nx9bqj` / `._30jeq3`. Needs stealth: `navigator.webdriver = undefined` |

## Key files

```
src/lib/scrapers/
  products.ts     — 12 canonical products with per-source queries and shared slug
  live.ts         — on-demand scraping: liveSearch(query) → scrapes all 3 platforms
  vijaysales.ts   — batch scraper for seeding
  amazon.ts       — batch scraper for seeding
  flipkart.ts     — batch scraper for seeding
  index.ts        — runAllScrapers() used by /api/scrape

src/lib/ai/groq.ts             — analyzeProduct() → Groq JSON response
src/lib/db.ts                  — Prisma singleton

src/app/api/search/live/route.ts  — POST: runs liveSearch, saves to DB, runs AI, returns productId
src/app/api/ai/analyze/route.ts   — POST: generates/refreshes AI analysis for a product
src/app/api/scrape/route.ts       — POST: triggers full re-scrape (requires x-scrape-secret header)

src/app/search/page.tsx           — shows DB results; on 0 results with a query → LiveSearchTrigger
src/components/search/LiveSearchTrigger.tsx  — client component: fires /api/search/live, shows loading, redirects to /product/[id]
src/app/product/[id]/page.tsx     — Price Comparison tab + AI Analysis tab
```

## Slug convention

All scrapers use `{source}-{slug}` (e.g. `amz-iphone-15-128gb`). The DB stores the canonical slug without prefix. Seeder and live route both strip the prefix before grouping.

## Adding new products (seeded)

Add an entry to `src/lib/scrapers/products.ts`:
```ts
{ slug: "product-slug", vsQuery: "...", amzQuery: "...", fkQuery: "...", category: "Smartphones", minPrice: 10000 }
```
Then run `npm run seed`.

## Adding new products (live)

No code needed — `liveSearch()` in `live.ts` auto-detects category from the query string via `detectCategory()` regex and scrapes all three platforms.

## Schema notes

- `Product`: `id, name, slug (unique), category, domain (default "electronics"), brand?, imageUrl?, description?`
- `ProductListing`: `productId_source` is the unique key (one listing per source per product)
- `AIAnalysis`: no unique constraint on `productId` — use `findFirst` then `update` or `create`
- `PriceHistory`: append-only, one row per scrape per source
- All prices in INR (`currency` defaults to `"INR"`)

## What NOT to touch

- `prisma.config.ts` — Prisma 7 adapter config, don't move DATABASE_URL to schema.prisma
- `src/lib/db.ts` — Prisma singleton with pg adapter, don't simplify
- Playwright stealth scripts in flipkart.ts / live.ts — needed to avoid bot detection
