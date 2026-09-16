#!/bin/bash
# NOVA — Oracle Cloud deployment script
# Run on the SERVER after cloning the repo
set -e

NOVA_DIR="/home/ubuntu/nova"
cd "$NOVA_DIR"

echo ">>> Installing dependencies..."
pnpm install --frozen-lockfile

echo ">>> Building server..."
cd server && pnpm build && cd ..

echo ">>> Building web app..."
cd apps/web && pnpm build && cd ../..

echo ">>> Starting/restarting PM2 processes..."
pm2 delete nova-server 2>/dev/null || true
pm2 delete nova-web    2>/dev/null || true

# Start Express server
pm2 start server/dist/index.js \
  --name nova-server \
  --env production \
  -i 1 \
  --max-memory-restart 400M

# Start Next.js
pm2 start "node apps/web/.next/standalone/server.js" \
  --name nova-web \
  --env production \
  --max-memory-restart 300M

pm2 save
echo ">>> Deployment complete!"
pm2 status
