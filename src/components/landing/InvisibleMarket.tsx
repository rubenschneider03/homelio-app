"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CARDS = [
  {
    number: "01",
    label:  "Aktuelle Wohnung",
    text:   "Mieter beschreiben ihre aktuelle Situation — PLZ, Zimmer, Miete. Diese Daten bilden die Basis für kompatible Wechsel.",
  },
  {
    number: "02",
    label:  "Wunschwohnung",
    text:   "Region, Zimmeranzahl, Budget, Zeitraum. Homelio sucht passende Gegenstücke — still und automatisch.",
  },
  {
    number: "03",
    label:  "Umzugszeitpunkt",
    text:   "Wer wechseln möchte, gibt seinen Wunschzeitraum an. Das System findet Paare mit überlappenden Fenstern.",
  },
  {
    number: "04",
    label:  "Zustimmung & Datenschutz",
    text:   "Personenbezogene Daten werden nie automatisch weitergegeben. Jeder Schritt erfordert deine explizite Zustimmung.",
  },
];

export default function InvisibleMarket() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs   = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(cardRefs.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start:   "top 75%",
          once:    true,
        },
        y:        28,
        opacity:  0,
        stagger:  0.12,
        duration: 0.75,
        ease:     "power3.out",
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="suchende"
      className="py-28 md:py-36"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="max-w-6xl mx-auto px-8">

        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p
            className="text-xs tracking-[0.3em] uppercase mb-4"
            style={{ color: "var(--gold)" }}
          >
            Der unsichtbare Markt
          </p>
          <h2
            className="text-4xl md:text-5xl leading-tight mb-5"
            style={{ fontFamily: "var(--font-instrument-serif)", color: "var(--fg)" }}
          >
            Nicht mehr um wenige Inserate kämpfen.
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
            Homelio zeigt Wechselpotenziale früher — bevor Wohnungen öffentlich
            ausgeschrieben werden.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CARDS.map((c, i) => (
            <div
              key={i}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="glass rounded-xl p-7 flex flex-col gap-5"
            >
              <span
                className="text-4xl font-light tabular-nums"
                style={{ color: "var(--hairline)", fontFamily: "var(--font-inter)" }}
              >
                {c.number}
              </span>
              <div>
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: "var(--fg)" }}
                >
                  {c.label}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  {c.text}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
