"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";

const LINKS = [
  { label: "Idee",              href: "#idee" },
  { label: "Wohnungssuchende",  href: "#suchende" },
  { label: "Verwaltungen",      href: "#verwaltungen" },
  { label: "Matching",          href: "#matching" },
];

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { opacity: 0, y: -14 },
      { opacity: 1, y: 0, duration: 0.9, delay: 0.5, ease: "power3.out" }
    );
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed top-5 left-1/2 z-50 -translate-x-1/2 opacity-0"
      style={{ willChange: "transform" }}
    >
      <div
        className="glass flex items-center gap-3 px-4 py-2 rounded-full"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight pr-3 border-r"
          style={{ color: "var(--fg)", borderColor: "var(--hairline)" }}
        >
          Homelio
        </Link>

        {/* Links — hidden on small screens */}
        <div className="hidden md:flex items-center gap-5 px-2">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-xs tracking-wide transition-colors hover:text-fg"
              style={{ color: "var(--muted)" }}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href="#vormerken"
          className="text-xs font-medium px-4 py-1.5 rounded-full ml-1"
          style={{
            background: "linear-gradient(135deg, var(--gold), #c9943a)",
            color: "var(--bg)",
          }}
        >
          Vormerken
        </a>
      </div>
    </nav>
  );
}
