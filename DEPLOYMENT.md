# FRAME — Deployment Guide

This guide walks through deploying FRAME to production: frontend and backend as separate Vercel projects, with the database and auth on Supabase.

---

## Overview

| Component | Platform | Why |
|---|---|---|
| Frontend | Vercel | Built for static/SPA React builds; fast global CDN |
| Backend | Vercel | Serverless API function in `backend/api/index.ts` |
| Database + Auth | Supabase | Already the source of truth from Phase 4–5 |

### Vercel backend considerations

FRAME's backend keeps two kinds of **in-process state** that do not persist across serverless instances:

1. **The TMDB response cache** (`backend/src/utils/cache.ts`) is a plain in-memory `Map`. On serverless, every cold start wipes it and concurrent invocations don't share it, so you'd hit TMDB's rate limit far more than intended.
2. **The rate limiters** (`express-rate-limit`) also track state in memory per-process. Serverless cold starts and parallel invocations make these less effective at protecting the TMDB quota.

The backend is compatible with Vercel serverless deployment, but cache and rate-limit state is per instance. Use Supabase's pooled `DATABASE_URL` to reduce connection pressure. For higher traffic, move cache and rate-limit state to a shared store such as Redis.

---

## 1. Database & Auth — Supabase

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. **Settings → API** — copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key (⚠️ server-only — never put this in the frontend)
3. **Settings → Database** — copy the two connection strings:
   - **Connection pooling** string → `DATABASE_URL`
   - **Direct connection** string → `DIRECT_URL`
4. (Optional) **Authentication → Providers** — enable Google if you want the "Continue with Google" button to work.
5. **Authentication → URL Configuration** — set the **Site URL** to your production frontend URL (e.g. `https://frame.yourdomain.com`), and add it to **Redirect URLs** too. This is required for password-reset emails and OAuth to redirect back correctly.
6. From your local machine, with `backend/.env` filled in:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
   This applies the schema (`backend/prisma/schema.prisma`) to your production database. Review the generated migration before confirming if you're doing this against a live database for the first time.

---

## 2. Backend — Vercel

1. Push this repository to GitHub/GitLab.
2. In the [Vercel dashboard](https://vercel.com/new), import this repository as a new project.
3. Set **Root Directory** to `backend`. Vercel will use `backend/vercel.json` and the backend `package.json`.
4. Set these environment variables in the backend project:

   | Variable | Value |
   |---|---|
   | `FRONTEND_URL` | Your frontend Vercel URL, once you have it (step 3 below) — e.g. `https://frame.vercel.app` |
   | `TMDB_API_READ_ACCESS_TOKEN` | From themoviedb.org → Settings → API |
   | `SUPABASE_URL` | From Supabase step 1 above |
   | `SUPABASE_ANON_KEY` | From Supabase step 1 above |
   | `SUPABASE_SERVICE_ROLE_KEY` | From Supabase step 1 above |
   | `DATABASE_URL` | From Supabase step 1 above (pooled) |
   | `DIRECT_URL` | From Supabase step 1 above (direct) |

5. Deploy. Vercel exposes the API at `/api`, with health at `/api/health`.
6. Note the backend URL (e.g. `https://frame-api.vercel.app`) for the frontend's `VITE_API_BASE_URL`.

The Prisma client is generated during install/build into `backend/generated/prisma`; that directory is intentionally ignored by git.

---

## 3. Frontend — Vercel

1. In the [Vercel dashboard](https://vercel.com/new), import this repository.
2. Set **Root Directory** to `frontend`. Vercel will pick up `frontend/vercel.json` automatically (SPA rewrites + asset caching).
3. Set environment variables (**Settings → Environment Variables**):

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | Your backend's full URL + `/api`, e.g. `https://frame-api.vercel.app/api` |
   | `VITE_SUPABASE_URL` | Same Supabase project URL as the backend |
   | `VITE_SUPABASE_ANON_KEY` | Same Supabase anon key as the backend |

4. Deploy. Vercel runs `npm run build`, outputs `dist/`.
5. Once live, set the backend project's `FRONTEND_URL` to this frontend Vercel URL, then redeploy the backend so CORS allows it.

---

## 4. Post-deploy checklist

- [ ] Visit `https://your-backend-url/api/health` — confirm `"tmdb": true`, `"supabase": true`, `"database": true`
- [ ] Visit the frontend — confirm the Home page loads real movie carousels (not the "TMDB not configured" notice)
- [ ] Sign up a test account — confirm the confirmation email arrives (check Supabase's email settings if not)
- [ ] Sign in — confirm the Profile page shows your email and the theme you pick persists after a refresh
- [ ] Add a movie to your watchlist and to a new collection — confirm both appear after a page reload
- [ ] Open a movie's Watch page — confirm the VidRift player loads (see `TESTING.md` for what "loads" means for content you're authorised to embed)
- [ ] Check the browser console and Network tab for any request still pointed at `localhost`

---

## 5. Custom domains (optional)

- **Frontend**: Vercel → Project Settings → Domains → add your domain, follow their DNS instructions.
- **Backend**: Vercel → backend project → Settings → Domains.
- After adding a custom frontend domain, update:
  - The backend's `FRONTEND_URL` env var
  - Supabase's **Site URL** and **Redirect URLs** (Authentication → URL Configuration)

---

## 6. Rolling back / redeploying

Both Vercel projects redeploy automatically on every push to their connected branch. To roll back:
- **Vercel**: Deployments tab → pick a previous deployment → "Promote to Production"
- **Backend Vercel**: Deployments tab → pick a previous deployment → "Promote to Production"

Database migrations are not automatically rolled back — `prisma migrate` is additive by design. Plan schema changes with that in mind.
