import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Check, RotateCcw, User, Film, BookmarkCheck, Library, Palette, Shield, LogOut, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useWatchHistoryList } from '@/hooks/useHistory';
import { useCollections } from '@/hooks/useCollections';
import { THEMES } from '@/types/theme';
import type { ThemeId } from '@/types/theme';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { notify } from '@/components/ui/Toast';
import { ROUTES } from '@/lib/routes';

function ThemeCard({ theme, isActive, onSelect }: {
  theme: typeof THEMES[number];
  isActive: boolean;
  onSelect: (id: ThemeId) => void;
}) {
  const { palette } = theme;

  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(theme.id)}
      className="text-left rounded-2xl overflow-hidden border-2 transition-all duration-200 focus-visible:outline-none"
      style={{ borderColor: isActive ? palette.accent : palette.border, background: palette.bgMain }}
      aria-pressed={isActive}
      aria-label={`${theme.name} theme${isActive ? ' (active)' : ''}`}
    >
      <div className="p-4" style={{ background: palette.bgMain }}>
        <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: `1px solid ${palette.border}` }}>
          <div className="w-3 h-3 rounded-sm" style={{ background: palette.accent }} />
          <div className="text-[8px] font-bold tracking-widest" style={{ color: palette.accent, fontFamily: 'serif' }}>FRAME</div>
          <div className="ml-auto flex gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: palette.textSecondary, opacity: 0.4 }} />
            ))}
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          {[palette.bgCard, palette.bgSecondary, palette.bgCard].map((c, i) => (
            <div key={i} className="rounded-md overflow-hidden" style={{ width: 28, height: 42, background: c, border: `1px solid ${palette.border}` }}>
              {i === 0 && <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${palette.accent}30, transparent)` }} />}
            </div>
          ))}
        </div>
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-semibold" style={{ background: palette.accent, color: palette.bgMain }}>
          Watch Now
        </div>
      </div>
      <div className="px-4 pb-4 pt-2 flex items-center justify-between" style={{ background: palette.bgSecondary }}>
        <div>
          <p className="text-xs font-semibold" style={{ color: palette.textPrimary }}>{theme.name}</p>
          <p className="text-[9px] mt-0.5 leading-tight max-w-[120px]" style={{ color: palette.textSecondary }}>
            {theme.description.split('.')[0]}
          </p>
        </div>
        {isActive && (
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 ml-2" style={{ background: palette.accent }}>
            <Check size={10} style={{ color: palette.bgMain }} strokeWidth={3} />
          </div>
        )}
      </div>
    </motion.button>
  );
}

interface AccountFormValues {
  displayName: string;
}

function AccountTab() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const { register, handleSubmit, reset, formState: { isDirty, isSubmitting } } = useForm<AccountFormValues>({
    defaultValues: { displayName: '' },
  });

  useEffect(() => {
    if (profile) reset({ displayName: profile.displayName });
  }, [profile, reset]);

  const onSubmit = (values: AccountFormValues) => {
    updateProfile.mutate({ displayName: values.displayName });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    notify.success('Signed out');
    navigate(ROUTES.HOME);
  };

  if (!user) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
        <div className="p-8 text-center rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
          <Shield size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">You're browsing as a guest</p>
          <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto leading-relaxed">
            Sign in to save your profile, sync themes across devices, and build a watchlist that follows you anywhere.
          </p>
          <Link to={ROUTES.LOGIN} className="inline-block mt-4">
            <Button size="sm">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
      <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-5">Account</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-sm">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Display name</label>
          <input
            disabled={isLoading}
            className="px-3 py-2.5 h-10 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 disabled:opacity-50"
            {...register('displayName', { required: true, minLength: 2, maxLength: 60 })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Email</label>
          <input
            value={user.email ?? ''}
            disabled
            className="px-3 py-2.5 h-10 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-sm text-[var(--text-muted)] cursor-not-allowed"
          />
        </div>

        <Button
          type="submit"
          size="sm"
          icon={<Save size={13} />}
          disabled={!isDirty}
          loading={isSubmitting || updateProfile.isPending}
          className="self-start mt-1"
        >
          Save changes
        </Button>
      </form>

      <div className="border-t border-[var(--border)] mt-6 pt-5">
        <Button variant="danger" size="sm" icon={<LogOut size={13} />} onClick={handleSignOut} loading={signingOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { theme, setTheme, resetTheme, syncing } = useTheme();
  const { data: profile } = useProfile();
  const { entries: watchlistEntries, isLoading: watchlistLoading } = useWatchlist();
  const { data: watchHistory, isLoading: historyLoading } = useWatchHistoryList();
  const { data: collections, isLoading: collectionsLoading } = useCollections();

  const stats = [
    {
      label: 'Movies Watched',
      value: historyLoading ? '—' : String((watchHistory ?? []).filter((entry) => entry.completed).length),
      icon: <Film size={15} />,
    },
    {
      label: 'Watchlist',
      value: watchlistLoading ? '—' : String(watchlistEntries.length),
      icon: <BookmarkCheck size={15} />,
    },
    {
      label: 'Collections',
      value: collectionsLoading ? '—' : String((collections ?? []).length),
      icon: <Library size={15} />,
    },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-semibold text-[var(--text-primary)] mb-1">Profile</h1>
        <p className="text-[var(--text-secondary)] text-sm">Manage your account and personalise your experience.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-2 border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-center overflow-hidden">
                <User size={30} className="text-[var(--text-secondary)]" />
              </div>
              {user && (
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[var(--success)] border-2 border-[var(--bg-secondary)]" title="Signed in" />
              )}
            </div>
            <div>
              {authLoading ? (
                <div className="h-4 w-24 skeleton mx-auto" />
              ) : user ? (
                <>
                  <p className="font-semibold text-sm text-[var(--text-primary)]">{profile?.displayName ?? user.email?.split('@')[0]}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{user.email}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-sm text-[var(--text-primary)]">Guest User</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Not signed in</p>
                </>
              )}
            </div>
            {!user && !authLoading && (
              <Link to={ROUTES.LOGIN} className="w-full">
                <Button fullWidth variant="accent-outline" size="sm">Sign In</Button>
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Activity</p>
            {stats.map((s) => (
              <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
                <span className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="text-[var(--text-muted)]">{s.icon}</span>
                  {s.label}
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="themes">
            <TabsList className="mb-6">
              <TabsTrigger value="themes"><span className="flex items-center gap-1.5"><Palette size={13} />Appearance</span></TabsTrigger>
              <TabsTrigger value="account"><span className="flex items-center gap-1.5"><Shield size={13} />Account</span></TabsTrigger>
            </TabsList>

            <TabsContent value="themes">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Themes</h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Current: <span className="text-[var(--accent)] font-medium">{THEMES.find((t) => t.id === theme)?.name}</span>
                      {syncing && <span className="text-[var(--text-muted)]"> · syncing…</span>}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" icon={<RotateCcw size={13} />} onClick={resetTheme} title="Reset to Cinema Night">
                    Reset
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {THEMES.map((t) => (
                    <ThemeCard key={t.id} theme={t} isActive={theme === t.id} onSelect={setTheme} />
                  ))}
                </div>

                <p className="text-xs text-[var(--text-muted)] mt-5 pb-1 border-t border-[var(--border)] pt-4">
                  {user
                    ? 'Theme is saved to your account and syncs across devices.'
                    : 'Theme is saved locally on this device. Sign in to sync across devices.'}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="account">
              <AccountTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
