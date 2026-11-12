import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Compass, TrendingUp, Star, Calendar, Flame, AlertCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MovieCarousel } from '@/components/movies/MovieCarousel';
import { HeroSection } from '@/components/movies/HeroSection';
import { useHomeSections, useMoviesByIds } from '@/hooks/useMovies';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchHistoryList } from '@/hooks/useHistory';
import { tmdbImage, formatYear } from '@/utils/tmdb';
import { buildRoute, ROUTES } from '@/lib/routes';

const SECTION_VARIANTS = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function HomePage() {
  const { trending, popular, topRated, upcoming, heroMovie, heroLoading } = useHomeSections();
  const { watchlistIds, toggle } = useWatchlist();
  const { user } = useAuth();

  const tmdbUnconfigured =
    (trending.error as Error | null)?.message?.includes('TMDB') ||
    (popular.error as Error | null)?.message?.includes('TMDB');

  const sections = [
    { title: 'Trending Now',   subtitle: 'What everyone is watching this week', icon: <TrendingUp size={16} />, ...trending },
    { title: 'Popular Movies', subtitle: 'All-time crowd favourites',           icon: <Flame size={16} />,      ...popular  },
    { title: 'Top Rated',      subtitle: 'The highest acclaimed films',         icon: <Star size={16} />,       ...topRated },
    { title: 'Upcoming',       subtitle: 'Opening soon',                        icon: <Calendar size={16} />,   ...upcoming },
  ];

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      {heroMovie || heroLoading ? (
        <HeroSection
          movie={heroMovie}
          movies={trending.data}
          loading={heroLoading}
          isInWatchlist={heroMovie ? watchlistIds.has(heroMovie.id) : false}
          watchlistIds={watchlistIds}
          onWatchlistToggle={toggle}
        />
      ) : (
        <FallbackHero />
      )}

      {/* ── Movie sections ── */}
      <div className="max-w-screen-xl mx-auto px-6 w-full pb-20 flex flex-col gap-14 pt-14">
        {tmdbUnconfigured && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-muted)] p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--bg-main)] border border-[var(--accent)]/30 flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">TMDB not configured</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Set <code className="font-mono bg-[var(--bg-main)] px-1 py-0.5 rounded">TMDB_API_READ_ACCESS_TOKEN</code> in{' '}
                <code className="font-mono bg-[var(--bg-main)] px-1 py-0.5 rounded">backend/.env</code> to load live movie data.
              </p>
            </div>
          </motion.div>
        )}

        {user && <ContinueWatchingRow />}

        {sections.map((s, i) => (
          <motion.div
            key={s.title}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={SECTION_VARIANTS}
          >
            <MovieCarousel
              title={s.title}
              subtitle={s.subtitle}
              movies={s.data}
              loading={s.isLoading}
              error={s.error ? 'Unable to load this section right now.' : undefined}
              onWatchlistToggle={toggle}
              watchlistIds={watchlistIds}
              viewAllHref={ROUTES.EXPLORE}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ContinueWatchingRow() {
  const { data: history, isLoading: historyLoading } = useWatchHistoryList();

  const inProgress = useMemo(
    () => (history ?? []).filter((e) => !e.completed && e.currentPosition > 10).slice(0, 12),
    [history]
  );

  const { movies: hydrated, isLoading: moviesLoading } = useMoviesByIds(inProgress.map((e) => e.tmdbMovieId));

  if (!historyLoading && inProgress.length === 0) return null;

  const items = inProgress
    .map((entry) => {
      const movie = hydrated.find((m) => m.id === entry.tmdbMovieId);
      if (!movie) return null;
      const pct = entry.duration && entry.duration > 0
        ? Math.min(100, Math.round((entry.currentPosition / entry.duration) * 100))
        : null;
      return { entry, movie, pct };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <History size={16} className="text-[var(--text-muted)]" />
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">Continue Watching</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
        {(historyLoading || moviesLoading) && items.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0" style={{ width: 220 }}>
                <div className="aspect-backdrop skeleton rounded-xl" />
              </div>
            ))
          : items.map(({ entry, movie, pct }) => {
              const backdropUrl = tmdbImage.backdrop(movie.backdrop_path, 'w780') ?? tmdbImage.poster(movie.poster_path, 'w342');
              return (
                <Link
                  key={entry.id}
                  to={buildRoute.watch(movie.id)}
                  className="shrink-0 group"
                  style={{ width: 220 }}
                >
                  <div className="relative aspect-backdrop rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-elevated)] mb-2">
                    {backdropUrl ? (
                      <img src={backdropUrl} alt={movie.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display text-2xl text-[var(--accent)] opacity-40">{movie.title.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center">
                        <Play size={16} fill="var(--bg-main)" stroke="none" />
                      </div>
                    </div>
                    {pct !== null && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                        <div className="h-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors">{movie.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatYear(movie.release_date)}{pct !== null ? ` · ${pct}% watched` : ''}</p>
                </Link>
              );
            })
        }
      </div>
    </section>
  );
}

function FallbackHero() {
  return (
    <section className="relative flex items-end overflow-hidden" style={{ minHeight: '78vh' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-main) 60%, var(--bg-main) 100%)' }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 pb-24 w-full">
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--accent)]/40 bg-[var(--accent-muted)] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--accent)]">Cinema awaits</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-tight text-[var(--text-primary)] mb-5">
            Your cinematic<br /><span style={{ color: 'var(--accent)' }}>universe.</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg mb-8">
            Discover, track and watch films — beautifully designed for the passionate cinema lover.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to={ROUTES.EXPLORE}>
              <Button size="lg" icon={<Play size={18} fill="currentColor" strokeWidth={0} />}>Start Watching</Button>
            </Link>
            <Link to={ROUTES.EXPLORE}>
              <Button size="lg" variant="secondary" icon={<Compass size={18} />}>Explore Films</Button>
            </Link>
          </div>
        </motion.div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-40 gradient-bottom pointer-events-none" />
    </section>
  );
}
