#!/bin/sh
set -e

echo "Applying database schema..."
# Pass DATABASE_URL explicitly so prisma.config.ts dotenv doesn't override with .env.local
DATABASE_URL="$DATABASE_URL" node node_modules/prisma/build/index.js db push

echo "Starting PriceIQ on port 3000..."
exec node server.js
