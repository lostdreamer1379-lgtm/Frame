import { useQuery, useQueries } from '@tanstack/react-query';
import { moviesService } from '@/services/movies.service';

// ─── Query keys ───────────────────────────────────────────────────────────────
// Centralised so invalidation and caching stay consistent across the app.
export const movieKeys = {
  all:            ['movies'] as const,
  trending:       (page = 1) => [...movieKeys.all, 'trending', page] as const,
  popular:        (page = 1) => [...movieKeys.all, 'popular', page] as const,
  topRated:       (page = 1) => [...movieKeys.all, 'top-rated', page] as const,
  upcoming:       (page = 1) => [...movieKeys.all, 'upcoming', page] as const,
  search:         (query: string, page = 1) => [...movieKeys.all, 'search', query, page] as const,
  discover:       (params: Record<string, unknown>) => [...movieKeys.all, 'discover', params] as const,
  genres:         () => [...movieKeys.all, 'genres'] as const,
  detail:         (id: number | string) => [...movieKeys.all, 'detail', id] as const,
  credits:        (id: number | string) => [...movieKeys.all, 'credits', id] as const,
  videos:         (id: number | string) => [...movieKeys.all, 'videos', id] as const,
  recommendations:(id: number | string) => [...movieKeys.all, 'recommendations', id] as const,
  similar:        (id: number | string) => [...movieKeys.all, 'similar', id] as const,
  providers:      (id: number | string) => [...movieKeys.all, 'providers', id] as const,
};

export const peopleKeys = {
  all:     ['people'] as const,
  detail:  (id: number | string) => [...peopleKeys.all, 'detail', id] as const,
  credits: (id: number | string) => [...peopleKeys.all, 'credits', id] as const,
};

// ─── List hooks ───────────────────────────────────────────────────────────────

export function useTrending(page = 1) {
  return useQuery({
    queryKey: movieKeys.trending(page),
    queryFn: () => moviesService.getTrending(page),
  });
}

export function usePopular(page = 1) {
  return useQuery({
    queryKey: movieKeys.popular(page),
    queryFn: () => moviesService.getPopular(page),
  });
}

export function useTopRated(page = 1) {
  return useQuery({
    queryKey: movieKeys.topRated(page),
    queryFn: () => moviesService.getTopRated(page),
  });
}

export function useUpcoming(page = 1) {
  return useQuery({
    queryKey: movieKeys.upcoming(page),
    queryFn: () => moviesService.getUpcoming(page),
  });
}

/** Fetches all four home-page carousels in parallel. */
export function useHomeSections() {
  const results = useQueries({
    queries: [
      { queryKey: movieKeys.trending(1), queryFn: () => moviesService.getTrending(1) },
      { queryKey: movieKeys.popular(1),  queryFn: () => moviesService.getPopular(1) },
      { queryKey: movieKeys.topRated(1), queryFn: () => moviesService.getTopRated(1) },
      { queryKey: movieKeys.upcoming(1), queryFn: () => moviesService.getUpcoming(1) },
    ],
  });

  const [trending, popular, topRated, upcoming] = results;

  return {
    trending: { data: trending.data?.results ?? [], isLoading: trending.isLoading, error: trending.error },
    popular:  { data: popular.data?.results ?? [],  isLoading: popular.isLoading,  error: popular.error },
    topRated: { data: topRated.data?.results ?? [], isLoading: topRated.isLoading, error: topRated.error },
    upcoming: { data: upcoming.data?.results ?? [], isLoading: upcoming.isLoading, error: upcoming.error },
    heroMovie: trending.data?.results?.[0] ?? null,
    heroLoading: trending.isLoading,
  };
}

// ─── Search & discover ──────────────────────────────────────────────────────

export function useSearchMovies(query: string, page = 1) {
  return useQuery({
    queryKey: movieKeys.search(query, page),
    queryFn: () => moviesService.search(query, page),
    enabled: query.trim().length > 0,
  });
}

export interface DiscoverFilters {
  page?: number;
  genre?: string;
  year?: string;
  minRating?: string;
  language?: string;
  sortBy?: string;
}

export function useDiscoverMovies(filters: DiscoverFilters) {
  return useQuery({
    queryKey: movieKeys.discover(filters as Record<string, unknown>),
    queryFn: () => moviesService.discover(filters),
  });
}

export function useGenres() {
  return useQuery({
    queryKey: movieKeys.genres(),
    queryFn: () => moviesService.getGenres(),
    staleTime: 24 * 60 * 60 * 1000, // genres barely change
  });
}

// ─── Movie detail hooks ───────────────────────────────────────────────────────

export function useMovieDetails(id: number | string | undefined) {
  return useQuery({
    queryKey: movieKeys.detail(id ?? ''),
    queryFn: () => moviesService.getDetails(id!),
    enabled: !!id,
  });
}

export function useMovieCredits(id: number | string | undefined) {
  return useQuery({
    queryKey: movieKeys.credits(id ?? ''),
    queryFn: () => moviesService.getCredits(id!),
    enabled: !!id,
  });
}

export function useMovieVideos(id: number | string | undefined) {
  return useQuery({
    queryKey: movieKeys.videos(id ?? ''),
    queryFn: () => moviesService.getVideos(id!),
    enabled: !!id,
  });
}

export function useMovieRecommendations(id: number | string | undefined) {
  return useQuery({
    queryKey: movieKeys.recommendations(id ?? ''),
    queryFn: () => moviesService.getRecommendations(id!),
    enabled: !!id,
  });
}

export function useSimilarMovies(id: number | string | undefined) {
  return useQuery({
    queryKey: movieKeys.similar(id ?? ''),
    queryFn: () => moviesService.getSimilar(id!),
    enabled: !!id,
  });
}

export function useWatchProviders(id: number | string | undefined, region = 'US') {
  return useQuery({
    queryKey: movieKeys.providers(id ?? ''),
    queryFn: () => moviesService.getWatchProviders(id!, region),
    enabled: !!id,
  });
}

/**
 * Fetches full movie details for a list of TMDB IDs in parallel — used to
 * hydrate watchlist and collection entries (which only store the ID) into
 * displayable movie cards.
 */
export function useMoviesByIds(ids: number[]) {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: movieKeys.detail(id),
      queryFn: () => moviesService.getDetails(id),
      staleTime: 10 * 60 * 1000,
    })),
  });

  return {
    movies: results.map((r) => r.data).filter((m): m is NonNullable<typeof m> => !!m),
    isLoading: ids.length > 0 && results.some((r) => r.isLoading),
    hasError: results.some((r) => r.isError),
  };
}
