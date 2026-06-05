'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  useScroll,
  useTransform,
  useMotionValueEvent,
  motion,
} from 'framer-motion';

// ─── Frame manifest ───────────────────────────────────────────────────────────
// Source numbering has gaps; only the 62 frames that actually exist are listed.
const FRAME_GROUPS: [number, number][] = [
  [1,  13],
  [21, 33],
  [41, 53],
  [61, 73],
  [81, 90],
];

const FRAME_NUMBERS: number[] = FRAME_GROUPS.flatMap(([s, e]) =>
  Array.from({ length: e - s + 1 }, (_, i) => s + i),
);

const FRAME_COUNT = FRAME_NUMBERS.length; // 62

const getFramePath = (n: number) =>
  `/images/ezgif-frame-${String(n).padStart(3, '0')}.jpg`;

// ─── Text overlays ────────────────────────────────────────────────────────────
const OVERLAYS = [
  {
    headline: 'Homelio.',
    body: 'Der unsichtbare Wohnungsmarkt wird sichtbar.',
  },
  {
    headline: 'Früh erkennen.',
    body: 'Menschen denken über einen Umzug nach, bevor Wohnungen offiziell ausgeschrieben werden.',
  },
  {
    headline: 'Intelligent verbinden.',
    body: 'Haushalte, Wohnungen und Verwaltungen werden durch Matching-Logik miteinander verknüpft.',
  },
  {
    headline: 'Verstehen. Verbinden. Vermitteln.',
    body: 'Homelio macht versteckte Wohnchancen nutzbar.',
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

  // Opacity curves — derived motion values, no re-renders
  const opacity0  = useTransform(scrollYProgress, [0,    0.03, 0.18, 0.25], [0.8, 1, 1, 0]);
  const opacity1  = useTransform(scrollYProgress, [0.22, 0.30, 0.48, 0.55], [0,   1, 1, 0]);
  const opacity2  = useTransform(scrollYProgress, [0.52, 0.60, 0.78, 0.85], [0,   1, 1, 0]);
  const opacity3  = useTransform(scrollYProgress, [0.82, 0.90, 0.97, 1.00], [0,   1, 1, 1]);
  const opacities = [opacity0, opacity1, opacity2, opacity3] as const;

  const cueOpacity = useTransform(scrollYProgress, [0, 0.07], [1, 0]);

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

  // ─── Set canvas pixel dimensions + resize handler ─────────────────────────
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

  // ─── Preload all frames ───────────────────────────────────────────────────
  useEffect(() => {
    let loaded = 0;
    const images: HTMLImageElement[] = new Array(FRAME_COUNT);

    const tick = () => {
      loaded++;
      setLoadPct(Math.round((loaded / FRAME_COUNT) * 100));
      if (loaded === FRAME_COUNT) setIsLoaded(true);
    };

    FRAME_NUMBERS.forEach((n, i) => {
      const img    = new Image();
      img.onload   = tick;
      img.onerror  = tick; // don't stall if a frame is missing
      img.src      = getFramePath(n);
      images[i]    = img;
    });

    imagesRef.current = images;
  }, []);

  // Draw frame 0 as soon as images are ready
  useEffect(() => {
    if (isLoaded) drawFrame(0);
  }, [isLoaded, drawFrame]);

  // ─── Map scroll progress → frame index ───────────────────────────────────
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (!isLoaded) return;
    const idx = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(p * (FRAME_COUNT - 1))));
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

        {/* Text overlays — all at the same position; opacity drives which is visible */}
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
