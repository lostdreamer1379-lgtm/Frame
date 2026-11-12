import { useEffect, useState } from 'react';

type FrameOpeningProps = {
  onComplete: () => void;
};

export function FrameOpening({ onComplete }: FrameOpeningProps) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      onComplete();
      return;
    }

    const timer = window.setTimeout(() => setClosing(true), 5000);
    const closeTimer = window.setTimeout(onComplete, 5450);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(closeTimer);
    };
  }, [onComplete]);

  const skip = () => {
    setClosing(true);
    window.setTimeout(onComplete, 350);
  };

  return (
    <div className={`frame-opening ${closing ? 'frame-opening--closing' : ''}`} role="presentation">
      <div className="frame-opening__atmosphere" />
      <div className="frame-opening__point" />
      <div className="frame-opening__line frame-opening__line--top" />
      <div className="frame-opening__line frame-opening__line--right" />
      <div className="frame-opening__line frame-opening__line--bottom" />
      <div className="frame-opening__line frame-opening__line--left" />
      <div className="frame-opening__worlds" aria-hidden="true">
        <span className="frame-opening__world-card frame-opening__world-card--left">ANTEIKU</span>
        <span className="frame-opening__world-card frame-opening__world-card--right">AFTERSHOW</span>
      </div>
      <div className="frame-opening__mark-wrap">
        <img className="frame-opening__mark" src="/frame-logo.png" alt="FRAME" />
      </div>
      <button className="frame-opening__skip" onClick={skip} type="button">Skip intro</button>
    </div>
  );
}
