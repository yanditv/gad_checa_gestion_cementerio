# AGENTS.md — OpenCode quick-start guide

## Workspace

The **active project** is `new-migration/`. Everything else (root folder,
`gad_checa_gestion_cementerio/`) is legacy reference or docs.

**Read `new-migration/CLAUDE.md` first** — it's the definitive instruction file
with all domain rules, code conventions, and workflow details. This file only
covers what CLAUDE.md doesn't or what the repo structure makes non-obvious.

## Architecture at a glance

```
new-migration/
├── backend/        ← NestJS 11 (port 3001)
├── frontend/       ← Next.js 15 App Router + React 19 (port 3000)
└── *.md            ← REQUIREMENTS, ARCHITECTURE, DESIGN, MIGRATION_PLAN
```

A **1:1 migration** of a cemetery management system from ASP.NET MVC/SQL Server
to NestJS+Prisma+PostgreSQL back end and Next.js front end. Functional parity
with the legacy system is mandatory.

## Setup & run

```bash
# PostgreSQL (Docker)
docker compose -f new-migration/docker-compose.postgres.yml up -d

# Backend
cd new-migration/backend
bun install
bun prisma migrate dev          # apply migrations + generate client
bun run start:dev               # http://localhost:3001 + /api/docs (Swagger)

# Frontend (second terminal)
cd new-migration/frontend
bun install
bun run dev                     # http://localhost:3000
```

**After `git pull` with schema changes:**
```bash
cd new-migration/backend && bun prisma migrate deploy && bun prisma generate
```

## Key commands

| Command | Directory | What it does |
|---------|-----------|-------------|
| `bun run start:dev` | backend | Dev server with watch mode |
| `bun prisma studio` | backend | DB GUI |
| `bun run dev` | frontend | Next dev server |
| `bun run build` | backend | NestJS type-check + build |
| `bun run build` | frontend | Next.js type-check + build |
| `bun run lint` | backend | ESLint with --fix |
| `bun run lint` | frontend | Next.js lint |
| `bun run smoke` | frontend | Playwright smoke test (needs backend+frontend running) |
| `bun run e2e` | frontend | E2E Playwright tests for bloques/bóvedas |

## Frontend smoke test

A browser-based test that opens every main screen and checks for runtime errors.
Must pass before closing any UI task. Runs against a live frontend+backend.

```bash
cd new-migration/frontend
bun run smoke
```

If you add a new screen, register it in `scripts/smoke.mjs` and link it in
`components/Sidebar.tsx`.

## BFF proxy pattern

Frontend API calls work differently in browser vs server:

- **Browser (`'use client'`):** calls go through `/api/*` (Next.js route handler)
  which reads the JWT from the `cementerio_auth` httpOnly cookie and proxies to
  the NestJS backend. `api.ts` auto-detects: `isBrowser() → /api${endpoint}`,
  otherwise → direct `${API_URL}${endpoint}`.

- **Server (RSC, server components):** calls go directly to the NestJS backend
  (http://localhost:3001) with the JWT read from the cookie.

The catch-all proxy lives at `frontend/src/app/api/[...path]/route.ts`.
Route-specific BFF handlers (e.g. `api/auth/`, `api/contratos/`) override it
for custom logic.

## Auth

- JWT stored in httpOnly cookie `cementerio_auth` (7 days).
- Frontend middleware (`frontend/src/middleware.ts`) protects all routes except
  `/auth/*` and `/api/auth/*`.
- Backend: `JwtAuthGuard` is global (registered as `APP_GUARD`). Use `@Public()`
  to bypass. Never add `@UseGuards(JwtAuthGuard)` manually.

## Git workflow

- **Never push to master directly** (branch protection, `enforce_admins=true`).
- All changes via PR with ≥1 approving review.
- Branch naming: `feat/<module>-<short>`, `fix/<module>-<short>`,
  `chore/<short>`, `docs/<short>`.
- `git pull --rebase origin master` before opening a PR.
- Commits in **Spanish**, imperative mood.

## Environment

- Backend: copy `.env.example` → `.env` (the `.env` is gitignored).
- Frontend: `NEXT_PUBLIC_API_URL=http://localhost:3001` in `.env.local`.
- MailHog available for dev email testing: `docker compose -f new-migration/docker-compose.dev.yml up -d`
  (SMTP on :1025, web UI on :8025).

## Non-obvious gotchas

- **`backend/prisma/schema.prisma` was deleted (status `D` in git).** If missing,
  restore it before modifying the model. Never create migrations against a
  phantom schema.
- **No hard deletes** for domain entities — logical deletion with
  `estado=false`, `usuarioEliminadorId`, `fechaEliminacion`.
- **Audit via helpers**, not manual field setting: `applyAuditCreate(data, ctx)`,
  `applyAuditUpdate(data, ctx)`, `applyAuditDelete(ctx)` from
  `common/audit/`.
- **Sequential numbering** via `YearSequenceService.next(prefix, year)`, never
  `max()+1`.
- **Never return Prisma entities from controllers** — always pass through
  `<feature>.mapper.ts`.
- **No SQL strings as controller types** — every `@Body()` must have a typed DTO
  in `dto/request/`.
- **Pagination is mandatory** for any domain listing: default `limit=15`, cap
  `limit=100`.
- **UI is Tailwind only** — no Bootstrap classes (`btn`, `card`, `form-control`,
  `col-*`, `row`, `badge bg-*`, etc.). Use components from
  `frontend/src/components/ui/` for common patterns.
- **Hardcoded cemetery texts** (president name, address, bank account) come from
  the `Cementerio` and `GADInformacion` DB records. Never hardcode them.
- **Legacy system** at `../gad_checa_gestion_cementerio/` is the functional
  source of truth. When in doubt about behavior, check there first.
