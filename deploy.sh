#!/bin/bash
set -e

APP_DIR="/var/www/seongkohn-site"
cd "$APP_DIR"

echo "==> Pulling latest changes..."
git pull origin main

echo "==> Installing dependencies..."
npm ci --production=false

echo "==> Building..."
npm run build

echo "==> Setting up standalone symlinks and static files..."
mkdir -p data
cp -r .next/static .next/standalone/.next/static
ln -sfn "$APP_DIR/public" .next/standalone/public
ln -sfn "$APP_DIR/data" .next/standalone/data
ln -sf "$APP_DIR/.env.local" .next/standalone/.env.local

echo "==> Restarting PM2..."
pm2 restart ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "==> Deploy complete!"
