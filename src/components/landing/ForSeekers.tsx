"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BENEFITS = [
  "Weniger Bewerbungsstress",
  "Weniger Konkurrenzdruck",
  "Nicht ins Leere kündigen",
  "Passende Wechselmöglichkeiten früher erkennen",
];

export default function ForSeekers() {
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
      tl.fromTo(imageRef.current,   { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out" })
        .fromTo(contentRef.current, { opacity: 0, x:  24 }, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out" }, "-=0.6");
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-28 md:py-36 overflow-hidden"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid md:grid-cols-2 gap-14 items-center">

          {/* Image */}
          <div ref={imageRef} className="relative h-[480px] rounded-xl overflow-hidden opacity-0">
            <Image
              src="/images/interior.png"
              alt="Interior"
              fill
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(10,10,10,0.6), transparent)" }}
            />
            {/* Floating label */}
            <div
              className="glass absolute bottom-6 left-6 px-4 py-2.5 rounded-lg"
            >
              <p className="text-xs tracking-wide" style={{ color: "var(--muted)" }}>
                Wohnwunsch erkannt
              </p>
              <p className="text-sm font-medium mt-0.5" style={{ color: "var(--fg)" }}>
                Match gefunden – bevor das Inserat erscheint
              </p>
            </div>
          </div>

          {/* Content */}
          <div ref={contentRef} className="opacity-0">
            <p
              className="text-xs tracking-[0.3em] uppercase mb-5"
              style={{ color: "var(--gold)" }}
            >
              Für Wohnungssuchende
            </p>
            <h2
              className="text-4xl md:text-5xl leading-[1.1] mb-6"
              style={{ fontFamily: "var(--font-instrument-serif)", color: "var(--fg)" }}
            >
              Früher sehen, was wirklich{" "}
              <em className="not-italic text-grad">passt.</em>
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: "var(--muted)" }}>
              Homelio ermöglicht dir, Wohnungswechsel zu erkennen, bevor sie öffentlich
              werden — ohne Risiko, ohne Druck, kostenlos.
            </p>

            <ul className="space-y-4">
              {BENEFITS.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{ backgroundColor: "rgba(212,168,83,0.12)", color: "var(--gold)" }}
                  >
                    ✓
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: "var(--fg)" }}>
                    {b}
                  </span>
                </li>
              ))}
            </ul>

            <a
              href="#vormerken"
              className="inline-flex items-center justify-center mt-10 px-7 py-3.5 rounded text-sm font-medium"
              style={{
                background: "linear-gradient(135deg, var(--gold), #c9943a)",
                color:      "var(--bg)",
              }}
            >
              Kostenlos vormerken
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
