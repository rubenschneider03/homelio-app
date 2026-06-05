"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STAGES = [
  {
    image: "/images/exterior.png",
    tag:   "01 — Sichtbarkeit",
    title: "Der Markt beginnt nicht bei Inseraten.",
    sub:   "Wohnungswechsel entstehen früher — dort, wo Leben sich verändert.",
  },
  {
    image: "/images/interior.png",
    tag:   "02 — Wohnwunsch",
    title: "Menschen suchen nicht irgendeine Wohnung.",
    sub:   "Sie suchen den nächsten Ort für ihr Leben.",
  },
  {
    image: "/images/moving.png",
    tag:   "03 — Bewegung",
    title: "Wohnungswechsel entstehen, wenn Leben sich verändern.",
    sub:   "Diese Bewegung beginnt lange vor der offiziellen Kündigung.",
  },
  {
    image: "/images/network.png",
    tag:   "04 — Vernetzung",
    title: "Homelio macht diese Bewegung sichtbar.",
    sub:   "Wechselabsichten werden erkennbar — bevor sie öffentlich werden.",
  },
  {
    image: "/images/dashboard.png",
    tag:   "05 — Matching",
    title: "Und verbindet Wohnwunsch und Zeitpunkt intelligent.",
    sub:   "Aktuelle Wohnung, Wunschort und Umzugszeitpunkt finden zusammen.",
  },
];

export default function CinematicStory() {
  const outerRef = useRef<HTMLDivElement>(null);
  const imgRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const txtRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs  = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states
      imgRefs.current.forEach((el, i) => { if (i > 0) gsap.set(el, { opacity: 0 }); });
      txtRefs.current.forEach((el, i) => {
        if (i > 0) gsap.set(el, { opacity: 0, y: 24 });
      });

      // Main scrub timeline — total duration = 10 units
      // Each stage = 2 units; transition window = 0.5 units near end of each stage
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: outerRef.current,
          start: "top top",
          end:   "bottom bottom",
          scrub: 1.8,
        },
      });

      for (let i = 0; i < STAGES.length - 1; i++) {
        const base       = i * 2;          // stage start
        const crossStart = base + 1.55;    // begin transition

        // Images cross-fade
        tl.to(imgRefs.current[i],     { opacity: 0, scale: 1.04, duration: 0.55 }, crossStart);
        tl.fromTo(imgRefs.current[i + 1], { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.55 }, crossStart);

        // Text swap
        tl.to(txtRefs.current[i],     { opacity: 0, y: -16, duration: 0.35 }, crossStart);
        tl.fromTo(txtRefs.current[i + 1], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45 }, crossStart + 0.2);

        // Progress dots
        tl.to(dotRefs.current[i],     { width: "4px",  backgroundColor: "#262626", duration: 0.25 }, crossStart + 0.1);
        tl.to(dotRefs.current[i + 1], { width: "24px", backgroundColor: "#d4a853", duration: 0.25 }, crossStart + 0.1);
      }
    }, outerRef);

    return () => ctx.revert();
  }, []);

  return (
    /* Outer scroll container — provides scroll space */
    <div
      ref={outerRef}
      id="idee"
      style={{ height: `${STAGES.length * 100}vh` }}
    >
      {/* Sticky panel */}
      <div className="sticky top-0 h-screen overflow-hidden">

        {/* ── Image layers ────────────────────────────────── */}
        {STAGES.map((s, i) => (
          <div
            key={i}
            ref={(el) => { imgRefs.current[i] = el; }}
            className="absolute inset-0"
          >
            <Image src={s.image} alt={s.tag} fill className="object-cover" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(10,10,10,0.85) 35%, rgba(10,10,10,0.4) 80%, rgba(10,10,10,0.25) 100%)",
              }}
            />
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(10,10,10,0.3)" }} />
          </div>
        ))}

        {/* ── Text blocks ─────────────────────────────────── */}
        {STAGES.map((s, i) => (
          <div
            key={i}
            ref={(el) => { txtRefs.current[i] = el; }}
            className="absolute bottom-20 left-10 md:left-16 max-w-xl z-10"
          >
            <p
              className="text-xs tracking-[0.3em] uppercase mb-5"
              style={{ color: "var(--gold)" }}
            >
              {s.tag}
            </p>
            <h2
              className="text-4xl md:text-5xl leading-[1.1] mb-4"
              style={{ fontFamily: "var(--font-instrument-serif)", color: "var(--fg)" }}
            >
              {s.title}
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              {s.sub}
            </p>
          </div>
        ))}

        {/* ── Stage number (large background) ─────────────── */}
        <div
          className="absolute top-1/2 right-12 -translate-y-1/2 text-9xl font-bold select-none z-0 pointer-events-none"
          style={{ color: "rgba(255,255,255,0.03)", fontFamily: "var(--font-inter)" }}
        >
          {String(STAGES.length).padStart(2, "0")}
        </div>

        {/* ── Progress dots ────────────────────────────────── */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 items-end">
          {STAGES.map((_, i) => (
            <div
              key={i}
              ref={(el) => { dotRefs.current[i] = el; }}
              className="h-[3px] rounded-full"
              style={{
                width:           i === 0 ? "24px" : "4px",
                backgroundColor: i === 0 ? "#d4a853" : "#262626",
                transition:      "background-color 0.2s, width 0.2s",
              }}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
