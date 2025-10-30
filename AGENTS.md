# Repository Guidelines

## Purpose

Follow the conventions in `CLAUDE.md`. Produce the smallest viable changes and always verify with the commands below.

## Project Structure & Module Organization

- Monorepo managed with npm workspaces and Turborepo. Core apps live under `apps/`: `web` (Next.js client), `api` (Supabase edge functions, Drizzle migrations), and `design-system` (component showcase on port 3001).
- Shared libraries live in `packages/`. Use `packages/ui` for composable React + Tailwind building blocks and `packages/shared` for types, constants, and utilities consumed across apps.
- Top-level `scripts/` holds operational helpers (for example, `add-component.sh` for shadcn imports). `specs/`, `landing/`, `marketing/`, and `brand/` provide product context and collateral—keep edits coordinated with design leads.
- Snapshot integration probes and troubleshooting assets sit at the repo root (`test-*.js`, `*.png`). Treat them as documentation of recent experiments; do not remove without consensus.

## Build, Test, and Development Commands

- `npm run dev` — Run every workspace dev server defined in `turbo.json`.
- `npm run web:dev` — Launch the main Next.js app with hot reload.
- `npm run design:dev` — Open the design system playground on port 3001.
- `npm run api:supabase` — Start the local Supabase stack (Docker required).
- `npm run api:types` — Regenerate typed Supabase entities into `packages/shared`.
- `npm run lint` / `npm run type-check` — Workspace-wide ESLint (Next config) and TypeScript validation. Run both before pushing.

## Coding Style & Naming Conventions

- TypeScript is the default for all new code; prefer `.tsx` for React components and colocate hooks or helpers near their consumers under `src/`.
- Follow the 2-space indentation used across the repo; leverage Tailwind utility-first patterns for styling. Local component state hooks use `camelCase`; exported React components and shared types use `PascalCase`.
- Respect module boundaries: UI primitives originate in `packages/ui`, domain logic and Supabase bindings in `packages/shared`. Update barrel files (`index.ts`) when adding exports.

## Testing Guidelines

- No indepent testing scripts
- When collaborating with the Supabase project locally, run `npm run api:supabase` and apply migrations (`npm run db:push` within `apps/api`) prior to hitting functions.
- Capture manual journey verifications with annotated screenshots in the root; append dates in filenames to avoid collisions. Maintain parity between scripts and stored artifacts.

## Commit & Pull Request Guidelines

- Keep commits small with imperative, lowercase summaries (`workspace auth fix`). Reference the touched scope first when helpful (`web: unblock uploads`).
- Pull requests should include: succinct description of intent, linked Notion/Jira issue when available, test plan (`node test-post-files-api.js`, `npm run lint`), and screenshots or logs for UI or Supabase changes.
- Request review from the owner of any package or app you touch; note follow-up work in the PR body rather than future-dated TODOs.
