'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';

// Exact segment boundaries in sequence.mp4 (verified via ffprobe keyframe scan).
const CUT_TIMESTAMPS = [0, 5.75, 11.5, 17.5] as const;

// Held video.currentTime at each mainframe — one frame (≈0.05 s) before the cut
// so the paused frame is still inside the current segment, not the next one.
const PAUSE_TIMESTAMPS = [0, 5.65, 11.35, 17.5] as const;

// Trigger thresholds: when video.currentTime crosses these values the mainframe
// snaps to CUT_TIMESTAMPS. Earlier than CUT_TIMESTAMPS to compensate for
// browser seek latency at 1.4× playback speed.
const MAINFRAME_TRIGGER = [0, 5.35, 10.85, 17.5] as const;
type SceneIdx = 0 | 1 | 2 | 3;

// Overlay opacity per held scene (scene 0 stays light; 1-3 go fully milky)
const SCENE_ALPHA: Record<SceneIdx, number> = { 0: 0.14, 1: 0.42, 2: 0.42, 3: 0.42 };
const MIN_ALPHA  = 0.06; // during playback
// Departure fade duration in ms (real time, not video time)
const FADE_MS: Record<SceneIdx, number> = { 0: 250, 1: 1800, 2: 1800, 3: 250 };
// Where the ramp-up back to milky starts (fraction of segment)
const RAMP_START = 0.70;
const PLAY_RATE: Record<SceneIdx, number> = { 0: 1, 1: 1.4, 2: 1.4, 3: 1.4 };


// ─── Scene copy ────────────────────────────────────────────────────────────────
const SCENES = [
  { headline: null,        body: null },
  { headline: 'Früh erkannt.',
    body:     'Menschen denken über einen Umzug nach, bevor Wohnungen offiziell ausgeschrieben werden.' },
  { headline: 'Intelligent verbunden.',
    body:     'Homelio verknüpft Haushalte, Wohnungen und Verwaltungen durch Matching-Logik.' },
  { headline: 'Der unsichtbare Wohnungsmarkt wird sichtbar.',
    body:     'Verstehen. Verbinden. Vermitteln.' },
] as const;

function easeInOut(t: number) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function easeOut(t: number)   { return 1-(1-t)*(1-t); }
function easeIn(t: number)    { return t*t; }

