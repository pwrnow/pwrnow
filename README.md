# PWr Now Monorepo

PWr Now is a platform for discovering and managing events at Politechnika Wrocławska. This monorepo contains three main parts:

- **backend/** – Django REST API, Celery workers, PostgreSQL, Redis
- **web/** – Next.js 15 web frontend (React, Tailwind CSS)
- **mobile/** – Expo React Native mobile app

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

### Local development:

```bash
cd mobile
pnpm install  # or npm install, or yarn
pnpm start    # or npm run start
```

- Scan the QR code with Expo Go app on your phone, or run on an emulator with `pnpm android` or `pnpm ios`

### Testing Deep Linking

To test deep linking in the Expo app, you can use the [`uri-scheme`](https://www.npmjs.com/package/uri-scheme) CLI. This is useful for simulating links that open your app to a specific screen.

**Example (iOS):**

```bash
npx uri-scheme open exp://172.20.10.2:8081/--/test --ios
```

- Replace `172.20.10.2:8081` with your local Expo dev server address if different.
- Replace `/test` with the path you want to test (e.g., `/event/abc123`).
- Use `--android` instead of `--ios` to test on Android.

---

## Troubleshooting

- Make sure all dependencies are installed for each part (backend, web, mobile)
- For Docker Compose, ensure Docker is running and ports are not in use
- For Next.js issues, see the troubleshooting section above
