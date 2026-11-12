import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, RotateCcw, Maximize, Minimize } from 'lucide-react';

/**
 * VidRift — primary movie playback provider.
 *
 * This component is deliberately isolated from the rest of the app: it
 * only knows a TMDB movie ID, and only speaks VidRift's documented embed
 * URL and postMessage interface. It never fabricates or guesses an
 * identifier, and it never falls back to a plain <video> element.
 */

const VIDRIFT_ORIGIN = 'https://embed.vidrift.net';
const READY_TIMEOUT_MS = 15000; // grace period after iframe load, waiting for the first VidRift message
const MIN_RESUME_SECONDS = 5;   // don't bother resuming a few seconds in

export interface VidRiftProgressEvent {
  currentTime: number;
  duration?: number;
}

interface VidRiftPlayerProps {
  /** The real TMDB movie ID. Never pass a guessed or fabricated value. */
  tmdbId: number;
  /** Saved playback position in seconds, if any — applied once via vidrift:resume. */
  resumePosition?: number;
  /** Latest host state for a watch party. Applied only after the player is ready. */
  syncState?: { position: number; isPlaying: boolean; revision: string };
  onProgress?: (event: VidRiftProgressEvent) => void;
  onPausedChange?: (paused: boolean) => void;
  onEnded?: () => void;
  className?: string;
}

type PlayerStatus = 'loading' | 'ready' | 'error';

/** Narrows an unknown postMessage payload down to VidRift's documented shape, without `any`. */
function asVidRiftMessage(data: unknown): Record<string, unknown> | null {
  if (typeof data !== 'object' || data === null) return null;
  const record = data as Record<string, unknown>;
  return typeof record.type === 'string' ? record : null;
}

function toFiniteNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function VidRiftPlayer({
  tmdbId, resumePosition, syncState, onProgress, onPausedChange, onEnded, className = '',
}: VidRiftPlayerProps) {
  const [status, setStatus] = useState<PlayerStatus>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const resumeSentRef = useRef(false);
  const hasReceivedMessageRef = useRef(false);
  const lastSyncRevisionRef = useRef<string | null>(null);
  const lastPlayerTimeRef = useRef(0);

  const embedUrl = `${VIDRIFT_ORIGIN}/embed/movie/${tmdbId}`;

  const clearReadyTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const markReady = useCallback(() => {
    hasReceivedMessageRef.current = true;
    clearReadyTimeout();
    setStatus((prev) => (prev === 'loading' ? 'ready' : prev));
  }, [clearReadyTimeout]);

  // Reset all per-mount state whenever the movie or a manual retry changes.
  useEffect(() => {
    setStatus('loading');
    resumeSentRef.current = false;
    hasReceivedMessageRef.current = false;
    clearReadyTimeout();
  }, [tmdbId, reloadKey, clearReadyTimeout]);

  // ─── VidRift's documented postMessage interface ──────────────────────────
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Security: verify the origin exactly, and that the message actually
      // came from this player's own iframe — never trust postMessage blindly.
      if (event.origin !== VIDRIFT_ORIGIN) return;
      if (event.source !== iframeRef.current?.contentWindow) return;

      const message = asVidRiftMessage(event.data);
      if (!message) return;

      switch (message.type) {
        case 'vidrift:progress': {
          const currentTime = toFiniteNumber(message.currentTime);
          if (currentTime === undefined || currentTime < 0) return;
          markReady();
          onProgress?.({ currentTime, duration: toFiniteNumber(message.duration) });
          lastPlayerTimeRef.current = currentTime;
          break;
        }
        case 'vidrift:paused':
          markReady();
          onPausedChange?.(true);
          break;
        case 'vidrift:unpaused':
          markReady();
          onPausedChange?.(false);
          break;
        case 'vidrift:ended':
          markReady();
          onEnded?.();
          break;
        default:
          // An undocumented event type — ignore it rather than guess at behaviour.
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [markReady, onProgress, onPausedChange, onEnded]);

  // The iframe's own `load` only tells us its document rendered — not that
  // VidRift's player actually works. We start a grace period waiting for
  // the first real message, and surface an honest error if none arrives.
  const handleIframeLoad = () => {
    clearReadyTimeout();
    timeoutRef.current = window.setTimeout(() => {
      if (!hasReceivedMessageRef.current) setStatus('error');
    }, READY_TIMEOUT_MS);
  };

  // Send the documented resume command once playback is confirmed ready.
  useEffect(() => {
    if (status !== 'ready') return;
    if (resumeSentRef.current) return;
    if (!resumePosition || resumePosition < MIN_RESUME_SECONDS) return;

    const win = iframeRef.current?.contentWindow;
    if (!win) return;

    // VidRift expects the seek target under `currentTime` (seconds).
    win.postMessage({ type: 'vidrift:resume', currentTime: resumePosition }, VIDRIFT_ORIGIN);
    resumeSentRef.current = true;
  }, [status, resumePosition]);

  // Keep invited viewers aligned with the host. VidRift receives commands only
  // from this iframe's exact origin; the player ignores these when unsupported.
  useEffect(() => {
    if (status !== 'ready' || !syncState || syncState.revision === lastSyncRevisionRef.current) return;
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const drift = Math.abs(lastPlayerTimeRef.current - syncState.position);
    if (drift > 1.5) {
      win.postMessage({ type: 'vidrift:seek', currentTime: syncState.position }, VIDRIFT_ORIGIN);
    }
    win.postMessage({ type: syncState.isPlaying ? 'vidrift:play' : 'vidrift:pause' }, VIDRIFT_ORIGIN);
    lastSyncRevisionRef.current = syncState.revision;
  }, [status, syncState]);

  useEffect(() => clearReadyTimeout, [clearReadyTimeout]);

  // Our own fullscreen control for the player container — independent of
  // whatever fullscreen UI VidRift's own player may expose internally.
  useEffect(() => {
    const handleChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen?.();
    }
  };

  const handleRetry = () => setReloadKey((k) => k + 1);

  return (
    <div
      ref={containerRef}
      className={['relative w-full rounded-2xl overflow-hidden border border-[var(--border)] bg-black', className].join(' ')}
      style={{ aspectRatio: '16/9' }}
    >
      <iframe
        key={reloadKey}
        ref={iframeRef}
        src={embedUrl}
        title="FRAME movie player"
        className="absolute inset-0 w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={handleIframeLoad}
        // Intentionally no `sandbox` attribute — the VidRift embed requires
        // its absence to function correctly per its documented integration.
      />

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-white/15 border-t-[var(--accent)] animate-spin" />
            <p className="text-xs text-white/60">Loading player…</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/95">
          <div className="text-center px-8 max-w-sm">
            <div className="w-14 h-14 rounded-full border-2 border-[var(--danger)]/40 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-[var(--danger)]" />
            </div>
            <p className="text-sm font-medium text-white mb-1.5">Couldn't confirm playback</p>
            <p className="text-xs text-white/60 leading-relaxed mb-5">
              This movie may not be available right now, or the player failed to load. You can try again.
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--bg-main)] text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors"
            >
              <RotateCcw size={14} /> Try Again
            </button>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 transition-colors z-10"
        >
          {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
        </button>
      )}
    </div>
  );
}
