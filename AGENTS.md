# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages and API routes (for example `app/about`, `app/products`, `app/api/*`).
- `components/`: shared UI components and admin UI helpers (`components/admin`).
- `lib/`: core utilities (database access, schema/seed logic, i18n, auth/email helpers).
- `data/`: local SQLite database storage (`data/seongkohn.db`).
- `public/`: static assets (`public/images`, uploaded files in `public/uploads/products`).
- `scripts/`: one-off migration/import utilities.

## Build, Test, and Development Commands
- `npm run dev`: start local dev server at `http://localhost:3000`.
- `npm run build`: production build (Next.js standalone output enabled).
- `npm run start`: run production server from build output.
- `npm run lint`: run ESLint (`eslint-config-next` + TypeScript rules).
- Deploy flow (server): `deploy.sh` pulls `main`, installs deps, builds, and restarts PM2 via `ecosystem.config.js`.

## Coding Style & Naming Conventions
- Language: TypeScript (`strict` mode) with React function components.
- Indentation: 2 spaces; keep imports grouped and sorted logically.
- Naming:
  - Components/pages: `PascalCase` for component names, route files as `page.tsx`, `route.ts`.
  - Helpers/variables/functions: `camelCase`.
  - Constants: `UPPER_SNAKE_CASE` only for true constants.
- Prefer path alias imports with `@/*` (configured in `tsconfig.json`).
- Lint before opening PRs; avoid introducing new warnings/errors in touched files.

## Testing Guidelines
- There is currently no dedicated test framework configured (`npm test` is not defined).
- Minimum quality gate: run `npm run lint` and manually verify changed flows in `npm run dev`.
- For UI/API changes, include a short manual test checklist in the PR (routes tested, expected behavior).
- If adding tests, place them near the feature (`*.test.ts`/`*.test.tsx`) and document the run command in `package.json`.

## Commit & Pull Request Guidelines
- Follow existing history style: short, imperative commit subjects (for example `Add drag-and-drop reordering to admin pages`).
- Keep commits scoped to one concern; avoid mixing refactors and feature work.
- PRs should include:
  - Clear summary and motivation.
  - Linked issue/task (if applicable).
  - Screenshots for UI/admin changes.
  - Notes for env/config/data-impact changes (especially `data/`, uploads, or auth/email settings).

## Security & Configuration Tips
- Do not commit secrets; keep them in `.env.local`.
- Validate changes touching auth, upload, and email routes under `app/api/*`.
- Treat `data/seongkohn.db` as environment-specific runtime data, not source-controlled content.
