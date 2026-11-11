# FRAME — Testing Checklist

This is the manual QA pass for Phase 7. Run through it against a deployed (or local, fully-configured) instance before considering FRAME production-ready. Check items off as you verify them against your own deployment — this file documents *what* to test and *how*, since the actual pass/fail depends on your TMDB token, Supabase project, and the specific movies your VidRift access covers.

---

## Before you start

- [ ] `backend/.env` has `TMDB_API_READ_ACCESS_TOKEN`, `SUPABASE_*`, and `DATABASE_URL`/`DIRECT_URL` all set
- [ ] `frontend/.env` has `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` all set
- [ ] `npm run db:migrate` has been run against the target database
- [ ] `GET /api/health` returns `"tmdb": true, "supabase": true, "database": true`

---

## Frontend

### Routing & navigation
- [ ] Every route in `frontend/src/lib/routes.ts` loads without a blank page or console error: `/`, `/explore`, `/movie/:id`, `/watch/:id`, `/watchlist`, `/collections`, `/collections/:id`, `/people/:id`, `/profile`, `/settings`, `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password`
- [ ] An unknown path (e.g. `/this-does-not-exist`) shows the 404 page, not a blank screen
- [ ] Navigating via the header links, footer links, and in-page links (movie cards, "Back to Explore", etc.) all land on the right page
- [ ] Refreshing the browser on a deep route (e.g. `/movie/603`) works in production (this is what `frontend/vercel.json`'s rewrite rule is for — if it 404s, that config isn't being picked up)
- [ ] Mobile menu opens/closes correctly and its links work

### Search & filters (Explore page)
- [ ] Typing a query returns results after the debounce; clearing the query returns to Discover mode
- [ ] Genre, year, and rating filters each narrow results; combining more than one works together
- [ ] Changing "Sort by" actually changes the result order
- [ ] Search and filters are mutually exclusive as designed (filters disable while actively searching) — confirm this still matches your expectations, or adjust if not
- [ ] An empty result set shows the empty state, not a blank grid

### Movie details
- [ ] A real movie's backdrop, poster, title, tagline, overview, runtime, genres, rating, and director all render
- [ ] A movie with *no* tagline, or *no* runtime, hides that field gracefully rather than showing "null" or an empty row — this is the "don't fabricate missing TMDB fields" requirement
- [ ] Cast carousel scrolls and each cast member links to a working People page
- [ ] Trailer button opens the modal and the YouTube embed actually plays (skip gracefully-missing this if a given movie has no trailer on TMDB)
- [ ] Watch Providers section shows real logos when TMDB/JustWatch has data for your region, and a clear "no info" message when it doesn't
- [ ] Similar / Recommended carousels populate

### All six themes
- [ ] Each of the 6 themes (Profile → Appearance) visibly changes background, card, text, and accent colors across **every** page type: Home, Explore, a movie detail page, Watch, Watchlist, Collections, Profile, Settings, and an auth page
- [ ] Switching themes has no flash-of-wrong-theme on a hard refresh (this is what the `index.html` inline script is for)
- [ ] Theme persists after closing and reopening the browser (guest: localStorage; signed-in: also check it survives signing in on a *different* browser/device)
- [ ] "Reset" button returns to Cinema Night

### Authentication
- [ ] Sign up with a new email — confirmation email arrives, clicking it activates the account
- [ ] Sign in with correct credentials succeeds and redirects to the page you were trying to reach before being sent to login
- [ ] Sign in with wrong password shows a friendly error, not a raw Supabase error string
- [ ] Forgot password → email arrives → reset link lands on `/auth/reset-password` → new password works on next sign-in
- [ ] Sign out actually clears the session (refreshing shows you as signed out)
- [ ] `/settings` redirects to login when signed out, and lands back on `/settings` after signing in

