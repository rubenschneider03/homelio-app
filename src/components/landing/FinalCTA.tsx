"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const MARQUEE_TEXT = "UNSICHTBAREN WOHNUNGSMARKT SICHTBAR MACHEN · HOMELIO SWISS PROPTECH · ";

export default function FinalCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headRef.current, {
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%", once: true },
        y: 32, opacity: 0, duration: 1, ease: "power3.out",
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={sectionRef} style={{ backgroundColor: "var(--bg)" }}>

      {/* Marquee strip */}
      <div
        className="w-full overflow-hidden py-5 border-t border-b"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div
          className="flex whitespace-nowrap"
          style={{ animation: "marquee 28s linear infinite" }}
        >
          {/* Two copies for seamless loop */}
          {[0, 1].map((n) => (
            <span
              key={n}
              className="text-xs tracking-[0.25em] uppercase flex-shrink-0"
              style={{ color: "rgba(115,115,115,0.5)", paddingRight: "4rem" }}
            >
              {MARQUEE_TEXT.repeat(4)}
            </span>
          ))}
        </div>
      </div>

      {/* CTA section */}
      <div id="vormerken" className="py-28 md:py-36">
        <div className="max-w-4xl mx-auto px-8 text-center">

          <div ref={headRef} className="opacity-0">
            <p
              className="text-xs tracking-[0.3em] uppercase mb-6"
              style={{ color: "var(--gold)" }}
            >
              Homelio · Swiss PropTech
            </p>
            <h2
              className="text-4xl md:text-6xl leading-[1.1] mb-6"
              style={{ fontFamily: "var(--font-instrument-serif)", color: "var(--fg)" }}
            >
              Weniger Kampf um Inserate.
              <br />
              <em className="not-italic text-grad">Mehr passende Wohnungswechsel.</em>
            </h2>
            <p
              className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-12"
              style={{ color: "var(--muted)" }}
            >
              Homelio öffnet den Wohnungsmarkt dort, wo Bewegung entsteht — bevor
              sie öffentlich sichtbar wird.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#"
                className="inline-flex items-center justify-center px-9 py-4 rounded text-sm font-medium"
                style={{
                  background: "linear-gradient(135deg, var(--gold), #c9943a)",
                  color:      "var(--bg)",
                }}
              >
                Kostenlos vormerken
              </a>
              <a
                href="mailto:hallo@homelio.ch"
                className="glass inline-flex items-center justify-center px-9 py-4 rounded text-sm font-medium hover:bg-white/5 transition-colors"
                style={{ color: "var(--fg)" }}
              >
                Demo für Verwaltungen anfragen
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Footer bar */}
      <div
        className="border-t py-8"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            Homelio
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            © {new Date().getFullYear()} – Entwickelt in der Schweiz
          </p>
          <div className="flex gap-6">
            {[
              { label: "Datenschutz", href: "/datenschutz" },
              { label: "AGB",         href: "/agb" },
              { label: "Kontakt",     href: "mailto:hallo@homelio.ch" },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-xs transition-colors hover:text-fg"
                style={{ color: "var(--muted)" }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
}
