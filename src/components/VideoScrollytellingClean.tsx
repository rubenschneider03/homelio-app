'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURATION  ← edit these to tune the experience
// ─────────────────────────────────────────────────────────────────────────────

/** Video playback speed during transitions (1.0 = original speed). */
const PLAYBACK_RATE = 1.35;

/** Seconds before video end where we clamp and hold the last frame. */
const HOLD_OFFSET = 0.05;

/** Peak overlay opacity at mainframes (0 = invisible, 1 = fully opaque). */
const OVERLAY_PEAK = 0.10;

/**
 * Fraction of each video's duration over which the overlay ramps in/out.
 * 0.30 means the overlay fades out over the first 30 % and fades back in
 * over the last 30 % of the clip.
 */
const OVERLAY_RAMP = 0.30;

/** Maximum backdrop-blur in px (applied at OVERLAY_PEAK, 0 at midpoint). */
const BLUR_MAX = 8;

// ─────────────────────────────────────────────────────────────────────────────
//  VIDEO SOURCES  ← edit paths here
// ─────────────────────────────────────────────────────────────────────────────

const VIDEO_SRCS = [
  '/images/ezgif-split/v1_trim.mp4',
  '/images/ezgif-split/v2_trim.mp4',
  '/images/ezgif-split/Video_3.mp4',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
//  MAINFRAME CONTENT  ← edit text here
// ─────────────────────────────────────────────────────────────────────────────

interface MainframeData {
  label: string;
  title: string;
  body:  string;
}

const MAINFRAMES: MainframeData[] = [
  {
    label: 'Homelio',
    title: 'Der unsichtbare Wohnungsmarkt.',
    body:  'Neue Wohnchancen entstehen, bevor Wohnungen offiziell ausgeschrieben werden.',
  },
  {
    label: 'Signal',
    title: 'Früh erkannt.',
    body:  'Menschen denken über einen Umzug nach, bevor Wohnungen offiziell frei werden.',
  },
  {
    label: 'Matching',
    title: 'Intelligent verbunden.',
    body:  'Haushalte, Wohnungen und Verwaltungen werden durch Matching-Logik verknüpft.',
  },
  {
    label: 'Markt',
    title: 'Sichtbar gemacht.',
    body:  'Homelio macht versteckte Wohnchancen nutzbar.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  INTERNAL MAPPINGS  (do not edit)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Which video element is visible while holding at each mainframe.
 *   MF 0 → video 0 (first frame)
 *   MF 1 → video 0 (last frame)
 *   MF 2 → video 1 (last frame)
 *   MF 3 → video 2 (last frame)
 */
const MF_VIDEO = [0, 0, 1, 2] as const;

type MFIdx  = 0 | 1 | 2 | 3;
type VidIdx = 0 | 1 | 2;

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Overlay opacity as a function of video progress (0 → 1).
 * High at the edges (mainframes), zero in the middle (cinematic movement).
 */
function alphaForProgress(p: number): number {
  if (p <= OVERLAY_RAMP)       return OVERLAY_PEAK * (1 - p / OVERLAY_RAMP);
  if (p >= 1 - OVERLAY_RAMP)   return OVERLAY_PEAK * ((p - (1 - OVERLAY_RAMP)) / OVERLAY_RAMP);
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function VideoScrollytellingClean() {
  const containerRef = useRef<HTMLDivElement>(null);
  const v0Ref        = useRef<HTMLVideoElement>(null);
  const v1Ref        = useRef<HTMLVideoElement>(null);
  const v2Ref        = useRef<HTMLVideoElement>(null);

  const rafRef      = useRef<number | null>(null);
  const inViewRef   = useRef(false);
  const touchStartY = useRef(0);

  const [mainframe,     setMainframe]     = useState<MFIdx>(0);
  const [transitioning, setTransitioning] = useState(false);
  const [activeVideo,   setActiveVideo]   = useState<VidIdx>(0);

  // Mirror state into refs so event handlers always read the latest value
  // without becoming stale closures.
  const mainframeRef     = useRef<MFIdx>(0);
  const transitioningRef = useRef(false);
  mainframeRef.current     = mainframe;
  transitioningRef.current = transitioning;

  const overlayAlpha = useMotionValue(OVERLAY_PEAK);
  const overlayBg    = useTransform(overlayAlpha, a => `rgba(255,255,255,${a.toFixed(3)})`);
  const overlayBlur  = useTransform(
    overlayAlpha,
    a => `blur(${(clamp(a / OVERLAY_PEAK, 0, 1) * BLUR_MAX).toFixed(1)}px)`,
  );

  // ── Init: seek video 0 to frame 0 ────────────────────────────────────────────
  useEffect(() => {
    const v = v0Ref.current;
    if (!v) return;
    const seek = () => { v.currentTime = 0; };
    if (v.readyState >= 1) seek();
    else v.addEventListener('loadedmetadata', seek, { once: true });
  }, []);

  // ── Forward transition ────────────────────────────────────────────────────────
  //
  // State machine: MF(N) → play video N from 0 to (duration − HOLD_OFFSET) → MF(N+1)
  //
  const goForward = useCallback(() => {
    const from = mainframeRef.current;
    if (from >= 3 || transitioningRef.current) return;

    const target = (from + 1) as MFIdx;
    // Transition MF0→1 plays video 0, MF1→2 plays video 1, MF2→3 plays video 2.
    const vIdx  = from as VidIdx;
    const video = (vIdx === 0 ? v0Ref : vIdx === 1 ? v1Ref : v2Ref).current;
    if (!video || !isFinite(video.duration)) return;

    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    video.currentTime  = 0;
    video.playbackRate = PLAYBACK_RATE;
    setActiveVideo(vIdx);
    setTransitioning(true);
    overlayAlpha.set(OVERLAY_PEAK);

    const monitor = () => {
      const v = (vIdx === 0 ? v0Ref : vIdx === 1 ? v1Ref : v2Ref).current;
      if (!v) return;

      const holdTime = v.duration - HOLD_OFFSET;
      const ct       = v.currentTime;
      const progress = clamp(ct / holdTime, 0, 1);

      overlayAlpha.set(alphaForProgress(progress));

      if (ct >= holdTime || v.ended) {
        v.pause();
        v.currentTime = holdTime;
        overlayAlpha.set(OVERLAY_PEAK);
        setMainframe(target);
        setActiveVideo(MF_VIDEO[target] as VidIdx);
        setTransitioning(false);
        rafRef.current = null;
      } else {
        rafRef.current = requestAnimationFrame(monitor);
      }
    };

    video.play().then(() => {
      rafRef.current = requestAnimationFrame(monitor);
    }).catch(() => {
      setTransitioning(false);
      overlayAlpha.set(OVERLAY_PEAK);
    });
  }, [overlayAlpha]);

  // ── Backward transition ───────────────────────────────────────────────────────
  //
  // Instant seek hidden behind a full overlay cover-and-reveal.
  //
  const goBackward = useCallback(() => {
    const from = mainframeRef.current;
    if (from <= 0 || transitioningRef.current) return;

    const target   = (from - 1) as MFIdx;
    const tVidIdx  = MF_VIDEO[target] as VidIdx;
    const video    = (tVidIdx === 0 ? v0Ref : tVidIdx === 1 ? v1Ref : v2Ref).current;
    if (!video) return;

    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setTransitioning(true);

    const startAlpha = overlayAlpha.get();
    const COVER      = 0.95;
    const RISE_MS    = 220;
    const FALL_MS    = 440;
    const t0         = performance.now();
    let   seeked     = false;

    const monitor = (now: number) => {
      const elapsed = now - t0;

      if (elapsed < RISE_MS) {
        // Phase 1: rapidly fade up to opaque — hides the seek
        overlayAlpha.set(startAlpha + (COVER - startAlpha) * clamp(elapsed / RISE_MS, 0, 1));
      } else {
        // Phase 2: seek while covered, then fade back to mainframe alpha
        if (!seeked) {
          const holdTime =
            target === 0
              ? 0
              : isFinite(video.duration) ? video.duration - HOLD_OFFSET : 0;
          video.currentTime = holdTime;
          setActiveVideo(tVidIdx);
          setMainframe(target);
          seeked = true;
        }
        const t = clamp((elapsed - RISE_MS) / FALL_MS, 0, 1);
        overlayAlpha.set(COVER + (OVERLAY_PEAK - COVER) * t);
        if (t >= 1) {
          overlayAlpha.set(OVERLAY_PEAK);
          setTransitioning(false);
          rafRef.current = null;
          return;
        }
      }
      rafRef.current = requestAnimationFrame(monitor);
    };

    rafRef.current = requestAnimationFrame(monitor);
  }, [overlayAlpha]);

  // ── Intersection observer ─────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { inViewRef.current = e.isIntersecting; },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Wheel ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!inViewRef.current || transitioningRef.current) return;
      if (e.deltaY > 0 && mainframeRef.current < 3) { e.preventDefault(); goForward(); }
      else if (e.deltaY < 0 && mainframeRef.current > 0) { e.preventDefault(); goBackward(); }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [goForward, goBackward]);

  // ── Touch ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
    const onEnd   = (e: TouchEvent) => {
      if (!inViewRef.current || transitioningRef.current) return;
      const dy = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 40) return;
      if (dy > 0 && mainframeRef.current < 3) { e.preventDefault(); goForward(); }
      else if (dy < 0 && mainframeRef.current > 0) { e.preventDefault(); goBackward(); }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend',   onEnd,   { passive: false });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend',   onEnd);
    };
  }, [goForward, goBackward]);

  // ── Keyboard ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!inViewRef.current || transitioningRef.current) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goForward(); }
      if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goBackward(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goForward, goBackward]);

  // ── Tab hidden mid-transition ─────────────────────────────────────────────────
  useEffect(() => {
    const onHide = () => {
      if (!document.hidden || !transitioningRef.current) return;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      v0Ref.current?.pause();
      v1Ref.current?.pause();
      v2Ref.current?.pause();
      setTransitioning(false);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const mf = MAINFRAMES[mainframe];

  return (
    <div
      ref={containerRef}
      className="relative h-screen overflow-hidden"
      style={{ backgroundColor: '#050505' }}
    >

      {/* ── Video elements ── */}
      <video
        ref={v0Ref}
        src={VIDEO_SRCS[0]}
        preload="auto"
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: activeVideo === 0 ? 1 : 0, zIndex: activeVideo === 0 ? 1 : 0 }}
      />
      <video
        ref={v1Ref}
        src={VIDEO_SRCS[1]}
        preload="auto"
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: activeVideo === 1 ? 1 : 0, zIndex: activeVideo === 1 ? 1 : 0 }}
      />
      <video
        ref={v2Ref}
        src={VIDEO_SRCS[2]}
        preload="auto"
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: activeVideo === 2 ? 1 : 0, zIndex: activeVideo === 2 ? 1 : 0 }}
      />

      {/* ── Milky glass overlay ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background:           overlayBg,
          backdropFilter:       overlayBlur,
          WebkitBackdropFilter: overlayBlur,
        }}
      />

      {/* ── Mainframe text ── */}
      <AnimatePresence mode="wait">
        {!transitioning && (
          <motion.div
            key={mainframe}
            className="absolute inset-0 flex flex-col justify-end pointer-events-none"
            style={{ zIndex: 3 }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.55, ease: [0.25, 0, 0, 1] }}
          >
            <div className="px-6 pb-20 lg:px-16 lg:pb-28 max-w-2xl">
              <p
                className="text-xs tracking-[0.22em] uppercase mb-3"
                style={{ color: 'rgba(255,255,255,0.42)' }}
              >
                {mf.label}
              </p>
              <h2
                className="font-light leading-[1.06] mb-4"
                style={{
                  fontFamily: 'var(--font-instrument-serif)',
                  color:      'rgba(255,255,255,0.92)',
                  fontSize:   'clamp(2rem, 5vw, 3.75rem)',
                }}
              >
                {mf.title}
              </h2>
              <p
                className="text-sm sm:text-base font-light leading-relaxed max-w-sm"
                style={{ color: 'rgba(255,255,255,0.56)' }}
              >
                {mf.body}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dot navigation ── */}
      <div
        className="absolute right-7 lg:right-9 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-none"
        style={{ zIndex: 4 }}
      >
        {MAINFRAMES.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{
              width:      i === mainframe ? 7 : 4,
              height:     i === mainframe ? 7 : 4,
              background: i === mainframe
                ? 'rgba(255,255,255,0.85)'
                : 'rgba(255,255,255,0.28)',
            }}
          />
        ))}
      </div>

      {/* ── Scroll cue (mainframe 0 only) ── */}
      <AnimatePresence>
        {mainframe === 0 && !transitioning && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
            style={{ zIndex: 4 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span
              className="text-xs tracking-[0.22em] uppercase"
              style={{ color: 'rgba(255,255,255,0.28)' }}
            >
              Scroll
            </span>
            <div
              className="w-px h-8"
              style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