### Watchlist
- [ ] Signed out: adding a movie via the bookmark icon works, persists across a refresh (localStorage), and shows a clear "sign in to track status" prompt
- [ ] Signed in: the same action creates a real DB row — confirm via a refresh *and* by checking the Supabase table editor
- [ ] Changing an entry's status (e.g. Planning → Watching) updates immediately and the per-status counts update
- [ ] Removing an entry removes it everywhere (the Watchlist page and the bookmark icon's filled state elsewhere)
- [ ] Search within the watchlist filters correctly

### Collections
- [ ] Create, rename, and delete a collection
- [ ] Add a movie via the search modal; confirm duplicates are prevented (the "already added" checkmark state)
- [ ] Remove a movie from a collection
- [ ] Reorder movies with the up/down controls and confirm the order survives a page refresh
- [ ] "Add to Collection" from a Movie Details page works end-to-end, including creating a brand-new collection inline

### Responsive layouts
- [ ] Test at a phone width (~375px), a tablet width (~768px), and desktop (~1440px) for: Home, Explore, Movie Details, Watch, and Profile
- [ ] The mobile nav menu, not the desktop nav, appears below the `md` breakpoint
- [ ] No horizontal scroll/overflow on any page at phone width

---

## Backend

- [ ] `GET /api/health` responds and accurately reflects which services are configured
- [ ] Hitting any `/api/profile`, `/api/watchlist`, `/api/collections`, `/api/history` endpoint **without** an Authorization header returns `401`, not a crash or a 500
- [ ] Hitting them with an **expired or malformed** token also returns `401`
- [ ] Try to update or delete another user's watchlist entry/collection by guessing an ID — confirm you get a `404`, not someone else's data (ownership checks in `watchlist.service.ts` / `collections.service.ts`)
- [ ] Send invalid input to a POST/PUT endpoint (e.g. a negative `tmdbMovieId`, a `theme` value not in the allowed list) — confirm a `400` with a clear Zod validation message, not a 500
- [ ] Temporarily set a wrong `TMDB_API_READ_ACCESS_TOKEN` and confirm `/api/movies/*` returns a clear `502 TMDB_AUTH_ERROR` rather than hanging or crashing the server
- [ ] Confirm the response body of any error never contains a stack trace or raw database error in production (`NODE_ENV=production`)
- [ ] Grep your own deployed bundle / network responses for `SUPABASE_SERVICE_ROLE_KEY` — it should never appear anywhere client-visible

---

## Playback (VidRift)

> **Only test with content you are actually authorised to embed.** A working iframe is not the same as having distribution rights — see the Content Rights note in the main README.

- [ ] Open the Watch page for a movie your VidRift access covers. Confirm the generated URL is exactly `https://embed.vidrift.net/embed/movie/{the real TMDB id}` (check the iframe's `src` in devtools) — never a fabricated ID
- [ ] Confirm the player transitions from the loading spinner to actual video, and that this happens within the component's grace window
- [ ] Fullscreen button works (both our custom control and, if VidRift exposes its own, that one too)
- [ ] Resize the browser / test on a real phone — the player stays a correct 16:9 box at every width
- [ ] Play for 15+ seconds, then check the Supabase `watch_history` table — confirm a row exists with a sensible `current_position` and `last_watched_at`
- [ ] Pause — confirm the position saves immediately (don't wait for the 10s throttle) by checking the DB
- [ ] Navigate away mid-playback, then reopen the same movie's Watch page — confirm `resumePosition` is passed and the player receives the `vidrift:resume` postMessage (check the Network/Console — VidRift's own behavior on receiving it is outside FRAME's control)
- [ ] Let a short movie play to the end (or manually trigger `vidrift:ended` via devtools if you want to test without waiting) — confirm `completed: true` is saved, and that reopening it afterward doesn't un-complete it on the next progress tick (this was a real bug caught and fixed in Phase 6 — see README)
- [ ] Open the Watch page for a TMDB ID VidRift does **not** have — confirm the player shows the honest "couldn't confirm playback" error with a working Retry button, and that the rest of the page (title, back-link, similar movies) still renders normally
- [ ] Open devtools → Console, and manually `postMessage` a fake event from a different origin at the iframe — confirm FRAME ignores it (the origin check in `VidRiftPlayer.tsx`)

---

## Deployment

- [ ] `npm run build` succeeds for both `frontend` and `backend` with zero errors
- [ ] `npm run type-check` passes for both
- [ ] Environment variables are set on both Vercel projects per `DEPLOYMENT.md` — no `.env` file was ever committed
- [ ] The deployed frontend's API calls go to the deployed backend's URL, not `localhost`
- [ ] Database migrations have been applied to the **production** Supabase project (not just a local/dev one)
- [ ] Supabase's Site URL and Redirect URLs point at the production frontend domain (needed for password-reset and OAuth redirects to work)
- [ ] A fresh incognito window, signed out, can browse Home/Explore/Movie Details/Watch with no errors
- [ ] A fresh signup → confirm → sign in → add to watchlist → add to collection → watch a movie → sign out → sign back in flow works end-to-end on the live deployment
