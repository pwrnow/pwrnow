# Project Context: pwrnow

## Project Overview
`pwrnow` is a comprehensive full-stack application featuring a Django backend, a Next.js web frontend, and a React Native (Expo) mobile application. The system is designed with a service-oriented architecture, utilizing Docker for orchestration.

on every change you make, make a commit message with the changes as the message

## Tech Stack

### Backend (`/backend`)
- **Framework:** Django 5.2+, Django Rest Framework (DRF) 3.16+
- **Language:** Python
- **Database:** PostgreSQL 17
- **Async/Tasks:** Celery 5.5+, Redis
- **AI/ML:** LangChain, OpenAI, Google Generative AI
- **Testing:** Pytest
- **Key Libraries:** `django-filter`, `django-cors-headers`, `django-environ`, `sqids`, `pillow`

### Web Frontend (`/web`)
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4, Radix UI (shadcn/ui), Framer Motion
- **State/Forms:** React Hook Form, Zod
- **Testing:** Playwright
- **Package Manager:** pnpm

### Mobile App (`/mobile`)
- **Framework:** Expo ~53 (React Native 0.81)
- **Language:** TypeScript
- **Styling:** NativeWind (Tailwind CSS)
- **State Management:** TanStack Query (React Query)
- **Navigation:** Expo Router
- **Package Manager:** pnpm

### Infrastructure
- **Containerization:** Docker, Docker Compose
- **Reverse Proxy:** Nginx
- **Monitoring:** Coolify and htop
- **Analytics:** PostHog, Plausible

## Configuration & Commands

### Backend
- **Dependency Management:** `pip install -r requirements.txt`
- **Run Server (Local):** `./manage.py runserver`
- **Run Server (Docker):** `docker compose up backend`
- **Run Tests:** `pytest`
- **Linting:** Recommend `ruff check .` (ensure installed)

### Web
- **Install Dependencies:** `pnpm install`
- **Development Server:** `pnpm dev`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **Test:** `pnpm test` (if configured) or Playwright

### Mobile
- **Install Dependencies:** `pnpm install`
- **Start Expo:** `pnpm start`
- **Run Android:** `pnpm android`
- **Run iOS:** `pnpm ios`

### Docker / Infrastructure
- **Start All Services:** `docker compose up -d`
- **Stop All Services:** `docker compose down`
- **Logs:** `docker compose logs -f [service_name]`

## Key File Paths
- **Backend Settings:** `backend/config/settings.py`
- **Backend URLs:** `backend/config/urls.py`
- **Web Config:** `web/next.config.ts`
- **Mobile Config:** `mobile/app.json`
- **Docker Compose:** `docker-compose.yml`
