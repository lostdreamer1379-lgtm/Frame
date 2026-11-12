import { useEffect, useRef, useState } from 'react';

type FrameOpeningProps = {
  onComplete: () => void;
};

export function FrameOpening({ onComplete }: FrameOpeningProps) {
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      onComplete();
      return;
    }

    const timer = window.setTimeout(() => setClosing(true), 5000);
    closeTimer.current = window.setTimeout(onComplete, 5450);
    return () => {
      window.clearTimeout(timer);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, [onComplete]);

  const skip = () => {
    if (closing) return;
    setClosing(true);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(onComplete, 450);
  };

  return (
    <div className={`frame-opening ${closing ? 'frame-opening--closing' : ''}`} role="presentation">
      <div className="frame-opening__atmosphere" />
      <div className="frame-opening__stars" aria-hidden="true" />
      <div className="frame-opening__portal" aria-hidden="true" />
      <div className="frame-opening__point" />
      <div className="frame-opening__line frame-opening__line--top" />
      <div className="frame-opening__line frame-opening__line--right" />
      <div className="frame-opening__line frame-opening__line--bottom" />
      <div className="frame-opening__line frame-opening__line--left" />
      <div className="frame-opening__worlds" aria-hidden="true">
        <span className="frame-opening__world-card frame-opening__world-card--left"><i /> ANTEIKU <small>01 / 04</small></span>
        <span className="frame-opening__world-card frame-opening__world-card--right"><i /> AFTERSHOW <small>02 / 04</small></span>
      </div>
      <div className="frame-opening__mark-wrap">
        <img className="frame-opening__mark" src="/frame-logo.png" alt="FRAME" />
        <p className="frame-opening__tagline">A universe of stories, unfolding.</p>
      </div>
      <button className="frame-opening__skip" onClick={skip} type="button">Skip intro</button>
    </div>
  );
}
