# Copilot Instructions for PWr Now

## Repository Overview

PWr Now is a platform for discovering and managing events at Politechnika Wrocławska. This is a monorepo containing three main applications:

- **backend/** – Django REST API with Celery workers, PostgreSQL, and Redis
- **web/** – Next.js 15 web frontend with React 19 and Tailwind CSS
- **mobile/** – Expo React Native mobile app

## Technology Stack

### Backend (Django)
- **Framework**: Django 5.2.3 with Django REST Framework 3.16.0
- **Python Version**: 3.12
- **Database**: PostgreSQL 17
- **Cache**: Redis 7
- **Task Queue**: Celery 5.5.3 with django-celery-beat
- **Key Libraries**: 
  - django-modeltranslation 0.19.16 (i18n)
  - Pillow 10.3.0 (image processing)
  - langchain, langchain-openai (AI features)
  - dj-rest-auth, django-allauth (authentication)
  - sqids 0.4.1 (URL-safe IDs)

### Web Frontend (Next.js)
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **TypeScript**: Fully typed with strict mode
- **Testing**: Playwright for E2E tests
- **Internationalization**: next-intl with English and Polish support
- **Package Manager**: pnpm

### Mobile App (Expo)
- **Framework**: Expo SDK ~53.0 with React Native
- **Language**: TypeScript
- **State Management**: TanStack Query with AsyncStorage persistence
- **Styling**: NativeWind (Tailwind for React Native)
- **Package Manager**: pnpm

## Project Structure

```
backend/           # Django backend
├── ai/           # AI processing features
├── config/       # Django settings
├── core/         # Core models (events, organizations, categories)
├── feature_access/
├── locale/       # i18n translations (en, pl)
├── notifications/
├── users/        # User management
└── utils/

web/              # Next.js web app
├── app/          # App Router pages
├── components/   # React components
├── hooks/        # Custom React hooks
├── i18n/         # Internationalization config
├── lib/          # Utilities and helpers
├── messages/     # i18n messages (en.json, pl.json)
└── tests/        # Playwright tests

mobile/           # Expo mobile app
├── app/          # Expo Router screens
├── assets/       # Images and fonts
├── components/   # React Native components
├── contexts/     # React contexts
├── hooks/        # Custom hooks
├── lib/          # Utilities
└── providers/    # React providers
```

## Development Workflow

### Running the Full Stack

Use Docker Compose for the backend services:

```bash
docker-compose up --build
```

This starts:
- Backend API: http://localhost:8000
- Mailpit (dev email): http://localhost:8025
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Django Management Commands

Run commands inside the backend container:

```bash
docker-compose exec backend python manage.py <command>
```

Common commands:
- `migrate` – Run database migrations
- `makemigrations` – Create new migrations
- `createsuperuser` – Create admin user
- `makemessages -l pl -l en` – Extract translation strings
- `compilemessages` – Compile translations
- `import_data` – Import events/categories/organizations from API

### Web Development

```bash
cd web
pnpm install
pnpm dev        # Start dev server at http://localhost:3000
pnpm build      # Production build
pnpm lint       # Run ESLint
```

### Mobile Development

```bash
cd mobile
pnpm install
pnpm start      # Start Expo dev server
pnpm android    # Run on Android
pnpm ios        # Run on iOS
```

## Testing

### Backend Tests (pytest)
```bash
docker-compose run backend pytest
```

- Test files: `test_*.py` or `*_test.py`
- Configuration: `backend/pytest.ini`
- Use pytest-django for database tests

### Web Tests (Playwright)
```bash
cd web
pnpm exec playwright test
```

- Test files in `web/tests/`
- Runs automatically on PRs that change `web/**`

## Code Style and Conventions

### Backend (Django)

1. **i18n**: Wrap all user-facing strings with `gettext_lazy`:
   ```python
   from django.utils.translation import gettext_lazy as _
   
   field = models.CharField(_("field name"))
   ```

2. **File Uploads**: Use UUID-based filenames for all uploaded files:
   ```python
   def upload_to_example(instance, filename):
       ext = os.path.splitext(filename)[1]
       filename = f"{uuid.uuid4()}{ext}"
       return os.path.join("folder", filename)
   ```

3. **ID Generation**: Use `sqids` for public-facing IDs instead of sequential integers

4. **Translations**: Support both Polish (pl) and English (en) for all content

5. **Models**: Use Django's standard model conventions with proper Meta classes

### Web (Next.js)

1. **File Structure**: Use Next.js 15 App Router conventions
   - `app/` directory for routes
   - `components/` for reusable components
   - `lib/` for utilities

2. **TypeScript**: Maintain strict type checking, define proper interfaces

3. **Styling**: Use Tailwind CSS utility classes, follow shadcn/ui patterns

4. **i18n**: Use next-intl for translations:
   ```tsx
   import { useTranslations } from 'next-intl';
   
   const t = useTranslations('namespace');
   ```

5. **Components**: Prefer functional components with TypeScript

### Mobile (Expo)

1. **Navigation**: Use Expo Router for file-based routing

2. **Styling**: Use NativeWind (Tailwind) for consistent styling with web

3. **State Management**: Use TanStack Query for server state

4. **TypeScript**: Maintain strict typing throughout

## Important Patterns

### Backend

- **Authentication**: Uses dj-rest-auth with JWT tokens
- **API Versioning**: API endpoints under `/api/v1/`
- **Celery Tasks**: Async tasks for emails, notifications, data imports
- **Image Processing**: Pillow for image manipulation
- **Model Translation**: django-modeltranslation for multilingual content

### Web

- **Server Components**: Prefer React Server Components where possible
- **API Integration**: Fetch from backend at `NEXT_PUBLIC_API_URL`
- **Error Handling**: Use error.tsx and loading.tsx conventions
- **Metadata**: Define proper SEO metadata for each page

### Mobile

- **Offline Support**: TanStack Query with AsyncStorage for offline-first
- **Deep Linking**: Configured via Expo Router
- **OTA Updates**: EAS Updates for production channel
- **Authentication**: OAuth with Apple and Google

## Environment Variables

### Backend
- `SECRET_KEY` – Django secret (required)
- `DEBUG` – Debug mode (default: True)
- `ALLOWED_HOSTS` – Allowed hosts list
- `DATABASE_URL` – PostgreSQL connection string
- `REDIS_URL` – Redis connection string
- `SITE_URL` – Public site URL

### Web
- `NEXT_PUBLIC_API_URL` – Backend API URL (e.g., https://pwrnow.pl)

## CI/CD

### Workflows

1. **CI (`.github/workflows/ci.yml`)**
   - Runs on: PRs/pushes to main affecting `backend/**`
   - Steps: Build Docker, run migrations, run pytest

2. **Playwright (`.github/workflows/playwright.yml`)**
   - Runs on: PRs/pushes to main affecting `web/**`
   - Steps: Install deps, install browsers, run tests

### Build Caching

- Backend uses Docker layer caching via GitHub Actions cache
- Web uses pnpm for faster installs

## Common Tasks

### Adding a New Django App

1. Create app: `docker-compose exec backend python manage.py startapp <name>`
2. Add to `INSTALLED_APPS` in `config/settings.py`
3. Create models, views, serializers
4. Register in admin if needed
5. Create migrations: `python manage.py makemigrations`

### Adding Translations

**Backend:**
```bash
docker-compose exec backend python manage.py makemessages -l pl -l en --ignore "staticfiles/*" --ignore "media/*"
# Edit .po files in backend/locale/
docker-compose exec backend python manage.py compilemessages
```

**Web:**
Edit `web/messages/en.json` and `web/messages/pl.json` directly.

### Database Migrations

Always create migrations after model changes:
```bash
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

## Best Practices

1. **Never commit secrets** – Use environment variables
2. **Test changes** – Run relevant tests before committing
3. **i18n everything** – All user-facing text must be translatable
4. **Type safety** – Use TypeScript strictly in web/mobile
5. **Docker for backend** – Always develop Django in Docker for consistency
6. **Code review** – Follow PR review process
7. **Minimal changes** – Make focused, surgical changes
8. **Document patterns** – Update docs when adding new conventions

## Troubleshooting

### Docker Issues
- Ensure Docker is running
- Check ports aren't in use (5432, 6379, 8000, 8025)
- Try `docker-compose down -v` to reset volumes

### Next.js Issues
- Delete `.next/` and `node_modules/`, reinstall with `pnpm install`
- Ensure Node.js ≥18 is installed
- Check `NEXT_PUBLIC_API_URL` environment variable

### Mobile Issues
- Clear Expo cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`
- Check `app.json` configuration

## Additional Resources

- Main README: `/README.md`
- Web README: `/web/README.md`
- Monitoring Setup: `/monitoring/README-build.md`
- Analytics: `/web/ANALYTICS.md`
