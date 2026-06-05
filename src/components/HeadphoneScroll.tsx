'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  useScroll,
  useTransform,
  useMotionValueEvent,
  motion,
} from 'framer-motion';

// ─── Frame manifest ───────────────────────────────────────────────────────────
const FRAME_COUNT = 270;

const getFramePath = (index: number) => {
  const frameNumber = String(index + 1).padStart(3, '0');
  return `/images/ezgif-frame-${frameNumber}.webp`;
};

// ─── Scroll timeline ──────────────────────────────────────────────────────────
type PlaySegment = { type: 'play'; start: number; end: number; from: number; to: number };
type HoldSegment = { type: 'hold'; start: number; end: number; frame: number };
type Segment = PlaySegment | HoldSegment;

const TIMELINE: Segment[] = [
  { type: 'play', start: 0.00, end: 0.22, from: 0,   to: 70  },
  { type: 'hold', start: 0.22, end: 0.35, frame: 70           },
  { type: 'play', start: 0.35, end: 0.58, from: 71,  to: 150 },
  { type: 'hold', start: 0.58, end: 0.72, frame: 150          },
  { type: 'play', start: 0.72, end: 0.88, from: 151, to: 220 },
  { type: 'play', start: 0.88, end: 1.00, from: 221, to: 269 },
];

function progressToFrame(p: number): number {
  const clamped = Math.min(1, Math.max(0, p));
  for (const seg of TIMELINE) {
    if (clamped >= seg.start && clamped <= seg.end) {
      if (seg.type === 'hold') return seg.frame;
      const t = (clamped - seg.start) / (seg.end - seg.start);
      return Math.round(seg.from + t * (seg.to - seg.from));
    }
  }
  return FRAME_COUNT - 1;
}

// ─── Text overlays ────────────────────────────────────────────────────────────
const OVERLAYS = [
  {
    headline: 'Früh erkannt.',
    body: 'Menschen denken über einen Umzug nach, bevor Wohnungen offiziell ausgeschrieben werden.',
  },
  {
    headline: 'Intelligent verbunden.',
    body: 'Homelio verknüpft Haushalte, Wohnungen und Verwaltungen durch Matching-Logik.',
  },
  {
    headline: 'Der unsichtbare Wohnungsmarkt wird sichtbar.',
    body: 'Verstehen. Verbinden. Vermitteln.',
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────
export default function HeadphoneScroll() {
  const containerRef    = useRef<HTMLDivElement>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const imagesRef       = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const rafRef          = useRef<number | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadPct,  setLoadPct]  = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Opacity curves tied to each segment's active window — derived motion values
  // Overlay 0: visible during hold at 0.22–0.35
  const opacity0 = useTransform(scrollYProgress, [0.20, 0.26, 0.31, 0.35], [0, 1, 1, 0]);
  // Overlay 1: visible during hold at 0.58–0.72
  const opacity1 = useTransform(scrollYProgress, [0.56, 0.62, 0.68, 0.72], [0, 1, 1, 0]);
  // Overlay 2: visible during final segment 0.88–1.00, stays visible at end
  const opacity2 = useTransform(scrollYProgress, [0.86, 0.92, 0.97, 1.00], [0, 1, 1, 1]);
  const opacities = [opacity0, opacity1, opacity2] as const;

  const cueOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);

  // ─── Draw a frame to canvas ───────────────────────────────────────────────
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const img = imagesRef.current[index];
    if (!img?.complete || !img.naturalWidth) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // object-contain: scale to fit, centre
    const scale = Math.min(cw / iw, ch / ih);
    const dx    = (cw - iw * scale) / 2;
    const dy    = (ch - ih * scale) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, iw * scale, ih * scale);
  }, []);

  // ─── Canvas sizing + resize handler ──────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame(currentFrameRef.current);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [drawFrame]);

  // ─── Preload all 270 frames ───────────────────────────────────────────────
  useEffect(() => {
    let loaded = 0;
    const images: HTMLImageElement[] = new Array(FRAME_COUNT);

    const tick = () => {
      loaded++;
      setLoadPct(Math.round((loaded / FRAME_COUNT) * 100));
      if (loaded === FRAME_COUNT) setIsLoaded(true);
    };

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img   = new Image();
      img.onload  = tick;
      img.onerror = tick; // gracefully skip any missing frame
      img.src     = getFramePath(i);
      images[i]   = img;
    }

    imagesRef.current = images;
  }, []);

  // Draw first frame as soon as load completes
  useEffect(() => {
    if (isLoaded) drawFrame(0);
  }, [isLoaded, drawFrame]);

  // ─── Scroll → timeline → frame ───────────────────────────────────────────
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (!isLoaded) return;
    const idx = progressToFrame(p);
    currentFrameRef.current = idx;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => drawFrame(idx));
  });

  return (
    <div ref={containerRef} style={{ height: '400vh' }}>

      {/* Sticky full-viewport panel */}
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ backgroundColor: '#050505' }}
      >

        {/* Loading bar */}
        {!isLoaded && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5">
            <div
              className="w-52 h-px overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
            >
              <div
                className="h-full"
                style={{
                  width:      `${loadPct}%`,
                  background: 'rgba(255,255,255,0.3)',
                  transition: 'width 80ms linear',
                }}
              />
            </div>
            <span
              className="text-xs tracking-[0.25em] uppercase tabular-nums"
              style={{ color: 'rgba(255,255,255,0.18)' }}
            >
              {loadPct}%
            </span>
          </div>
        )}

        {/* Image-sequence canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{
            opacity:    isLoaded ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        />

        {/* Text overlays — stacked at same position, opacity-driven */}
        {OVERLAYS.map((overlay, i) => (
          <motion.div
            key={i}
            className="absolute bottom-24 md:bottom-28 left-8 md:left-16 max-w-sm md:max-w-lg pointer-events-none"
            style={{ opacity: opacities[i] }}
          >
            <h2
              className="font-light tracking-tight leading-[1.05] mb-3 text-4xl md:text-6xl"
              style={{
                fontFamily: 'var(--font-instrument-serif)',
                color:      'rgba(255,255,255,0.92)',
              }}
            >
              {overlay.headline}
            </h2>
            <p
              className="text-sm md:text-base font-light leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.50)' }}
            >
              {overlay.body}
            </p>
          </motion.div>
        ))}

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-9 right-10 flex flex-col items-center gap-2 pointer-events-none"
          style={{ opacity: cueOpacity }}
        >
          <span
            className="text-xs tracking-[0.22em] uppercase"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            Scroll
          </span>
          <div
            className="w-px h-9"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)' }}
          />
        </motion.div>

      </div>
    </div>
  );
}
