import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, animate } from 'framer-motion';
import { Play, Info, Star, Bookmark, BookmarkCheck } from 'lucide-react';
import { tmdbImage, formatYear } from '@/utils/tmdb';
import { buildRoute } from '@/lib/routes';
import { Button } from '@/components/ui/Button';

import { HeroSkeleton } from '@/components/ui/Skeleton';
import type { Movie } from '@/types/movie';

interface HeroSectionProps {
  movie: Movie | null;
  movies?: Movie[];
  loading?: boolean;
  isInWatchlist?: boolean;
  watchlistIds?: Set<number>;
  onWatchlistToggle?: (movie: Movie) => void;
}

export function HeroSection({ movie, movies = [], loading = false, isInWatchlist = false, watchlistIds, onWatchlistToggle }: HeroSectionProps) {
  const [imgError, setImgError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [interaction, setInteraction] = useState<'auto' | 'momentum'>('auto');
  const viewportRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const [measurements, setMeasurements] = useState({ viewport: 0, card: 148 });

  const cards = movies.length > 0 ? movies : movie ? [movie] : [];
  const activeMovie = cards[activeIndex] ?? movie;
  const step = measurements.card + 12;
  const getOffset = (index: number) => measurements.viewport / 2 - measurements.card / 2 - index * step;

  useLayoutEffect(() => {
    const measure = () => {
      setMeasurements({
        viewport: viewportRef.current?.clientWidth ?? 0,
        card: cardRef.current?.getBoundingClientRect().width ?? 148,
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [cards.length]);

  useEffect(() => {
    if (activeIndex >= cards.length) setActiveIndex(0);
  }, [activeIndex, cards.length]);

  useEffect(() => {
    if (interaction !== 'auto' || cards.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % cards.length);
    }, 7500);
    return () => window.clearInterval(timer);
  }, [cards.length, interaction]);

  useEffect(() => {
    if (!measurements.viewport) return;
    animate(x, getOffset(activeIndex), { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 });
  }, [activeIndex, measurements.viewport, measurements.card]);

  if (loading) return <HeroSkeleton />;
  if (!activeMovie) return null;

  const backdropUrl = tmdbImage.backdrop(activeMovie.backdrop_path, 'w1280');
  const year        = formatYear(activeMovie.release_date);

  const selectCard = (index: number) => {
    setInteraction('auto');
    setImgError(false);
    setActiveIndex(index);
  };

  const handleSwipeEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (cards.length < 2) return;
    const momentum = info.velocity.x * 0.018;
    const travel = info.offset.x + momentum;
    const steps = Math.max(1, Math.min(cards.length - 1, Math.round(Math.abs(travel) / step) || (Math.abs(info.velocity.x) > 500 ? 1 : 0)));
    if (!steps) {
      setInteraction('auto');
      animate(x, getOffset(activeIndex), { type: 'spring', stiffness: 140, damping: 24 });
      return;
    }
    const direction = travel < 0 ? 1 : -1;
    const nextIndex = (activeIndex + direction * steps + cards.length * 10) % cards.length;
    setInteraction('momentum');
    setImgError(false);
    setActiveIndex(nextIndex);
    window.setTimeout(() => setInteraction('auto'), 5000);
  };

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: '75vh' }}>
      {/* Backdrop */}
      <AnimatePresence mode="wait">
        {backdropUrl && !imgError ? (
          <motion.img
            key={activeMovie.id}
            src={backdropUrl}
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : null}
      </AnimatePresence>
      {backdropUrl && !imgError && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-main)] via-[var(--bg-main)]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-transparent to-transparent" />
        </>
      )}
      {(!backdropUrl || imgError) && (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-main)]" />
      )}

      {/* Content */}
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 flex items-end" style={{ minHeight: '75vh', paddingBottom: '5rem' }}>
        <AnimatePresence mode="wait">
        <motion.div
          key={activeMovie.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="max-w-xl"
        >
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {activeMovie.vote_average > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--rating-gold)]">
                <Star size={13} fill="var(--rating-gold)" stroke="none" />
                {activeMovie.vote_average.toFixed(1)}
              </span>
            )}
            {year && <span className="text-sm text-[var(--text-secondary)]">{year}</span>}
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-[var(--text-primary)] leading-tight mb-4">
            {activeMovie.title}
          </h1>

          {/* Overview */}
          {activeMovie.overview && (
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed line-clamp-3 mb-6 max-w-md">
            {activeMovie.overview}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link to={buildRoute.watch(activeMovie.id)}>
              <Button size="lg" icon={<Play size={18} fill="currentColor" strokeWidth={0} />}>
                Watch Now
              </Button>
            </Link>
            <Link to={buildRoute.movie(activeMovie.id)}>
              <Button size="lg" variant="secondary" icon={<Info size={17} />}>
                Details
              </Button>
            </Link>
            {onWatchlistToggle && (
              <Button
                size="lg"
                variant="ghost"
                icon={watchlistIds?.has(activeMovie.id) || isInWatchlist ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
                onClick={() => onWatchlistToggle(activeMovie)}
                aria-label={watchlistIds?.has(activeMovie.id) || isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                {watchlistIds?.has(activeMovie.id) || isInWatchlist ? 'Saved' : 'Save'}
              </Button>
            )}
          </div>
        </motion.div>
        </AnimatePresence>
      </div>

      {cards.length > 1 && (
        <div ref={viewportRef} className="absolute inset-x-0 bottom-6 z-20 overflow-hidden px-6">
          <motion.div
            className="flex w-max gap-3 cursor-grab active:cursor-grabbing touch-pan-y"
            style={{ x }}
            drag="x"
            dragMomentum={false}
            dragElastic={0.08}
            onDragStart={() => setInteraction('momentum')}
            onDragEnd={handleSwipeEnd}
          >
            {cards.map((card, index) => {
              const poster = tmdbImage.poster(card.poster_path, 'w342');
              return (
                <motion.button
                  key={`${card.id}-${index}`}
                  ref={index === 0 ? cardRef : undefined}
                  type="button"
                  onClick={() => selectCard(index)}
                  whileHover={{ y: -6 }}
                  animate={{ opacity: index === activeIndex ? 1 : 0.58, scale: index === activeIndex ? 1 : 0.92 }}
                  transition={{ duration: 0.35 }}
                  className="relative h-24 w-[112px] shrink-0 overflow-hidden rounded-xl border border-white/20 bg-[var(--bg-card)] shadow-lg sm:h-28 sm:w-[148px]"
                  aria-label={`Show ${card.title}`}
                >
                  {poster ? <img src={poster} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center px-2 text-center text-xs text-[var(--text-secondary)]">{card.title}</span>}
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-left text-[10px] font-medium text-white">{card.title}</span>
                </motion.button>
              );
            })}
          </motion.div>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {cards.slice(0, Math.min(cards.length, 8)).map((card, index) => (
              <button key={card.id} type="button" onClick={() => selectCard(index)} aria-label={`Go to slide ${index + 1}`} className={`h-1 rounded-full transition-all ${index === activeIndex ? 'w-7 bg-[var(--accent)]' : 'w-1.5 bg-white/40'}`} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
