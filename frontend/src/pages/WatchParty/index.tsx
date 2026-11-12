import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Users, Radio, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { VidRiftPlayer, type VidRiftProgressEvent } from '@/components/player/VidRiftPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { useMovieDetails } from '@/hooks/useMovies';
import { useJoinWatchParty, useUpdateWatchPartyState, useWatchParty } from '@/hooks/useWatchParty';
import { ROUTES, buildRoute } from '@/lib/routes';
import { notify } from '@/components/ui/Toast';

export default function WatchPartyPage() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const { data: party, isLoading, error } = useWatchParty(code);
  const { data: movie, isLoading: movieLoading } = useMovieDetails(party?.tmdbMovieId);
  const joinParty = useJoinWatchParty(code ?? '');
  const updateState = useUpdateWatchPartyState(code ?? '');
  const [displayName, setDisplayName] = useState(() => localStorage.getItem(`frame-party-name-${code}`) ?? '');
  const [participantId, setParticipantId] = useState(() => localStorage.getItem(`frame-party-member-${code}`));
  const [copied, setCopied] = useState(false);
  const lastProgress = useRef<VidRiftProgressEvent | null>(null);
  const lastSentAt = useRef(0);

  useEffect(() => {
    if (party && participantId && !party.participants.some((participant) => participant.id === participantId)) {
      setParticipantId(null);
      localStorage.removeItem(`frame-party-member-${code}`);
    }
  }, [party, participantId, code]);

  const join = (event: React.FormEvent) => {
    event.preventDefault();
    const name = displayName.trim();
    if (!name || !code) return;
    joinParty.mutate(name, {
      onSuccess: ({ participantId: nextId }) => {
        localStorage.setItem(`frame-party-name-${code}`, name);
        localStorage.setItem(`frame-party-member-${code}`, nextId);
        setParticipantId(nextId);
      },
      onError: () => notify.error('Could not join this watch party'),
    });
  };

  const share = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const sendState = (currentPosition: number, isPlaying: boolean) => {
    if (!party?.isHost || !code) return;
    updateState.mutate({ currentPosition, isPlaying });
  };

  const handleProgress = (event: VidRiftProgressEvent) => {
    lastProgress.current = event;
    if (party?.isHost && Date.now() - lastSentAt.current > 5000) {
      lastSentAt.current = Date.now();
      sendState(event.currentTime, party.isPlaying);
    }
  };

  if (isLoading || movieLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-[var(--accent)] animate-spin" /></div>;
  if (error || !party || !movie) return <div className="max-w-screen-xl mx-auto px-6 py-16"><EmptyState icon={<Radio size={22} />} title="Watch party unavailable" description="This party link may have expired or no longer exists." /></div>;

  const hasJoined = !!participantId;
  const roomTitle = `Watch Party · ${party.code}`;

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-screen-xl mx-auto px-5 py-5 flex items-center justify-between gap-4 flex-wrap">
        <Link to={buildRoute.watch(movie.id)} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]"><ArrowLeft size={15} /> Back to movie</Link>
        <button type="button" onClick={share} className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]">{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy invite link'}</button>
      </div>

      <div className="max-w-screen-xl mx-auto px-5 pb-16">
        <div className="mb-5 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--accent)] mb-2"><Radio size={13} /> Live room</div>
            <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)]">{roomTitle}</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Watching <span className="text-[var(--text-primary)]">{movie.title}</span> together.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><Users size={16} /> {party.participants.length} watching</div>
        </div>

        {!hasJoined ? (
          <div className="max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Join the room</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1 mb-5">Choose a name your friends will see.</p>
            <form onSubmit={join} className="flex gap-2">
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={40} placeholder="Your name" className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
              <Button type="submit" disabled={!displayName.trim()} loading={joinParty.isPending}>Join</Button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
            <div>
              <VidRiftPlayer
                tmdbId={movie.id}
                resumePosition={party.currentPosition}
                onProgress={handleProgress}
                onPausedChange={(paused) => sendState(lastProgress.current?.currentTime ?? party.currentPosition, !paused)}
                onEnded={() => sendState(lastProgress.current?.currentTime ?? party.currentPosition, false)}
              />
              <p className="text-xs text-[var(--text-muted)] mt-3">{party.isHost ? 'You are the host. Playback position is shared with the room.' : 'The host controls playback for everyone.'}</p>
            </div>
            <aside className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 h-fit">
              <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-4">In this room</h2>
              <div className="flex flex-col gap-3">
                {party.participants.map((participant) => <div key={participant.id} className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]"><span className="w-7 h-7 rounded-full bg-[var(--accent-muted-strong)] flex items-center justify-center text-xs text-[var(--accent)]">{participant.displayName.charAt(0).toUpperCase()}</span>{participant.displayName}{participant.id === participantId && <span className="ml-auto text-[10px] text-[var(--accent)]">you</span>}</div>)}
              </div>
              {!user && <div className="mt-5 pt-4 border-t border-[var(--border)] flex gap-2 text-xs text-[var(--text-muted)]"><Lock size={13} className="shrink-0" /> You can join as a guest. Sign in to host your own party.</div>}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
