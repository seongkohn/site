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

echo "==> Copying static files to standalone..."
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

echo "==> Ensuring data directory exists..."
mkdir -p data

echo "==> Restarting PM2..."
pm2 restart ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "==> Deploy complete!"
