'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Media paths ────────────────────────────────────────────────────────────────
// Edit these to change video/image sources
const PLAYBACK_RATE      = 1.35;
const SCROLL_COOLDOWN_MS = 200;
const END_OFFSET         = 0.08;   // seconds before duration to treat video as done
const MF0_VEIL_PEAK      = 0.38;
const GOLD               = '#C9A84C';

// Note: Video 2 filename has a typo on disk ("Vdeo" not "Video") — kept exact
const FORWARD_VIDEOS = [
  '/images/ezgif-split/Video_1.mp4',
  '/images/ezgif-split/Vdeo_2.mp4',
  '/images/ezgif-split/Video_3.mp4',
] as const;

const REVERSE_VIDEOS = [
  '/images/ezgif-split/Video_1_reverse.mp4',
  '/images/ezgif-split/Vdeo_2_reverse.mp4',
  '/images/ezgif-split/Video_3_reverse.mp4',
] as const;

// Background plates for still states (encoded spaces)
const FRAME_BACKGROUNDS = [
  '/images/ezgif-split/Frame%201.png',
  '/images/ezgif-split/Frame%202.png',
  '/images/ezgif-split/Frame%203.png',
  '/images/ezgif-split/Frame%204.png',
] as const;

// ── Types ──────────────────────────────────────────────────────────────────────
type MFIndex = 0 | 1 | 2 | 3;
type Mode    = 'still' | 'transition';
type Dir     = 'forward' | 'backward' | null;

// ── Nav ────────────────────────────────────────────────────────────────────────
function TopNav({ onJump }: { onJump: (mf: MFIndex) => void }) {
  return (
    <div style={{ position: 'absolute', top: 20, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }}>
      <nav
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '6px 10px',
          borderRadius: 999,
          background: 'rgba(18,15,10,0.82)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.40)',
        }}
      >
        <NavBtn onClick={() => onJump(0)} strong>Homelio</NavBtn>
        <NavSep />
        <NavBtn onClick={() => onJump(1)}>Konzept</NavBtn>
        <NavBtn onClick={() => onJump(2)}>Wohnung finden</NavBtn>
        <a
          href="/anmelden"
          style={{
            marginLeft: 4,
            padding: '6px 16px',
            borderRadius: 999,
            background: GOLD,
            color: '#0C0A06',
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            textDecoration: 'none',
          }}
        >
          Anmelden
        </a>
      </nav>
    </div>
  );
}

function NavBtn({ onClick, children, strong }: { onClick: () => void; children: string; strong?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: strong ? 600 : 400,
        color: strong ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.58)',
        letterSpacing: strong ? '0.03em' : undefined,
      }}
    >
      {children}
    </button>
  );
}

function NavSep() {
  return <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.14)', flexShrink: 0 }} />;
}

// ── Mainframe placeholders ─────────────────────────────────────────────────────
function BgPlate({ src }: { src: string }) {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(170deg, rgba(8,6,4,0.15) 0%, rgba(8,6,4,0.40) 50%, rgba(8,6,4,0.80) 100%)' }} />
    </>
  );
}

