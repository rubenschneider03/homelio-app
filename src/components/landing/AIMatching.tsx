"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const MATCH_ITEMS = [
  { label: "Matching Score",  value: "87%",       color: "var(--gold)" },
  { label: "Wechselkette",    value: "2 Profile",  color: "var(--azure)" },
  { label: "Zeitpunkt",       value: "Q3 2026",    color: "var(--fg)" },
  { label: "Zustimmung",      value: "Ausstehend", color: "var(--muted)" },
];

const PROFILE_CARDS = [
  { label: "Profil A", detail: "3.5 Zi · Zürich · aktiv suchend" },
  { label: "Profil B", detail: "4.0 Zi · Winterthur · wechselbereit" },
];

export default function AIMatching() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const bgRef      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(bgRef.current, {
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
        opacity: 0, scale: 0.97, duration: 1.1, ease: "power3.out",
      });
      gsap.from(cardRefs.current, {
        scrollTrigger: { trigger: sectionRef.current, start: "top 65%", once: true },
        y: 24, opacity: 0, stagger: 0.1, duration: 0.75, ease: "power3.out",
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="matching"
      className="py-28 md:py-36 relative overflow-hidden"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <div className="max-w-6xl mx-auto px-8">

        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p
            className="text-xs tracking-[0.3em] uppercase mb-4"
            style={{ color: "var(--gold)" }}
          >
            AI Matching
          </p>
          <h2
            className="text-4xl md:text-5xl leading-tight mb-5"
            style={{ fontFamily: "var(--font-instrument-serif)", color: "var(--fg)" }}
          >
            Intelligentes Matching statt Zufall.
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
            Homelio verbindet Wohnwunsch, aktuelle Wohnung und Umzugszeitpunkt zu
            passenden Möglichkeiten — automatisch, diskret und datenschutzkonform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">

          {/* Left: dashboard image */}
          <div ref={bgRef} className="relative h-[420px] rounded-xl overflow-hidden opacity-0">
            <Image
              src="/images/dashboard.png"
              alt="Dashboard"
              fill
              className="object-cover object-top"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(20,20,20,0.9) 0%, rgba(20,20,20,0.2) 60%, transparent 100%)" }}
            />
            {/* Overlay label */}
            <div className="absolute bottom-5 left-5 right-5 glass rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: "var(--fg)" }}>Matching-Übersicht</p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(212,168,83,0.15)", color: "var(--gold)" }}
                >
                  Live
                </span>
              </div>
              <div
                className="h-1 w-full rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--hairline)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: "87%", background: "linear-gradient(90deg, var(--gold), var(--azure))" }}
                />
              </div>
              <p className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>87% Match-Qualität</p>
            </div>
          </div>

          {/* Right: match detail cards */}
          <div className="flex flex-col gap-4">

            {/* Profile cards */}
            {PROFILE_CARDS.map((p, i) => (
              <div
                key={i}
                ref={(el) => { cardRefs.current[i] = el; }}
                className="glass rounded-xl p-5 flex items-center gap-4 opacity-0"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                  style={{ backgroundColor: "rgba(212,168,83,0.12)", color: "var(--gold)" }}
                >
                  {i === 0 ? "A" : "B"}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{p.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{p.detail}</p>
                </div>
                <div
                  className="ml-auto text-xs px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: "rgba(212,168,83,0.1)",
                    color:           "var(--gold)",
                  }}
                >
                  Kompatibel
                </div>
              </div>
            ))}

            {/* Connection line */}
            <div
              ref={(el) => { cardRefs.current[2] = el; }}
              className="flex items-center gap-3 px-5 opacity-0"
            >
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--hairline)" }} />
              <span className="text-xs" style={{ color: "var(--gold)" }}>87% Match</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--hairline)" }} />
            </div>

            {/* Match detail items */}
            <div
              ref={(el) => { cardRefs.current[3] = el; }}
              className="glass rounded-xl p-5 opacity-0"
            >
              <p
                className="text-xs tracking-wide uppercase mb-4"
                style={{ color: "var(--muted)" }}
              >
                Match-Details
              </p>
              <div className="space-y-3">
                {MATCH_ITEMS.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{item.label}</span>
                    <span className="text-sm font-medium" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <p
              ref={(el) => { cardRefs.current[4] = el; }}
              className="text-xs leading-relaxed px-1 opacity-0"
              style={{ color: "var(--muted)" }}
            >
              Kein Kontakt zwischen Profilen ohne explizite beidseitige Zustimmung.
              Homelio koordiniert — du entscheidest.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
