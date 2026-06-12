# Jamii Sasa — Web

A mobile-first social marketplace frontend for the Jamii Sasa Go backend.
Vue 3 (Composition API) · Vite · Tailwind v4 · Vue Router · Pinia · Axios · lucide-vue-next.

## Setup

```bash
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if your API isn't on :8080
npm run dev            # http://localhost:5173
```

The backend must be running and CORS-enabled for this origin (the Go server
defaults `CORS_ALLOWED_ORIGINS` to `http://localhost:5173`). Apply DB migrations
first: `cd ../jamiisasa-go && go run ./cmd/migrate && go run ./cmd/server`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Base URL of the Go API |

## Architecture

```
src/
├─ api/          Axios client + one module per resource (no API calls in components)
├─ stores/       Pinia: auth.store, feed.store, connection.store
├─ router/       Lazy routes + auth guard
├─ layouts/      AuthLayout, MainLayout (sidebars + mobile bottom-nav + FAB)
├─ views/        auth/, feed/, connections/, profile/
├─ components/   feed/, connections/, profile/, ui/ (reusable kit)
├─ composables/  useToast, useInfiniteScroll
└─ lib/          token, jwt, cn, errors, time
```

### Conventions
- **All** backend communication goes through `src/api/*.api.js` → `src/api/client.js`.
  The client injects the bearer token and, on `401`, clears the session and
  redirects to login.
- Server payloads are sanitized into a stable UI shape inside the stores;
  templates never bind to raw responses.
- Auth is persistent: the JWT lives in `localStorage` (`jamii.token`) and the
  profile is rehydrated from `GET /me` on load.
- Routes are code-split; the feed paginates client-side (the API returns all
  posts at once).

## Features
- JWT auth (login, register-then-auto-login, route guards, auto-logout on 401)
- Social feed: create/like/comment, infinite scroll, skeleton/empty/error states
- Connections: send/accept/reject, search, persistent Connect→Pending→Connected
- Profiles: your own + other users, their posts, and stats
