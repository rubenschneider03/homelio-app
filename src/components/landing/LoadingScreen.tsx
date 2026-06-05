"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const PHRASES = [
  "Wohnraum sichtbar machen",
  "Wechsel erkennen",
  "Passend verbinden",
];

interface Props {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: Props) {
  const rootRef    = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef     = useRef<HTMLDivElement>(null);
  const phraseRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const counter = { val: 0 };
      const tl = gsap.timeline();

      // Counter 000 → 100
      tl.to(counter, {
        val: 100,
        duration: 2.5,
        ease: "power2.inOut",
        onUpdate() {
          if (counterRef.current) {
            counterRef.current.textContent = String(
              Math.round(counter.val)
            ).padStart(3, "0");
          }
        },
      }, 0);

      // Progress bar
      tl.to(barRef.current, { scaleX: 1, duration: 2.5, ease: "power2.inOut" }, 0);

      // Phrase sequence
      const timings = [0.1, 0.95, 1.8];
      phraseRefs.current.forEach((el, i) => {
        tl.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, timings[i]);
        if (i < 2) {
          tl.to(el, { opacity: 0, y: -6, duration: 0.3, ease: "power2.in" }, timings[i] + 0.65);
        }
      });

      // Fade-out overlay
      tl.to(rootRef.current, {
        opacity: 0,
        duration: 0.65,
        ease: "power2.inOut",
        onComplete,
      }, "+=0.3");
    }, rootRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-12"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Phrases */}
      <div className="relative h-5 w-72">
        {PHRASES.map((phrase, i) => (
          <span
            key={i}
            ref={(el) => { phraseRefs.current[i] = el; }}
            className="absolute inset-0 flex items-center justify-center text-xs tracking-[0.3em] uppercase opacity-0 whitespace-nowrap"
            style={{ color: "var(--muted)" }}
          >
            {phrase}
          </span>
        ))}
      </div>

      {/* Counter */}
      <span
        ref={counterRef}
        className="text-8xl font-extralight tabular-nums"
        style={{ color: "var(--fg)", fontFamily: "var(--font-inter)" }}
      >
        000
      </span>

      {/* Progress bar */}
      <div
        className="w-48 overflow-hidden"
        style={{ height: "1px", backgroundColor: "var(--hairline)" }}
      >
        <div
          ref={barRef}
          className="h-full w-full origin-left"
          style={{
            transform: "scaleX(0)",
            background: "linear-gradient(90deg, var(--gold), var(--azure))",
          }}
        />
      </div>
    </div>
  );
}