function Frame0() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <BgPlate src={FRAME_BACKGROUNDS[0]} />
      <div style={{ position: 'absolute', inset: 0, background: `rgba(255,255,255,${MF0_VEIL_PEAK})`, mixBlendMode: 'overlay', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 80, left: 64, maxWidth: 520 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.48)', marginBottom: 20 }}>Homelio</p>
        <h1 style={{ fontSize: 'clamp(40px,5vw,64px)', fontWeight: 300, lineHeight: 1.05, color: 'rgba(255,255,255,0.95)', marginBottom: 20, fontFamily: 'var(--font-instrument-serif, Georgia, serif)' }}>
          Sie überlegen umzuziehen?
        </h1>
        <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.65, color: 'rgba(255,255,255,0.68)', marginBottom: 28, maxWidth: 440 }}>
          Registrieren Sie sich einmal und erhalten Sie persönliche Wohnangebote,
          oft bevor sie öffentlich ausgeschrieben sind – ohne direkten Konkurrenzdruck.
        </p>
        <a href="/anmelden" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 999, background: GOLD, color: '#0C0A06', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
          Jetzt unverbindlich Angebote erhalten →
        </a>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <BgPlate src={FRAME_BACKGROUNDS[1]} />
      <div style={{ position: 'absolute', bottom: 80, left: 64, maxWidth: 480 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase', color: GOLD, opacity: 0.85, marginBottom: 20 }}>Konzept</p>
        <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 300, lineHeight: 1.1, color: 'rgba(255,255,255,0.95)', marginBottom: 20, fontFamily: 'var(--font-instrument-serif, Georgia, serif)' }}>
          Wenn sich das Leben verändert, verändert sich auch die Wohnung.
        </h2>
        <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.65, color: 'rgba(255,255,255,0.62)', maxWidth: 420 }}>
          Homelio vernetzt Menschen frühzeitig und diskret – noch bevor Wohnungen offiziell ausgeschrieben werden.
          So entstehen passende Wechsel ohne unnötigen Konkurrenzdruck.
        </p>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <BgPlate src={FRAME_BACKGROUNDS[2]} />
      <div style={{ position: 'absolute', bottom: 80, left: 64, maxWidth: 420 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase', color: GOLD, opacity: 0.85, marginBottom: 20 }}>Matching</p>
        <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 300, lineHeight: 1.08, color: 'rgba(255,255,255,0.95)', marginBottom: 16, fontFamily: 'var(--font-instrument-serif, Georgia, serif)' }}>
          Intelligent verbunden.
        </h2>
        <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.65, color: 'rgba(255,255,255,0.62)', maxWidth: 380 }}>
          Registrieren Sie sich und erhalten Sie persönliche Wohnangebote –
          diskret, passend und ohne Konkurrenzdruck.
        </p>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <BgPlate src={FRAME_BACKGROUNDS[3]} />
      <div style={{ position: 'absolute', bottom: 80, left: 64, maxWidth: 480 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase', color: GOLD, opacity: 0.85, marginBottom: 20 }}>Angebote</p>
        <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 300, lineHeight: 1.07, color: 'rgba(255,255,255,0.95)', marginBottom: 16, fontFamily: 'var(--font-instrument-serif, Georgia, serif)' }}>
          Persönliche Angebote.<br />Früh und passend.
        </h2>
        <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.65, color: 'rgba(255,255,255,0.65)', marginBottom: 28, maxWidth: 420 }}>
          Erhalten Sie persönliche Angebote, bevor Wohnungen öffentlich ausgeschrieben werden –
          diskret, passend und ohne den üblichen Konkurrenzdruck.
        </p>
        <a href="/anmelden" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 999, background: GOLD, color: '#0C0A06', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
          Jetzt unverbindlich Angebote erhalten →
        </a>
      </div>
    </div>
  );
}

const FRAMES = [Frame0, Frame1, Frame2, Frame3] as const;

