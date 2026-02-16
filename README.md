# Seongkohn Site

Next.js + SQLite website and admin panel for product/catalog management.

## Requirements

- Node.js `20.20.0` (see `.nvmrc`)
- npm

## Local Development

```bash
nvm use
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create `.env.local` with the values you use in your environment.

Common keys used by this app:

- `JWT_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `SITE_INDEXING_ENABLED`
- `BREVO_API_KEY`
- `TURNSTILE_SECRET`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## Quality Checks

```bash
npm run lint
npm run build
```

## Production Notes

- App runs with `next build` standalone output.
- PM2 config: `ecosystem.config.js`
- Example Nginx config: `nginx.conf.example`
- Deployment helper script: `deploy.sh`
