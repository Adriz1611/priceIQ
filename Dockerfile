# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:20-bookworm-slim AS deps

# Playwright needs these system libs; install them once here so the cache layer
# is reused on rebuilds even if source changes.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libdbus-1-3 libxkbcommon0 \
    libx11-6 libxcomposite1 libxdamage1 libxext6 \
    libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
    libcairo2 libasound2 libx11-xcb1 libxcb1 \
    ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# npm ci triggers postinstall → prisma generate + playwright chromium download.
# A dummy DATABASE_URL prevents prisma.config.ts from crashing on undefined.
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
RUN npm ci

# ── Stage 2: build Next.js ────────────────────────────────────────────────────
FROM deps AS builder

COPY . .

# All DB pages are force-dynamic so Next.js won't query the DB during build.
RUN npm run build

# ── Stage 3: production runtime ───────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libdbus-1-3 libxkbcommon0 \
    libx11-6 libxcomposite1 libxdamage1 libxext6 \
    libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
    libcairo2 libasound2 libx11-xcb1 libxcb1 \
    ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production PORT=3000

# Standalone output + static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma schema + generated client (needed for db push at startup)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Playwright browsers (downloaded by @playwright/browser-chromium in deps stage)
COPY --from=deps /root/.cache/ms-playwright /root/.cache/ms-playwright
# Playwright runtime libs
COPY --from=builder /app/node_modules/playwright ./node_modules/playwright
COPY --from=builder /app/node_modules/playwright-core ./node_modules/playwright-core

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
