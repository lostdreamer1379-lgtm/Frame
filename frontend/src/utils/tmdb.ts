// TMDB image URL helpers

import type { Movie, MovieDetail } from '@/types/movie';

const BASE_URL = 'https://image.tmdb.org/t/p';

export const tmdbImage = {
  poster: (path: string | null, size: 'w92' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w342') =>
    path ? `${BASE_URL}/${size}${path}` : null,

  backdrop: (path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280') =>
    path ? `${BASE_URL}/${size}${path}` : null,

  profile: (path: string | null, size: 'w45' | 'w185' | 'h632' | 'original' = 'w185') =>
    path ? `${BASE_URL}/${size}${path}` : null,

  logo: (path: string | null, size: 'w45' | 'w92' | 'w154' | 'w185' | 'w300' | 'w500' | 'original' = 'w185') =>
    path ? `${BASE_URL}/${size}${path}` : null,
};

export function formatRuntime(minutes: number): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatYear(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).getFullYear().toString();
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function formatCurrency(amount: number): string {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function languageName(iso: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(iso) ?? iso;
  } catch {
    return iso;
  }
}

/**
 * Adapts a full MovieDetail (which carries `genres: Genre[]`) down to the
 * lighter `Movie` shape (`genre_ids: number[]`) that list components like
 * MovieCard expect — used when hydrating watchlist/collection entries.
 */
export function detailToMovie(detail: MovieDetail): Movie {
  return {
    id: detail.id,
    title: detail.title,
    overview: detail.overview,
    poster_path: detail.poster_path,
    backdrop_path: detail.backdrop_path,
    release_date: detail.release_date,
    vote_average: detail.vote_average,
    vote_count: detail.vote_count,
    genre_ids: detail.genres?.map((g) => g.id) ?? [],
    original_language: detail.original_language,
    popularity: detail.popularity,
    adult: detail.adult,
  };
}
