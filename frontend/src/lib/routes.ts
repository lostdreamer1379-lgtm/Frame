export const ROUTES = {
  HOME:            '/',
  EXPLORE:         '/explore',
  MOVIE:           '/movie/:id',
  WATCH:           '/watch/:id',
  WATCH_PARTY:     '/watch-party/:code',
  WATCHLIST:       '/watchlist',
  COLLECTIONS:     '/collections',
  COLLECTION:      '/collections/:id',
  PEOPLE:          '/people/:id',
  PROFILE:         '/profile',
  SETTINGS:        '/settings',
  LOGIN:           '/auth/login',
  SIGNUP:          '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD:  '/auth/reset-password',
} as const;

export type RouteKey = keyof typeof ROUTES;

export const buildRoute = {
  movie:      (id: number | string) => `/movie/${id}`,
  watch:      (id: number | string) => `/watch/${id}`,
  watchParty: (code: string)          => `/watch-party/${code}`,
  people:     (id: number | string) => `/people/${id}`,
  collection: (id: string)          => `/collections/${id}`,
};
