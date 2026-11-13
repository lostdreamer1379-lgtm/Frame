import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Compass, BookmarkCheck, Library, User, Menu, X, Search, Settings, Orbit } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

const NAV_LINKS = [
  { label: 'Explore',     to: ROUTES.EXPLORE,     icon: <Compass size={15} /> },
  { label: 'Watchlist',   to: ROUTES.WATCHLIST,   icon: <BookmarkCheck size={15} /> },
  { label: 'Collections', to: ROUTES.COLLECTIONS, icon: <Library size={15} /> },
];

export function Navigation() {
  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [enteringWorld, setEnteringWorld] = useState(false);
  const searchRef      = useRef<HTMLInputElement>(null);
  const worldTimer     = useRef<number | undefined>(undefined);
  const location       = useLocation();
  const navigate       = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => () => {
    if (worldTimer.current) window.clearTimeout(worldTimer.current);
  }, []);

  const enterWorld = () => {
    if (enteringWorld) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.location.assign('https://frontend-worlds.vercel.app/');
      return;
    }
    setEnteringWorld(true);
    worldTimer.current = window.setTimeout(() => {
      window.location.assign('https://frontend-worlds.vercel.app/');
    }, 1450);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.EXPLORE}?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header
        className={[
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-[var(--bg-main)]/95 backdrop-blur-sm border-b border-[var(--border)] shadow-theme-sm'
            : 'bg-transparent',
        ].join(' ')}
      >
        <nav className="max-w-screen-xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 shrink-0 group" aria-label="FRAME">
            <div className="w-7 h-7 rounded-lg border border-[var(--accent)] flex items-center justify-center transition-colors group-hover:bg-[var(--accent-muted)]">
              <Film size={13} className="text-[var(--accent)]" />
            </div>
            <span className="font-display text-xl font-semibold text-[var(--text-primary)] tracking-wide">FRAME</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => [
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm transition-colors duration-150',
                  isActive
                    ? 'text-[var(--accent)] bg-[var(--accent-muted)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
                ].join(' ')}
              >
                {link.icon}{link.label}
              </NavLink>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <button type="button" onClick={enterWorld} aria-label="Enter Worlds" title="Enter Worlds" className="group relative w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors">
              <Orbit size={16} />
            </button>
            {/* Inline search */}
            <AnimatePresence mode="wait">
              {searchOpen ? (
                <motion.form
                  key="search-form"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSearch}
                  className="overflow-hidden"
                >
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search movies…"
                    className="w-full px-3 py-1.5 rounded-lg border border-[var(--accent)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  />
                </motion.form>
              ) : null}
            </AnimatePresence>

            <button
              onClick={() => setSearchOpen(v => !v)}
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              className={[
                'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                searchOpen
                  ? 'text-[var(--accent)] bg-[var(--accent-muted)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
              ].join(' ')}
            >
              {searchOpen ? <X size={16} /> : <Search size={16} />}
            </button>

            <NavLink
              to={ROUTES.PROFILE}
              className={({ isActive }) => [
                'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                isActive
                  ? 'text-[var(--accent)] bg-[var(--accent-muted)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
              ].join(' ')}
              aria-label="Profile"
            >
              <User size={16} />
            </NavLink>

            <NavLink
              to={ROUTES.SETTINGS}
              className={({ isActive }) => [
                'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                isActive
                  ? 'text-[var(--accent)] bg-[var(--accent-muted)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
              ].join(' ')}
              aria-label="Settings"
            >
              <Settings size={16} />
            </NavLink>
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-1 shrink-0">
            <button type="button" onClick={enterWorld} aria-label="Enter Worlds" className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors">
              <Orbit size={17} />
            </button>
            <button
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {enteringWorld && (
          <motion.div className="world-transition" role="status" aria-live="polite" aria-label="Entering Worlds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="world-transition__nebula" />
            <div className="world-transition__stars" />
            <div className="world-transition__ring world-transition__ring--outer" />
            <div className="world-transition__ring world-transition__ring--inner" />
            <div className="world-transition__horizon" />
            <div className="world-transition__content">
              <span className="world-transition__eyebrow">A new dimension awaits</span>
              <span className="world-transition__title">ENTERING<br />WORLDS</span>
              <span className="world-transition__caption">Crossing the creative horizon</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="fixed top-16 left-0 right-0 z-40 border-b border-[var(--border)] bg-[var(--bg-secondary)]/95 backdrop-blur-sm md:hidden"
          >
            <div className="max-w-screen-xl mx-auto px-5 py-3">
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="mb-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search movies…"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </form>
              <div className="flex flex-col gap-0.5">
                {[...NAV_LINKS,
                  { label: 'Profile',  to: ROUTES.PROFILE,  icon: <User size={15} /> },
                  { label: 'Settings', to: ROUTES.SETTINGS, icon: <Settings size={15} /> },
                ].map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => [
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'text-[var(--accent)] bg-[var(--accent-muted)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
                    ].join(' ')}
                  >
                    {link.icon}{link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
