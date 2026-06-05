"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BENEFITS = [
  "Frühzeitige Wechselabsichten erkennen",
  "Potenzielle Nachmieter früher sichtbar machen",
  "Weniger Ausschreibungsaufwand",
  "Bessere Wohnraumnutzung im Portfolio",
  "Kontrollierte Datenfreigabe durch Mieter",
];

export default function ForManagers() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start:   "top 70%",
          once:    true,
        },
      });
      tl.fromTo(contentRef.current, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out" })
        .fromTo(imageRef.current,   { opacity: 0, x:  24 }, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out" }, "-=0.6");
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="verwaltungen"
      className="py-28 md:py-36 overflow-hidden"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid md:grid-cols-2 gap-14 items-center">

          {/* Content — left on desktop */}
          <div ref={contentRef} className="opacity-0">
            <p
              className="text-xs tracking-[0.3em] uppercase mb-5"
              style={{ color: "var(--azure)" }}
            >
              Für Verwaltungen
            </p>
            <h2
              className="text-4xl md:text-5xl leading-[1.1] mb-6"
              style={{ fontFamily: "var(--font-instrument-serif)", color: "var(--fg)" }}
            >
              Für Verwaltungen wird Bewegung{" "}
              <em className="not-italic" style={{ color: "var(--azure)" }}>planbar.</em>
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: "var(--muted)" }}>
              Erkennen Sie Wechselabsichten in Ihrem Portfolio, bevor Wohnungen leer
              stehen — planbar, datenkonform und ohne Inserateaufwand.
            </p>

            <ul className="space-y-4 mb-10">
              {BENEFITS.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{ backgroundColor: "rgba(123,174,200,0.12)", color: "var(--azure)" }}
                  >
                    ✓
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: "var(--fg)" }}>
                    {b}
                  </span>
                </li>
              ))}
            </ul>

            {/* Trust note */}
            <div
              className="glass rounded-lg px-5 py-4 border-l-2"
              style={{ borderLeftColor: "var(--azure)" }}
            >
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                <span className="font-medium" style={{ color: "var(--fg)" }}>Datenschutz: </span>
                Personenbezogene Daten werden nie automatisch an Verwaltungen weitergegeben.
                Jede Freigabe erfordert die explizite Zustimmung des Mieters.
              </p>
            </div>

            <a
              href="mailto:hallo@homelio.ch"
              className="glass inline-flex items-center justify-center mt-8 px-7 py-3.5 rounded text-sm font-medium hover:bg-white/5 transition-colors"
              style={{ color: "var(--fg)" }}
            >
              Demo anfragen
            </a>
          </div>

          {/* Image — right on desktop */}
          <div ref={imageRef} className="relative h-[500px] rounded-xl overflow-hidden opacity-0">
            <Image
              src="/images/network.png"
              alt="Network"
              fill
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(10,10,10,0.7), rgba(10,10,10,0.2))" }}
            />
            {/* Stat overlay */}
            <div className="absolute top-6 right-6 glass rounded-xl p-5 min-w-[140px]">
              <p className="text-3xl font-light mb-1" style={{ color: "var(--azure)" }}>
                —
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Leerstand reduzieren</p>
            </div>
            <div className="absolute bottom-6 left-6 glass rounded-xl p-5 min-w-[160px]">
              <p className="text-3xl font-light mb-1" style={{ color: "var(--gold)" }}>
                früher
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Wechsel erkennen</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