// ── Main component ─────────────────────────────────────────────────────────────
export default function HomelioScrollytellingStable() {
  const [mainframe,      setMainframe]    = useState<MFIndex>(0);
  const [mode,           setMode]         = useState<Mode>('still');
  const [direction,      setDirection]    = useState<Dir>(null);
  const [isTransitioning, setTransitioning] = useState(false);

  const videoRef      = useRef<HTMLVideoElement>(null);
  const rafRef        = useRef<number | null>(null);
  const mainframeRef  = useRef<MFIndex>(0);
  const modeRef       = useRef<Mode>('still');
  const lastScrollRef = useRef(0);
  const inViewRef     = useRef(false);
  const containerRef  = useRef<HTMLDivElement>(null);

  mainframeRef.current = mainframe;
  modeRef.current      = mode;

  // ── Jump (nav clicks — no animation, instant) ──────────────────
  const jumpTo = useCallback((target: MFIndex) => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    videoRef.current?.pause();
    setMainframe(target);
    setMode('still');
    setDirection(null);
    setTransitioning(false);
  }, []);

  // ── Transition ─────────────────────────────────────────────────
  const startTransition = useCallback((from: MFIndex, dir: 'forward' | 'backward') => {
    if (dir === 'forward'  && from >= 3) return;
    if (dir === 'backward' && from <= 0) return;

    const vid = videoRef.current;
    if (!vid) return;

    const idx    = dir === 'forward' ? from : (from - 1) as 0 | 1 | 2;
    const src    = dir === 'forward' ? FORWARD_VIDEOS[idx] : REVERSE_VIDEOS[idx];
    const target = (dir === 'forward' ? from + 1 : from - 1) as MFIndex;

    setMode('transition');
    setDirection(dir);
    setTransitioning(true);

    vid.src          = src;
    vid.currentTime  = 0;
    vid.playbackRate = PLAYBACK_RATE;

    const monitor = () => {
      const v = videoRef.current;
      if (!v) return;
      const done = v.ended || (isFinite(v.duration) && v.duration > 0 && v.currentTime >= v.duration - END_OFFSET);
      if (done) {
        v.pause();
        setMainframe(target);
        setMode('still');
        setDirection(null);
        setTransitioning(false);
        rafRef.current = null;
      } else {
        rafRef.current = requestAnimationFrame(monitor);
      }
    };

    vid.play()
      .then(() => { rafRef.current = requestAnimationFrame(monitor); })
      .catch(() => {
        setMainframe(target);
        setMode('still');
        setDirection(null);
        setTransitioning(false);
      });
  }, []);

  // ── Scroll intent → transition ──────────────────────────────────
  const handleIntent = useCallback((deltaY: number) => {
    if (!inViewRef.current) return;
    const now = Date.now();
    if (now - lastScrollRef.current < SCROLL_COOLDOWN_MS) return;
    if (modeRef.current === 'transition') return;
    const dir = deltaY > 0 ? 'forward' : 'backward';
    const from = mainframeRef.current;
    if (dir === 'forward' && from >= 3) return;
    if (dir === 'backward' && from <= 0) return;
    lastScrollRef.current = now;
    startTransition(from, dir);
  }, [startTransition]);

  // ── Event listeners ────────────────────────────────────────────
  useEffect(() => {
    const onWheel = (e: WheelEvent) => { if (inViewRef.current) { e.preventDefault(); handleIntent(e.deltaY); } };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [handleIntent]);

  useEffect(() => {
    let startY = 0;
    const onStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onEnd   = (e: TouchEvent) => {
      const dy = startY - e.changedTouches[0].clientY;
      if (Math.abs(dy) >= 40) handleIntent(dy);
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend',   onEnd,   { passive: false });
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd); };
  }, [handleIntent]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!inViewRef.current) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); handleIntent(1); }
      if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); handleIntent(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleIntent]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { inViewRef.current = e.isIntersecting; }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onHide = () => {
      if (!document.hidden || !isTransitioning) return;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      videoRef.current?.pause();
      setMode('still');
      setTransitioning(false);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [isTransitioning]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const ActiveFrame = FRAMES[mainframe];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#0A0806' }}>

      {/* Transition video */}
      <video
        ref={videoRef}
        preload="auto"
        muted
        playsInline
        disablePictureInPicture
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          opacity: mode === 'transition' ? 1 : 0,
          zIndex: mode === 'transition' ? 10 : 0,
          transition: 'opacity 0.15s ease',
        }}
      />

      {/* Mainframe still UI */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5,
        opacity: mode === 'still' ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}>
        <ActiveFrame />
      </div>

      {/* Nav — always on top */}
      <TopNav onJump={jumpTo} />

      {/* Dev debug panel */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute', bottom: 8, left: 8, zIndex: 9999,
          background: 'rgba(0,0,0,0.80)', color: '#00ff88',
          fontFamily: 'monospace', fontSize: 11, padding: '6px 10px',
          lineHeight: 1.8, pointerEvents: 'none', borderRadius: 6,
        }}>
          <div>MF: {mainframe}</div>
          <div>MODE: {mode}</div>
          <div>DIR: {direction ?? '—'}</div>
          <div>TRANSITIONING: {String(isTransitioning)}</div>
        </div>
      )}
    </div>
  );
}
