# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PWr Now — a platform for discovering and managing events at Politechnika Wrocławska. Monorepo with three apps:

- **backend/** — Django 5.2 REST API (Python 3.12, PostgreSQL 17, Redis 7, Celery 5.5)
- **web/** — Next.js 16 frontend (React 19, TypeScript, Tailwind CSS, pnpm)
- **mobile/** — Expo React Native app (SDK 53, TypeScript, NativeWind)

## Common Commands

### Backend (Docker)
```bash
docker compose up --build              # Start all backend services
docker compose exec backend pytest     # Run tests
docker compose exec backend pytest core/tests/test_schedule_api.py  # Single test file
docker compose exec backend pytest -k "test_name"                   # Single test by name
docker compose exec backend pytest --cov                            # Tests with coverage
docker compose exec backend python manage.py makemigrations         # Create migrations
docker compose exec backend python manage.py migrate                # Apply migrations
docker compose exec backend python manage.py makemessages -l pl -l en --ignore "staticfiles/*" --ignore "media/*"
docker compose exec backend python manage.py compilemessages
docker compose exec backend python manage.py import_data            # Import events from API
```

### Web
```bash
cd web && pnpm install
pnpm dev                    # Dev server (Turbopack) at localhost:3000
pnpm build                  # Production build
pnpm lint                   # ESLint
pnpm test                   # Vitest unit tests
pnpm test:coverage          # Unit tests with coverage
pnpm test:e2e               # Playwright E2E tests
```

### Mobile
```bash
cd mobile && pnpm install
pnpm start                  # Expo dev server
pnpm ios                    # Run on iOS
pnpm android                # Run on Android
```

### Docker Build Targets
```bash
docker build --target dev -t pwrnow-backend:dev backend/    # Dev image (includes pytest, watchfiles)
docker build --target prod -t pwrnow-backend:prod backend/  # Prod image (non-root django user)
```

### Deployment
```bash
./deploy_images.sh          # Build & push prod images to registry, trigger Coolify redeploy
```

## Architecture

### Backend

**Django apps:** `core` (events, organizations, categories, schedules, QR codes), `users` (custom User model with email auth, profile images), `notifications`, `ai` (langchain + OpenAI/Gemini), `feature_access`

**Key patterns:**
- `AUTH_USER_MODEL = 'users.User'` — UUID primary key, email-based auth
- `sqids` for public-facing IDs (not sequential integers)
- JWT auth via `dj-rest-auth` + `django-allauth` (Google, Facebook, Apple OAuth)
- API versioned at `/v1/` — throttling configured per scope (ai_parse: 5/hr, qr_scan: 6/min, event_like: 30/min)
- `django-modeltranslation` for model-level i18n (Polish default, English)
- Celery with `DatabaseScheduler` for periodic tasks; Redis as broker
- `entrypoint.prod.sh` handles migrations + static collection; `start_files/` has per-service start scripts
- Prod Dockerfile `SERVICE` env var selects which start script runs (backend/worker/beat/flower)

**Test setup:** pytest-django with `conftest.py` at backend root providing `api_client`, `user_factory`, `regular_user`, `staff_user`, `authenticated_client`, `staff_client` fixtures. Existing tests in `core/tests/`, `users/tests/`, `notifications/tests/`.

### Web (Next.js)

- App Router with `next-intl` (Polish default, English) — messages in `web/messages/{pl,en}.json`
- shadcn/ui components (Radix primitives) in `web/components/ui/`
- `proxy.ts` middleware handles locale detection, app store redirects (/apka, /ios, /android), PostHog tracking
- Standalone output mode for Docker containerization
- Sentry + PostHog analytics integration
- E2E tests in `web/e2e/`, unit tests in `web/__tests__/`

### Mobile (Expo)

- Expo Router (file-based navigation in `mobile/app/`)
- TanStack Query + AsyncStorage for offline-first data
- NativeWind for Tailwind-compatible styling shared with web
- EAS Updates for OTA deploys: `cd mobile && eas update --channel production`

## Conventions

- **i18n everything:** Backend uses `gettext_lazy(_("..."))`, web uses `useTranslations('namespace')`, translations in both Polish and English
- **UUID file uploads:** All uploaded files get UUID-based filenames
- **PostHog:** Use enums/const objects for feature flag names and custom property names. Minimize flag usage across callsites. Never hardcode API keys — use `.env`
- **Two languages:** Polish (pl) is the default locale, English (en) is secondary

## CI/CD

- **Backend CI** (`.github/workflows/ci.yml`): Triggers on `backend/**` changes — Docker build, migrate, pytest
- **Playwright** (`.github/workflows/playwright.yml`): Triggers on `web/**` changes — pnpm install, browser install, test
