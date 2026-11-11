# FRAME

A premium, cinematic movie discovery and watching platform.

> **Status: v1.0.0 — all 7 phases complete.** FRAME is a complete, secure, deployable movie platform with live TMDB discovery, VidRift playback, Supabase auth, and a database-backed watchlist and collections system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion |
| Routing | React Router v6 |
| State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Backend | Node.js, Express, TypeScript |
| Database | Supabase PostgreSQL + Prisma ORM |
| Auth | Supabase Authentication |
| Movie data | TMDB API |
| Playback | VidRift |
| Deployment | Vercel (frontend + backend) + Supabase |

---

## Quick Start

```bash
# 1. Install
npm run install:all

# 2. Configure
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
# → fill in TMDB + Supabase credentials, see backend/.env.example

# 3. Database
npm run db:generate
npm run db:migrate

# 4. Run
npm run dev
# Frontend : http://localhost:5173
# Backend  : http://localhost:3001/api/health
```

Deploying to production? See **[DEPLOYMENT.md](./DEPLOYMENT.md)**.
Running QA before launch? See **[TESTING.md](./TESTING.md)**.

---

## What FRAME does

- **Discover** — trending, popular, top-rated, and upcoming movies; full search with genre/year/rating/sort filters (`frontend/src/pages/Home`, `Explore`)
- **Explore detail** — cast, trailers, watch providers, similar/recommended movies (`MovieDetails`)
- **Watch** — VidRift playback with resume, progress tracking, and an honest error state that never claims a movie is available when it can't confirm that (`Watch`, `components/player/VidRiftPlayer.tsx`)
- **Track** — a database-backed watchlist with 5 statuses, personal collections with reordering, and watch history with a Continue Watching row (`Watchlist`, `Collections`, `useHistory`)
- **Personalise** — 6 full cinematic themes, synced to your account once signed in (`Profile`, `ThemeContext`)
- **Account** — sign up, sign in, Google OAuth, forgot/reset password, protected routes (`contexts/AuthContext.tsx`, `pages/Auth/`)

---

## Project Structure

```
FRAME/
├── frontend/              React + Vite application
│   └── src/
│       ├── components/    ui/, movies/, player/, layout/, common/
│       ├── contexts/      AuthContext, ThemeContext
│       ├── hooks/         useMovies, usePeople, useWatchlist, useCollections, useHistory, useProfile
│       ├── pages/         Home, Explore, MovieDetails, Watch, Watchlist, Collections, People, Profile, Settings, Auth
│       └── services/      movies, people, profile, watchlist, collections, history
├── backend/                Express API
│   └── src/
│       ├── config/        env, supabase, prisma
│       ├── controllers/   movies, people, profile, watchlist, collections, history
│       ├── services/      tmdb.service (cache + error translation), profile/watchlist/collections/history services
│       ├── middleware/     auth (JWT verification), requireBackingServices, errorHandlers
│       ├── validators/     Zod schemas per domain
│       └── routes/
├── backend/prisma/schema.prisma   Profile, WatchlistEntry, WatchHistory, MovieCollection, CollectionMovie
├── .github/workflows/ci.yml  Type-check + build on every push/PR
├── DEPLOYMENT.md          Step-by-step production deployment guide
└── TESTING.md             Manual QA checklist
```

---

## Environment Variables

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend URL (`/api` in dev; full URL + `/api` in production) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Supabase public config |

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `PORT` / `FRONTEND_URL` / `NODE_ENV` | Server + CORS |
| `TMDB_API_READ_ACCESS_TOKEN` | TMDB v4 Read Access Token |
| `DATABASE_URL` / `DIRECT_URL` | Supabase PostgreSQL (pooled / direct) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase auth — the service role key is **server-only**, verified to never appear in any frontend file |

Every env-dependent feature degrades honestly rather than crashing when unconfigured: `GET /api/health` reports exactly which of TMDB / Supabase / the database are set up, and any route needing a missing one returns a clear `503` naming it.

---

## Security notes

- The TMDB token and Supabase service-role key live only in `backend/.env`, never sent to the browser
- Every write to a user's watchlist, collection, or profile verifies **ownership** server-side before touching a row — a client-submitted user ID is never trusted; identity comes only from a verified Supabase JWT (`backend/src/middleware/auth.ts`)
- VidRift's postMessage interface is handled with the origin and source checks documented in `VidRiftPlayer.tsx` — arbitrary cross-origin messages are ignored
- Production error responses never leak stack traces or raw database errors (`backend/src/middleware/errorHandlers.ts`)
- Zod validates every request body and query param before it reaches a service

---

## Development Phases

| Phase | Status | Description |
|---|---|---|
| 1 | ✅ | Project foundation, routing, structure |
| 2 | ✅ | Design system, UI components, all pages styled |
| 3 | ✅ | TMDB integration, live movie data everywhere |
| 4 | ✅ | Supabase auth, protected routes, database-backed profiles |
| 5 | ✅ | Watchlist (status tracking) & Collections (CRUD + reordering) |
| 6 | ✅ | VidRift playback, watch history, resume, Continue Watching |
| 7 | ✅ | Final QA, CI, deployment configuration & documentation |

### Notable fixes made along the way
- **Phase 5**: replaced an `any`-cast watchlist hook with a proper discriminated union after noticing guest and signed-in entries have genuinely incompatible shapes.
- **Phase 6**: caught a Zod `.default(false)` on `completed` that would have silently un-completed a finished movie on its very next progress tick — fixed by letting `undefined` survive to the service layer.
- **Phase 7**: added the missing `vite-env.d.ts` (so `import.meta.env.VITE_*` is actually typed instead of implicitly falling back to loose typing), and hardened `watchlistService.add` / `collectionsService.addMovie` against a double-click race condition on the unique constraint.

---

## Content rights

A working VidRift embed does not by itself establish distribution or streaming rights for any given title. FRAME does not implement DRM circumvention, access-control bypasses, or unauthorised downloading — only embed and playback of content the deploying party is authorised to make available.

---

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
Watch provider data by [JustWatch](https://www.justwatch.com), via TMDB.
