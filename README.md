# PriceIQ

AI-powered price comparison across Amazon.in, Flipkart, and Vijay Sales. Search any Indian electronics product and get real-time prices from all three platforms, plus an AI-generated recommendation powered by LLaMA 3.3 via Groq.

## Tech Stack

- **Framework** — Next.js 14 (App Router), TypeScript
- **UI** — Tailwind CSS, shadcn/ui
- **Database** — PostgreSQL (Docker) + Prisma 7
- **Scraping** — Playwright (Flipkart), HTTP fetch (Amazon.in), GraphQL (Vijay Sales)
- **AI** — Groq API (`llama-3.3-70b-versatile`)

## Prerequisites

- Node.js v22.22+
- Docker & Docker Compose
- A Groq API key (free at [console.groq.com](https://console.groq.com))

## Setup

### 1. Install dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Configure environment

Create `.env.local` in the project root:

```env
DATABASE_URL="postgresql://aggregator:aggregator@localhost:5432/aggregator"
GROQ_API_KEY="your_groq_api_key_here"
SCRAPE_SECRET="changeme"
```

### 3. Start the database

```bash
docker compose up -d
```

Wait a few seconds for PostgreSQL to be ready, then push the schema:

```bash
npm run db:push
```

Generate Prisma client:

```bash
npx prisma generate
```

### 4. Seed the database

This scrapes all three platforms for 12 pre-defined products (smartphones, laptops, headphones, TVs) and stores them in the DB. Takes about 3–5 minutes.

```bash
npm run seed
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

- **Products already in DB** — results appear instantly from PostgreSQL.
- **Products not in DB** — the app automatically scrapes Amazon.in, Flipkart, and Vijay Sales in real time, saves the results, and redirects you to the product page with a live AI analysis.

## Other commands

| Command | Description |
|---|---|
| `npm run seed` | Re-scrape all pre-defined products and refresh the DB |
| `npm run db:push` | Apply schema changes to the database |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) at localhost:5555 |
| `docker compose down` | Stop the PostgreSQL container |
| `docker compose down -v` | Stop and delete all DB data |