export default function HeadphoneScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const sectionRef   = useRef<SceneIdx>(0);
  const playingRef   = useRef(false);
  const rafRef       = useRef<number | null>(null);
  const inViewRef    = useRef(false);
  const touchStartY  = useRef(0);

  const [section, setSection] = useState<SceneIdx>(0);
  const [playing, setPlaying] = useState(false); // used only to hide text during playback

  const overlayAlpha = useMotionValue(SCENE_ALPHA[0]);
  const overlayBg    = useTransform(overlayAlpha, v => `rgba(250,248,244,${v.toFixed(3)})`);
  const overlayBlur  = useTransform(overlayAlpha, v => `blur(${(v * 14.3).toFixed(1)}px)`);

  // ── Forward: real video playback with alpha curve ─────────────────────────────
  const playForward = useCallback((target: SceneIdx) => {
    const video = videoRef.current;
    if (!video || playingRef.current) return;
    if (target >= CUT_TIMESTAMPS.length) return;

    playingRef.current = true;
    setPlaying(true);

    // Snap to the clean keyframe that opens this segment. The current overlay
    // alpha (milky at any held scene) covers the tiny forward seek, so no
    // frame from the next segment can flash through before playback begins.
    const segStart    = CUT_TIMESTAMPS[sectionRef.current];
    video.currentTime = segStart;

    const fromTime    = segStart;
    const toTime      = PAUSE_TIMESTAMPS[target];
    const totalRange  = toTime - fromTime;
    const startAlpha  = overlayAlpha.get();
    const targetAlpha = SCENE_ALPHA[target];
    const fadeDurMs   = FADE_MS[sectionRef.current];
    const startMs     = performance.now();

    if (video.currentTime >= toTime) {
      video.currentTime  = toTime;
      overlayAlpha.set(targetAlpha);
      sectionRef.current = target;
      setSection(target);
      playingRef.current = false;
      setPlaying(false);
      return;
    }

    video.playbackRate = PLAY_RATE[target];
    video.play().catch(() => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      overlayAlpha.set(SCENE_ALPHA[sectionRef.current]);
      playingRef.current = false;
      setPlaying(false);
    });

    const monitor = (now: number) => {
      if (!videoRef.current) return;
      const ct          = videoRef.current.currentTime;
      const elapsed     = now - startMs;
      const segProgress = Math.min(1, (ct - fromTime) / totalRange);

      // Alpha curve: departure fade → hold clear → ramp up to milky
      let alpha: number;
      if (segProgress >= RAMP_START) {
        const t = (segProgress - RAMP_START) / (1 - RAMP_START);
        alpha = MIN_ALPHA + (targetAlpha - MIN_ALPHA) * easeIn(t);
      } else if (elapsed < fadeDurMs) {
        const t = elapsed / fadeDurMs;
        alpha = startAlpha + (MIN_ALPHA - startAlpha) * easeOut(t);
      } else {
        alpha = MIN_ALPHA;
      }
      overlayAlpha.set(alpha);

      if (ct >= MAINFRAME_TRIGGER[target] || videoRef.current.ended) {
        videoRef.current.pause();
        videoRef.current.currentTime = toTime; // snap to exact cut boundary, not lagging currentTime
        overlayAlpha.set(targetAlpha);
        sectionRef.current = target;
        setSection(target);
        playingRef.current = false;
        setPlaying(false);
        rafRef.current = null;
      } else {
        rafRef.current = requestAnimationFrame(monitor);
      }
    };
    rafRef.current = requestAnimationFrame(monitor);
  }, [overlayAlpha]);

  // ── Backward: fade to opaque → instant seek (hidden) → fade back to clear ─────
  const playBackward = useCallback((target: SceneIdx) => {
    const video = videoRef.current;
    if (!video || playingRef.current) return;
    playingRef.current = true;
    setPlaying(true);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    video.pause();

    const startAlpha  = overlayAlpha.get();
    const targetAlpha = SCENE_ALPHA[target];
    const fadeUpMs    = 260;  // milky fade-in
    const fadeDownMs  = 520;  // clear fade-out to reveal previous scene
    const startMs     = performance.now();
    let seeked        = false;

    const monitor = (now: number) => {
      if (!videoRef.current) return;
      const elapsed = now - startMs;

      if (elapsed < fadeUpMs) {
        // Phase 1: quickly fade up to fully opaque
        const t = elapsed / fadeUpMs;
        overlayAlpha.set(startAlpha + (0.98 - startAlpha) * easeIn(t));
      } else {
        // Phase 2: seek instantly while covered, then fade back down
        if (!seeked) {
          videoRef.current.currentTime = PAUSE_TIMESTAMPS[target];
          sectionRef.current = target;
          setSection(target);
          seeked = true;
        }
        const t = Math.min(1, (elapsed - fadeUpMs) / fadeDownMs);
        overlayAlpha.set(0.98 + (targetAlpha - 0.98) * easeOut(t));
        if (t >= 1) {
          overlayAlpha.set(targetAlpha);
          playingRef.current = false;
          setPlaying(false);
          rafRef.current = null;
          return;
        }
      }
      rafRef.current = requestAnimationFrame(monitor);
    };
    rafRef.current = requestAnimationFrame(monitor);
  }, [overlayAlpha]);

  // ── Navigate ──────────────────────────────────────────────────────────────────
  const navigate = useCallback((delta: 1 | -1) => {
    const s      = sectionRef.current;
    const target = (s + delta) as SceneIdx;
    if (target < 0 || target >= CUT_TIMESTAMPS.length) return false;
    if (delta > 0) playForward(target);
    else           playBackward(target);
    return true;
  }, [playForward, playBackward]);

  // ── Visibility observer ───────────────────────────────────────────────────────
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
      if (!inViewRef.current) return;
      const down = e.deltaY > 0;
      const s    = sectionRef.current;
      if (down  && s >= CUT_TIMESTAMPS.length - 1) return;
      if (!down && s <= 0) return;
      e.preventDefault();
      if (playingRef.current) return;
      navigate(down ? 1 : -1);
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [navigate]);

  // ── Touch ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
    const onEnd   = (e: TouchEvent) => {
      if (!inViewRef.current) return;
      const dy = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 40) return;
      const down = dy > 0;
      const s    = sectionRef.current;
      if (down  && s >= CUT_TIMESTAMPS.length - 1) return;
      if (!down && s <= 0) return;
      e.preventDefault();
      if (playingRef.current) return;
      navigate(down ? 1 : -1);
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend',   onEnd,   { passive: false });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend',   onEnd);
    };
  }, [navigate]);

  // ── Keyboard ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!inViewRef.current) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); navigate(1);  }
      if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); navigate(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  // ── Release lock if tab is hidden mid-transition (browser throttles/pauses RAF) ─
  useEffect(() => {
    const onHide = () => {
      if (!document.hidden || !playingRef.current) return;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (videoRef.current) videoRef.current.pause();
      playingRef.current = false;
      setPlaying(false);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // ── Seek to first frame on load ───────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const seek = () => { video.currentTime = CUT_TIMESTAMPS[0]; };
    if (video.readyState >= 1) seek();
    else video.addEventListener('loadedmetadata', seek, { once: true });
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const scene = SCENES[section];

  return (
    <div ref={containerRef} className="relative h-screen overflow-hidden" style={{ backgroundColor: 'rgba(250,248,244,1)' }}>

      {/* 1080p video */}
      <video
        ref={videoRef}
        src="/images/ezgif-split/sequence.mp4"
        preload="auto"
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Milky glass overlay — driven entirely by overlayAlpha motion value */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: overlayBg, backdropFilter: overlayBlur }}
      />


      {/* Scene text */}
      <AnimatePresence mode="wait">
        {scene.headline && !playing && (
          <motion.div
            key={section}
            className="absolute bottom-20 sm:bottom-24 lg:bottom-28 left-0 right-0 px-6 lg:pl-16 lg:pr-8 pointer-events-none"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.55, ease: [0.25, 0, 0, 1] }}
          >
            <h2
              className="font-light tracking-tight leading-[1.05] mb-3
                         text-4xl sm:text-5xl lg:text-7xl text-center lg:text-left"
              style={{ fontFamily: 'var(--font-instrument-serif)', color: 'rgba(20,18,15,0.90)' }}
            >
              {scene.headline}
            </h2>
            <p
              className="text-sm sm:text-base lg:text-lg font-light leading-relaxed
                         text-center lg:text-left max-w-sm lg:max-w-lg mx-auto lg:mx-0"
              style={{ color: 'rgba(20,18,15,0.55)' }}
            >
              {scene.body}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section dots */}
      <div className="absolute right-7 lg:right-9 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-none">
        {CUT_TIMESTAMPS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{
              width:      i === section ? 7 : 4,
              height:     i === section ? 7 : 4,
              background: i === section ? 'rgba(20,18,15,0.75)' : 'rgba(20,18,15,0.22)',
            }}
          />
        ))}
      </div>

      {/* Scroll cue */}
      <AnimatePresence>
        {section === 0 && !playing && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-xs tracking-[0.22em] uppercase" style={{ color: 'rgba(20,18,15,0.28)' }}>
              Scroll
            </span>
            <div
              className="w-px h-8"
              style={{ background: 'linear-gradient(to bottom, rgba(20,18,15,0.20), transparent)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
