"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

export default function HeroSection() {
  const bgRef      = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const h1Ref      = useRef<HTMLHeadingElement>(null);
  const subRef     = useRef<HTMLParagraphElement>(null);
  const ctasRef    = useRef<HTMLDivElement>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Slow ambient scale on background image
    gsap.to(bgRef.current, {
      scale: 1.06,
      duration: 22,
      ease: "none",
    });

    // Entrance — starts after CSS content-reveal finishes (~0.5 s)
    const tl = gsap.timeline({ delay: 0.45 });
    tl.fromTo(eyebrowRef.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" })
      .fromTo(h1Ref.current,      { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.85, ease: "power3.out" }, "-=0.45")
      .fromTo(subRef.current,     { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7,  ease: "power3.out" }, "-=0.45")
      .fromTo(ctasRef.current,    { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6,  ease: "power3.out" }, "-=0.35")
      .fromTo(scrollRef.current,  { opacity: 0 },        { opacity: 1, duration: 0.8,         ease: "power2.out" }, "-=0.1");

    return () => { tl.kill(); };
  }, []);

  return (
    <section className="relative h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div ref={bgRef} className="absolute inset-0" style={{ willChange: "transform" }}>
        <Image
          src="/images/exterior.png"
          alt="Exterior"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlays */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(10,10,10,0.82) 40%, rgba(10,10,10,0.35) 100%)",
          }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(10,10,10,0.25)" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-8">
        <p
          ref={eyebrowRef}
          className="text-xs tracking-[0.35em] uppercase mb-8 opacity-0"
          style={{ color: "var(--muted)" }}
        >
          HOMELIO · SWISS PROPTECH
        </p>

        <h1
          ref={h1Ref}
          className="text-5xl md:text-7xl leading-[1.05] mb-6 max-w-3xl opacity-0"
          style={{ fontFamily: "var(--font-instrument-serif)", color: "var(--fg)" }}
        >
          Der unsichtbare Wohnungsmarkt{" "}
          <em className="not-italic text-grad">wird sichtbar.</em>
        </h1>

        <p
          ref={subRef}
          className="text-base md:text-lg leading-relaxed max-w-lg mb-10 opacity-0"
          style={{ color: "var(--muted)" }}
        >
          Homelio vernetzt wechselwillige Mieter, bevor Wohnungen offiziell gekündigt
          oder ausgeschrieben werden.
        </p>

        <div ref={ctasRef} className="flex flex-col sm:flex-row gap-4 opacity-0">
          <a
            href="#vormerken"
            className="inline-flex items-center justify-center px-7 py-3.5 rounded text-sm font-medium"
            style={{
              background: "linear-gradient(135deg, var(--gold), #c9943a)",
              color: "var(--bg)",
            }}
          >
            Kostenlos vormerken
          </a>
          <a
            href="#verwaltungen"
            className="glass inline-flex items-center justify-center px-7 py-3.5 rounded text-sm font-medium transition-colors hover:bg-white/5"
            style={{ color: "var(--fg)" }}
          >
            Für Verwaltungen
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        ref={scrollRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0"
      >
        <span className="text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
          Scrollen
        </span>
        <div
          className="w-px h-10 rounded-full"
          style={{
            background: "linear-gradient(to bottom, var(--hairline), transparent)",
            animation: "scrollPulse 2s ease-in-out infinite",
          }}
        />
      </div>
    </section>
  );
}
