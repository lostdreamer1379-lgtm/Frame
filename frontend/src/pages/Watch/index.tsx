import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Info, AlertCircle, Film as FilmIcon, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { VidRiftPlayer, type VidRiftProgressEvent } from '@/components/player/VidRiftPlayer';
import { MovieCarousel } from '@/components/movies/MovieCarousel';
import { useAuth } from '@/contexts/AuthContext';
import { useMovieDetails, useSimilarMovies } from '@/hooks/useMovies';
import { useMovieWatchHistory, useUpdateWatchHistory } from '@/hooks/useHistory';
import { useWatchlist } from '@/hooks/useWatchlist';
import { tmdbImage, formatYear, formatRuntime } from '@/utils/tmdb';
import { buildRoute, ROUTES } from '@/lib/routes';
import { WatchPartyLauncher } from '@/components/movies/WatchPartyLauncher';

const PROGRESS_SAVE_INTERVAL_MS = 10000;

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const movieId = id ? Number(id) : undefined;
  const { user } = useAuth();

  const { data: movie, isLoading, error } = useMovieDetails(id);
  const { data: historyEntry } = useMovieWatchHistory(movieId);
  const { data: similar, isLoading: similarLoading } = useSimilarMovies(id);
  const { mutate: saveHistory } = useUpdateWatchHistory();
  const { watchlistIds, toggle } = useWatchlist();

  // Tracks the latest progress VidRift reported, independent of the save
  // throttle below — so a pause/ended event can always persist the freshest
  // position even if the throttled timer hasn't fired yet.
  const lastProgressRef = useRef<VidRiftProgressEvent | null>(null);
  const lastSavedAtRef = useRef(0);
  const saveInFlightRef = useRef(false);

  const saveProgress = useCallback((opts?: { completed?: boolean }) => {
    if (!user || !movieId || !lastProgressRef.current) return;
    if (saveInFlightRef.current) return;
    const { currentTime, duration } = lastProgressRef.current;
    saveInFlightRef.current = true;
    saveHistory({
      tmdbMovieId: movieId,
      currentPosition: currentTime,
      duration,
      completed: opts?.completed,
    }, {
      onSettled: () => {
        saveInFlightRef.current = false;
      },
    });
    lastSavedAtRef.current = Date.now();
  }, [user, movieId, saveHistory]);

  const handleProgress = useCallback((e: VidRiftProgressEvent) => {
    lastProgressRef.current = e;
    if (Date.now() - lastSavedAtRef.current >= PROGRESS_SAVE_INTERVAL_MS) saveProgress();
  }, [saveProgress]);

  const handlePausedChange = useCallback((paused: boolean) => {
    if (paused) saveProgress();
  }, [saveProgress]);

  const handleEnded = useCallback(() => saveProgress({ completed: true }), [saveProgress]);

  // Best-effort save when the person navigates away mid-playback.
  useEffect(() => () => saveProgress(), [saveProgress]);

  const tmdbUnconfigured = (error as Error | null)?.message?.includes('TMDB');
  const resumePosition = historyEntry?.currentPosition;

  const progressPct = useMemo(() => {
    if (!historyEntry?.duration || historyEntry.duration <= 0) return null;
    return Math.min(100, Math.round((historyEntry.currentPosition / historyEntry.duration) * 100));
  }, [historyEntry]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)]">
        <div className="max-w-screen-xl mx-auto px-5 py-6">
          <div className="h-5 w-32 skeleton mb-6" />
          <div className="w-full rounded-2xl skeleton" style={{ aspectRatio: '16/9' }} />
        </div>
      </div>
    );
  }

  if (tmdbUnconfigured) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-16">
        <Link to={ROUTES.EXPLORE} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] mb-8">
          <ArrowLeft size={15} /> Back
        </Link>
        <EmptyState icon={<AlertCircle size={22} />} title="TMDB not configured" description="Set TMDB_API_READ_ACCESS_TOKEN in backend/.env to load this movie." />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-16">
        <Link to={ROUTES.EXPLORE} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] mb-8">
          <ArrowLeft size={15} /> Back
        </Link>
        <EmptyState icon={<FilmIcon size={22} />} title="Movie not found" description="This movie may have been removed, or the ID is invalid." />
      </div>
    );
  }

  const posterUrl = tmdbImage.poster(movie.poster_path, 'w185');
  const year = formatYear(movie.release_date);
  const runtime = movie.runtime ? formatRuntime(movie.runtime) : null;

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      {/* Top bar */}
      <div className="max-w-screen-xl mx-auto px-5 py-5 flex items-center gap-4 flex-wrap">
        <Link to={buildRoute.movie(movie.id)} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
          <ArrowLeft size={15} /> Back to details
        </Link>
        <span className="text-[var(--border)]">|</span>
        <span className="text-sm text-[var(--text-primary)] font-medium">{movie.title}</span>
      </div>

      {/* Player */}
      <div className="max-w-screen-xl mx-auto px-5">
        <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <VidRiftPlayer
            tmdbId={movie.id}
            resumePosition={resumePosition}
            onProgress={handleProgress}
            onPausedChange={handlePausedChange}
            onEnded={handleEnded}
          />
        </motion.div>

        {/* Resume / progress indicator */}
        {user && progressPct !== null && progressPct > 0 && progressPct < 95 && (
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex-1 h-1 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs text-[var(--text-muted)] shrink-0">{progressPct}% watched</span>
          </div>
        )}

        {!user && (
          <div className="mt-4 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center gap-3">
            <Lock size={14} className="text-[var(--text-muted)] shrink-0" />
            <p className="text-xs text-[var(--text-secondary)]">
              <Link to={ROUTES.LOGIN} className="text-[var(--accent)] hover:underline">Sign in</Link> to save your watch progress and resume later.
            </p>
          </div>
        )}

        {/* Movie info row */}
        <div className="mt-6 flex gap-4 items-start">
          {posterUrl && (
            <Link to={buildRoute.movie(movie.id)} className="shrink-0 hidden sm:block">
              <img src={posterUrl} alt={movie.title} className="w-16 rounded-lg border border-[var(--border)]" />
            </Link>
          )}
          <div className="flex-1">
            <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">{movie.title}</h1>
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-1.5">
              {year && <span>{year}</span>}
              {runtime && <span>{runtime}</span>}
            </div>
            {movie.overview && (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-2 max-w-2xl line-clamp-2">{movie.overview}</p>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <WatchPartyLauncher movieId={movie.id} />
            <Link to={buildRoute.movie(movie.id)}><Button variant="secondary" size="sm" icon={<Info size={14} />}>Details</Button></Link>
          </div>
        </div>

        {/* Similar movies */}
        {(similar?.results?.length ?? 0) > 0 && (
          <div className="mt-12 pb-16">
            <MovieCarousel
              title="You might also like"
              movies={similar?.results ?? []}
              loading={similarLoading}
              onWatchlistToggle={toggle}
              watchlistIds={watchlistIds}
            />
          </div>
        )}
      </div>
    </div>
  );
}
