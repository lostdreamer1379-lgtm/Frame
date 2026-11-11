import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Play, Bookmark, BookmarkCheck, Plus, Clock, Calendar,
  Globe, Star, Film as FilmIcon, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DetailsSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MovieCarousel } from '@/components/movies/MovieCarousel';
import { CastList } from '@/components/movies/CastList';
import { TrailerModal } from '@/components/movies/TrailerModal';
import { AddToCollectionModal } from '@/components/movies/AddToCollectionModal';
import { WatchProviders } from '@/components/movies/WatchProviders';
import {
  useMovieDetails, useMovieCredits, useMovieVideos,
  useMovieRecommendations, useSimilarMovies, useWatchProviders,
} from '@/hooks/useMovies';
import { pickTrailer } from '@/services/movies.service';
import { useWatchlist } from '@/hooks/useWatchlist';
import { tmdbImage, formatRuntime, formatYear, languageName, detailToMovie } from '@/utils/tmdb';
import { ROUTES, buildRoute } from '@/lib/routes';

export default function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [backdropError, setBackdropError] = useState(false);
  const [posterError, setPosterError] = useState(false);

  const { data: movie, isLoading, error } = useMovieDetails(id);
  const { data: credits, isLoading: creditsLoading } = useMovieCredits(id);
  const { data: videos } = useMovieVideos(id);
  const { data: recommendations, isLoading: recLoading } = useMovieRecommendations(id);
  const { data: similar, isLoading: simLoading } = useSimilarMovies(id);
  const { data: providers, isLoading: providersLoading } = useWatchProviders(id);

  const { watchlistIds, toggle } = useWatchlist();

  const trailer = videos ? pickTrailer(videos) : null;
  const director = credits?.crew.find((c) => c.job === 'Director');

  const tmdbUnconfigured = (error as Error | null)?.message?.includes('TMDB');

  if (isLoading) return <DetailsSkeleton />;

  if (tmdbUnconfigured) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-16">
        <Link to={ROUTES.EXPLORE} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] mb-8">
          <ArrowLeft size={15} /> Back
        </Link>
        <EmptyState
          icon={<AlertCircle size={22} />}
          title="TMDB not configured"
          description="Set TMDB_API_READ_ACCESS_TOKEN in backend/.env to load movie details."
        />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-16">
        <Link to={ROUTES.EXPLORE} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] mb-8">
          <ArrowLeft size={15} /> Back
        </Link>
        <EmptyState icon={<FilmIcon size={22} />} title="Movie not found" description="This movie may have been removed or the ID is invalid." />
      </div>
    );
  }

  const backdropUrl = tmdbImage.backdrop(movie.backdrop_path, 'w1280');
  const posterUrl   = tmdbImage.poster(movie.poster_path, 'w500');
  const year        = formatYear(movie.release_date);
  const runtime     = movie.runtime ? formatRuntime(movie.runtime) : null;
  const isSaved     = watchlistIds.has(movie.id);

  return (
    <div>
      {/* Back nav */}
      <div className="max-w-screen-xl mx-auto px-6 pt-8 pb-4">
        <Link to={ROUTES.EXPLORE} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
          <ArrowLeft size={15} /> Back to Explore
        </Link>
      </div>

      {/* Backdrop */}
      <div className="relative w-full overflow-hidden" style={{ height: 340 }}>
        {backdropUrl && !backdropError ? (
          <img src={backdropUrl} alt="" aria-hidden className="w-full h-full object-cover" onError={() => setBackdropError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-5" style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-main))' }}>
            <FilmIcon size={80} />
          </div>
        )}
        <div className="absolute inset-0 gradient-bottom" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/20 to-transparent" />
      </div>

      {/* Detail content */}
      <div className="max-w-screen-xl mx-auto px-6 pb-20">
        <div className="flex flex-col md:flex-row gap-8 -mt-28 relative z-10">
          {/* Poster */}
          <div className="w-44 md:w-52 aspect-poster rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shrink-0 shadow-theme-lg overflow-hidden">
            {posterUrl && !posterError ? (
              <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" onError={() => setPosterError(true)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-display text-5xl text-[var(--accent)] opacity-40">{movie.title.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-4 pt-28 md:pt-4">
            {movie.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((g) => <Badge key={g.id} variant="outline">{g.name}</Badge>)}
              </div>
            )}

            <h1 className="font-display text-4xl md:text-5xl font-semibold text-[var(--text-primary)]">{movie.title}</h1>
            {movie.tagline && <p className="text-sm text-[var(--text-secondary)] italic">"{movie.tagline}"</p>}

            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
              {movie.vote_average > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star size={13} fill="var(--rating-gold)" stroke="none" className="text-[var(--rating-gold)]" />
                  <span className="font-semibold text-[var(--text-primary)]">{movie.vote_average.toFixed(1)}</span>
                  <span className="text-[var(--text-muted)]">({movie.vote_count.toLocaleString()})</span>
                </span>
              )}
              {year && <span className="flex items-center gap-1.5"><Calendar size={13} />{year}</span>}
              {runtime && <span className="flex items-center gap-1.5"><Clock size={13} />{runtime}</span>}
              {movie.original_language && <span className="flex items-center gap-1.5"><Globe size={13} />{languageName(movie.original_language)}</span>}
              {director && <span>Directed by <span className="text-[var(--text-primary)] font-medium">{director.name}</span></span>}
            </div>

            {movie.overview && (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">{movie.overview}</p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Link to={buildRoute.watch(movie.id)}>
                <Button size="lg" icon={<Play size={18} fill="currentColor" strokeWidth={0} />}>Watch Now</Button>
              </Link>
              <Button
                size="lg"
                variant="secondary"
                icon={isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                onClick={() => toggle(detailToMovie(movie))}
              >
                {isSaved ? 'Saved' : 'Add to Watchlist'}
              </Button>
              <Button size="lg" variant="ghost" icon={<Plus size={16} />} onClick={() => setCollectionModalOpen(true)}>
                Collection
              </Button>
              {trailer && (
                <Button size="lg" variant="ghost" onClick={() => setTrailerOpen(true)}>Watch Trailer</Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Cast */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-5">Cast</h2>
          <CastList cast={credits?.cast ?? []} loading={creditsLoading} />
        </section>

        {/* Watch providers */}
        <section className="mt-12 p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-4">Where to Watch</h2>
          <WatchProviders providers={providers ?? null} loading={providersLoading} />
          <p className="text-[10px] text-[var(--text-muted)] mt-4">
            Watch provider data by JustWatch, via TMDB. Availability varies by region.
          </p>
        </section>

        {/* Similar & recommendations */}
        {(similar?.results?.length ?? 0) > 0 && (
          <section className="mt-14">
            <MovieCarousel
              title="Similar Movies"
              movies={similar?.results ?? []}
              loading={simLoading}
              onWatchlistToggle={toggle}
              watchlistIds={watchlistIds}
            />
          </section>
        )}

        {(recommendations?.results?.length ?? 0) > 0 && (
          <section className="mt-14">
            <MovieCarousel
              title="Recommended For You"
              movies={recommendations?.results ?? []}
              loading={recLoading}
              onWatchlistToggle={toggle}
              watchlistIds={watchlistIds}
            />
          </section>
        )}
      </div>

      <TrailerModal video={trailer} open={trailerOpen} onClose={() => setTrailerOpen(false)} />
      <AddToCollectionModal
        movie={detailToMovie(movie)}
        open={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
      />
    </div>
  );
}
