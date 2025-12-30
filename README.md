# PWr Now Monorepo

PWr Now is a platform for discovering and managing events at Politechnika Wrocławska. This monorepo contains three main parts:

- **backend/** – Django REST API, Celery workers, PostgreSQL, Redis
- **web/** – Next.js 15 web frontend (React, Tailwind CSS)
- **mobile/** – Expo React Native mobile app

---

## Deployment

### Required Environment Variables (for backend/Django)

- `SECRET_KEY` – Django secret key (required for production)
- `DEBUG` – Set to `False` for production
- `ALLOWED_HOSTS` – Comma-separated list of allowed hosts (e.g., `.yourdomain.com`)
- `DATABASE_URL` – Database connection string (e.g., `postgres://user:password@host:5432/dbname`)
- `REDIS_URL` – Redis connection string (default: `redis://redis:6379/0`)
- `SITE_URL` – Public URL of your site (e.g., `https://pwrnow.pl`)
- `DISCORD_WEBHOOK_URL` – (Optional) Discord webhook for notifications

#### Example `.env` for Production

```env
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=.pwrnow.pl
DATABASE_URL=postgres://user:password@postgres:5432/dbname
REDIS_URL=redis://redis:6379/0
SITE_URL=https://pwrnow.pl
DISCORD_WEBHOOK_URL=
```

---

## Deploying the Web (Next.js) App

The web frontend is a Next.js 15 app.

### Required Environment Variables

- `NEXT_PUBLIC_API_URL` – The base URL of your backend API (for production: `https://pwrnow.pl`)

#### Example `.env` for Production

```env
NEXT_PUBLIC_API_URL=https://pwrnow.pl
```

---

## Project Structure

```
backend/   # Django backend (API, Celery, etc.)
web/       # Next.js web frontend
mobile/    # Expo React Native mobile app
```

---

## Quick Start (All Services)

The easiest way to run the full stack (backend, database, redis, celery, mailpit) is with Docker Compose:

```bash
docker-compose up --build
```

- Backend: http://localhost:8000
- Mailpit (dev email): http://localhost:8025
- Postgres: localhost:5432
- Redis: localhost:6379

> **Note:** The web (Next.js) and mobile (Expo) apps are NOT run by Docker Compose. See below for how to run them.

---

## Backend (Django)

- Python 3.12, Django 5, Celery, PostgreSQL
- All dependencies in `backend/requirements.txt`
- Environment variables in `.env` (see `.env.example` if present)

### Running Django Management Commands with Docker Compose

To run Django management commands (like `migrate`, `createsuperuser`, etc.) inside the running backend container, use:

```bash
docker-compose exec backend python manage.py <command>
```

**Examples:**

- Run migrations:
  ```bash
  docker-compose exec backend python manage.py migrate
  ```
- Create a superuser:
  ```bash
  docker-compose exec backend python manage.py createsuperuser
  ```

### Data Import Command

The project includes a management command to import events, categories, and organizations from the remote API:

```bash
docker-compose exec backend python manage.py import_data
```

#### Command Options

- `--api-url` – Base API URL (default: `https://api.pwrnow.pl/`)
- `--api-version` – API version (default: `v1`)
- `--only` – Import only specific resources: `categories`, `organizations`, `events`
- `--dry-run` – Show what would be imported without making changes
- `--force-images` – Re-download images even if they already exist
- `--limit` – Limit number of events to import (useful for testing)
- `--allow-notifications` – Allow notifications during import (default: suppressed)

#### Examples

```bash
# Import all data
docker-compose exec backend python manage.py import_data

# Test import (dry run) with only 5 events
docker-compose exec backend python manage.py import_data --dry-run --limit 5

# Import only events
docker-compose exec backend python manage.py import_data --only events

# Import with custom API URL
docker-compose exec backend python manage.py import_data --api-url https://staging-api.pwrnow.pl/

# Force re-download of all images
docker-compose exec backend python manage.py import_data --force-images
```

#### What Gets Imported

- **Categories** – Event categories with translations (PL/EN)
- **Organizations** – Organizations with logos and metadata
- **Events** – Complete event data including:
  - Basic info (title, description, dates, location)
  - Images and aspect ratios
  - Publication dates and verification status
  - Tags and relationships
  - Translations (PL/EN)

---

### Translations (Django i18n)

- Locale files live in `backend/locale/<lang>/LC_MESSAGES/django.po`.
- Wrap all user-facing strings in the backend with Django i18n, e.g.:

  ```python
  from django.utils.translation import gettext_lazy as _

  class User(models.Model):
      email = models.EmailField(_("email address"))
  ```

Extract/update messages:

```bash
docker-compose exec backend python manage.py makemessages -l pl -l en --ignore "staticfiles/*" --ignore "media/*"
```

Compile messages after editing `.po` files:

```bash
docker-compose exec backend python manage.py compilemessages
```

Notes:

- Supported languages are defined in `backend/config/settings.py` under `LANGUAGES` and `LOCALE_PATHS`.
- Add another language by updating `LANGUAGES` and running `makemessages -l <lang>`.

---

## Web (Next.js)

- Next.js 15, React 19, Tailwind CSS
- Uses the same fonts/colors as the mobile app (see `web/app/globals.css`)

### Local development:

```bash
cd web
pnpm install  # or npm install, or yarn
pnpm dev      # or npm run dev, or yarn dev
```

- App: http://localhost:3000

#### If Next.js doesn't work:

- Make sure you have Node.js >=18 and pnpm (or npm/yarn) installed
- Try deleting `.next/` and `node_modules/`, then reinstall:
  ```bash
  rm -rf .next node_modules
  pnpm install
  pnpm dev
  ```
- Check for errors in the terminal and address missing dependencies

---

## Mobile (Expo React Native)

- Expo, React Native, TypeScript
- Fonts and colors match the web app
- Integrated with Sentry for error tracking and monitoring

### Local development:

```bash
cd mobile
pnpm install  # or npm install, or yarn
pnpm start    # or npm run start
```

- Scan the QR code with Expo Go app on your phone, or run on an emulator with `pnpm android` or `pnpm ios`

### Environment Configuration

The mobile app uses environment variables for configuration. Copy `.env.example` to `.env.local` and configure:

```bash
cd mobile
cp .env.example .env.local
```

Then edit `.env.local` with your values:
- `EXPO_PUBLIC_API_URL` - Backend API URL
- `EXPO_PUBLIC_SENTRY_DSN` - Sentry error tracking DSN (optional but recommended)
- `EXPO_PUBLIC_POSTHOG_API_KEY` - PostHog analytics key (optional)
- Other OAuth and service keys

See `mobile/SENTRY_SETUP.md` for detailed Sentry setup instructions.

### Testing Deep Linking

To test deep linking in the Expo app, you can use the [`uri-scheme`](https://www.npmjs.com/package/uri-scheme) CLI. This is useful for simulating links that open your app to a specific screen.

**Example (iOS):**

```bash
npx uri-scheme open exp://172.20.10.2:8081/--/test --ios
```

- Replace `172.20.10.2:8081` with your local Expo dev server address if different.
- Replace `/test` with the path you want to test (e.g., `/event/abc123`).
- Use `--android` instead of `--ios` to test on Android.

### Over-the-Air Updates

The mobile app is configured with EAS (Expo Application Services) for over-the-air updates. This allows you to push critical bug fixes and improvements to users without requiring them to download a new version from the app store.

#### Sending Updates

To send an over-the-air update to production users:

```bash
cd mobile
eas update --channel production
```

This command will create an update and make it available to builds of your app that are configured to receive updates on the `production` channel.

#### Verifying Updates

To verify the update works:

1. Force close the app
2. Reopen it twice
3. The update should be applied on the second launch

#### Automatic Updates

You can set up automatic updates using EAS Workflows. Create a file `.eas/workflows/send-updates.yml` at the root of your project:

```yaml
name: Send updates

on:
  push:
    branches: ['main']

jobs:
  send_updates:
    name: Send updates
    type: update
    params:
      channel: production
```

This workflow will send an over-the-air update for the `production` update channel on every commit to your project's `main` branch.

For more information, see the [Expo documentation on over-the-air updates](https://docs.expo.dev/deploy/send-over-the-air-updates/).

---

## Troubleshooting

- Make sure all dependencies are installed for each part (backend, web, mobile)
- For Docker Compose, ensure Docker is running and ports are not in use
- For Next.js issues, see the troubleshooting section above
