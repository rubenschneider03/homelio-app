'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────
const END_OFFSET         = 0.05;
const PLAYBACK_RATE      = 1.35;
const SCROLL_COOLDOWN_MS = 700;
const GOLD               = '#C9A84C';

// ── Overlay / animation constants (edit freely) ───────────────────────────────
const HOLD_OVERLAY_OPACITY                  = 0.38;  // milky veil strength in hold mode
const TRANSITION_OVERLAY_OPACITY            = 0.08;  // veil nearly gone while video plays
const UI_FADE_OUT_MS                        = 900;   // UI fades out at transition start
const UI_FADE_IN_MS                         = 1100;  // UI fades in for nav-jump arrivals
const OVERLAY_FADE_MS                       = 1000;  // overlay crossfade duration
const UI_FADE_IN_DELAY_MS                   = 250;   // extra pause before UI appears on arrival
const DESTINATION_UI_FADE_START_PROGRESS    = 0.78;  // when destination UI starts fading in
const DESTINATION_UI_FADE_IN_MS            = 1200;  // duration of destination UI fade-in
const DESTINATION_OVERLAY_FADE_START_PROGRESS = 0.70; // when overlay starts returning to hold

// ─────────────────────────────────────────────────────────────────────────────
//  Video sources
// ─────────────────────────────────────────────────────────────────────────────
const FWD_VIDEOS: Record<0|1|2, string> = {
  0: '/images/ezgif-split/Video_1.mp4',
  1: '/images/ezgif-split/Video_2.mp4',
  2: '/images/ezgif-split/Video_3.mp4',
};

const REV_VIDEOS: Record<0|1|2, string> = {
  0: '/images/ezgif-split/Video_1_reverse.mp4',
  1: '/images/ezgif-split/Video_2_reverse.mp4',
  2: '/images/ezgif-split/Video_3_reverse.mp4',
};

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────
type MFIndex = 0 | 1 | 2 | 3;
type Mode    = 'hold' | 'transition';
type Dir     = 'forward' | 'backward' | null;

// ─────────────────────────────────────────────────────────────────────────────
//  Helper functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MF0 → Video_1, MF1 → Video_1, MF2 → Video_2, MF3 → Video_3
 */
function getHoldVideoForMainframe(index: MFIndex): string {
  const MAP: Record<MFIndex, string> = {
    0: FWD_VIDEOS[0],
    1: FWD_VIDEOS[0],
    2: FWD_VIDEOS[1],
    3: FWD_VIDEOS[2],
  };
  return MAP[index];
}

/**
 * MF0 → 0, MF1/2/3 → duration(holdVideo) − END_OFFSET
 */
function getHoldTimeForMainframe(index: MFIndex, durations: Record<string, number>): number {
  if (index === 0) return 0;
  const src = getHoldVideoForMainframe(index);
  const dur = durations[src];
  if (!dur) return 0;
  return Math.max(0, dur - END_OFFSET);
}

/**
 * Which video to play for a forward step and which mainframe it leads to.
 */
function getForwardTransition(index: MFIndex): { src: string; target: MFIndex } | null {
  const MAP: Partial<Record<MFIndex, { src: string; target: MFIndex }>> = {
    0: { src: FWD_VIDEOS[0], target: 1 },
    1: { src: FWD_VIDEOS[1], target: 2 },
    2: { src: FWD_VIDEOS[2], target: 3 },
  };
  return MAP[index] ?? null;
}

/**
 * Which reverse video to play for a backward step and which mainframe it leads to.
 */
function getBackwardTransition(index: MFIndex): { src: string; target: MFIndex } | null {
  const MAP: Partial<Record<MFIndex, { src: string; target: MFIndex }>> = {
    1: { src: REV_VIDEOS[0], target: 0 },
    2: { src: REV_VIDEOS[1], target: 1 },
    3: { src: REV_VIDEOS[2], target: 2 },
  };
  return MAP[index] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Navigation
// ─────────────────────────────────────────────────────────────────────────────
function TopNav({ onJump }: { onJump: (mf: MFIndex) => void }) {
  return (
    <div style={{
      position: 'absolute', top: 20, left: 0, right: 0, zIndex: 100,
      display: 'flex', justifyContent: 'center', pointerEvents: 'none',
    }}>
      <nav style={{
        pointerEvents: 'auto',
        display: 'flex', alignItems: 'center', gap: 2,
        padding: '6px 8px', borderRadius: 999,
        background: 'rgba(16,13,9,0.82)',
        backdropFilter: 'blur(22px) saturate(1.4)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 4px 28px rgba(0,0,0,0.50)',
      }}>
        <button onClick={() => onJump(0)} style={navBtnStyle(600)}>Homelio</button>
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.13)', flexShrink: 0, margin: '0 2px' }} />
        <button onClick={() => onJump(1)} style={navBtnStyle()}>Konzept</button>
        <button onClick={() => onJump(2)} style={navBtnStyle()}>Wohnung finden</button>
        <a href="/anmelden" style={{
          marginLeft: 6, padding: '7px 18px', borderRadius: 999,
          background: GOLD, color: '#0C0A06',
          fontSize: 13, fontWeight: 500, textDecoration: 'none',
          whiteSpace: 'nowrap', letterSpacing: '0.01em',
        }}>
          <span className="hidden xl:inline">Jetzt unverbindlich Angebote erhalten</span>
          <span className="xl:hidden">Anmelden</span>
        </a>
      </nav>
    </div>
  );
}

function navBtnStyle(weight = 400) {
  return {
    padding: '7px 14px', background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: weight, borderRadius: 999, color: weight === 600
      ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.72)',
    letterSpacing: weight === 600 ? '0.04em' : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Shared vignette — gradient that sits between video and UI text
// ─────────────────────────────────────────────────────────────────────────────
function Vignette({ stops = 'rgba(4,3,2,0.90) 0%, rgba(4,3,2,0.54) 28%, rgba(4,3,2,0.10) 58%, transparent 78%' }: { stops?: string }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `linear-gradient(to top, ${stops})`,
    }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mainframe 1 — MF0  (Video_1 paused at t=0)
// ─────────────────────────────────────────────────────────────────────────────
const TRUST_POINTS = [
  'Ihre Daten bleiben vertraulich und geschützt.',
  'Datenschutzkonform nach Schweizer Standards.',
  'Keine Weitergabe. Keine Werbung. Kein Spam.',
] as const;

function MF0Content() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Vignette />

      {/* Left text block */}
      <div style={{
        position: 'absolute',
        bottom: 'clamp(54px, 7vh, 82px)',
        left: 'clamp(40px, 6vw, 96px)',
        maxWidth: 'min(490px, 46vw)',
      }}>
        <p style={{
          fontSize: 10, letterSpacing: '0.34em', textTransform: 'uppercase',
          color: GOLD, opacity: 0.85, marginBottom: 16, margin: '0 0 16px',
        }}>HOMELIO</p>

        <h1 style={{
          fontSize: 'clamp(36px, 4.8vw, 64px)', fontWeight: 300, lineHeight: 1.06,
          color: 'rgba(255,255,255,0.97)', margin: '0 0 20px',
          fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
        }}>
          Sie überlegen umzuziehen?
        </h1>

        <p style={{
          fontSize: 14, fontWeight: 300, lineHeight: 1.72,
          color: 'rgba(255,255,255,0.60)', margin: '0 0 28px', maxWidth: 410,
        }}>
          Registrieren Sie sich einmal und erhalten Sie persönliche Wohnangebote,
          oft bevor sie öffentlich ausgeschrieben sind – ohne direkten Konkurrenzdruck.
          Ihre Daten bleiben vertraulich und datenschutzkonform geschützt.
        </p>

        {/* CTA */}
        <a href="/anmelden" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '13px 28px', borderRadius: 999,
          background: GOLD, color: '#0C0A06',
          fontSize: 14, fontWeight: 500, textDecoration: 'none',
          letterSpacing: '0.01em', whiteSpace: 'nowrap',
        }}>
          Jetzt unverbindlich Angebote erhalten <span aria-hidden>→</span>
        </a>

        {/* Trust points */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 22 }}>
          {TRUST_POINTS.map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, opacity: 0.65 }}>
                <path d="M6.5 1.2L11 3.3V6.8c0 2.4-1.8 4.2-4.5 4.9C3.8 11 2 9.2 2 6.8V3.3L6.5 1.2z"
                  stroke={GOLD} strokeWidth="1" fill="none" />
              </svg>
              <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.4 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat card — bottom right */}
      <div style={{
        position: 'absolute',
        bottom: 'clamp(54px, 7vh, 82px)',
        right: 'clamp(40px, 6vw, 96px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        padding: '22px 30px', borderRadius: 18,
        background: 'rgba(255,255,255,0.055)',
        backdropFilter: 'blur(20px) saturate(1.3)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2 9.5L10 3l8 6.5V19H13v-5.5H7V19H2V9.5z"
            stroke={GOLD} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
        </svg>
        <span style={{
          fontSize: 36, fontWeight: 300, color: 'rgba(255,255,255,0.95)',
          lineHeight: 1.05, marginTop: 8,
        }}>450</span>
        <span style={{
          fontSize: 11.5, color: 'rgba(255,255,255,0.42)',
          textAlign: 'center', lineHeight: 1.55, marginTop: 2,
        }}>aktuelle<br />Wohnchancen</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mainframe 2 — MF1  (Video_1 paused at its endpoint)
// ─────────────────────────────────────────────────────────────────────────────
function ConceptDiagram() {
  // Geometry
  const lcx = 248, lcy = 150, lr = 74;   // large circle (Wohnungsmarkt)
  const s1x = 62,  s1y = 66,  sr = 46;   // small circle upper (Wohnungssuchende)
  const s2x = 62,  s2y = 234;            // small circle lower (Wohnungssuchende)

  // Arrow endpoints: small → large
  const calcArrow = (ax: number, ay: number, bx: number, by: number, r1: number, r2: number) => {
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    return {
      x1: ax + r1 * (dx / L), y1: ay + r1 * (dy / L),
      x2: bx - r2 * (dx / L), y2: by - r2 * (dy / L),
    };
  };
  const a1 = calcArrow(s1x, s1y, lcx, lcy, sr, lr);
  const a2 = calcArrow(s2x, s2y, lcx, lcy, sr, lr);

  // Gold curve between two small circles (Homelio connection, left side)
  const curveD = `M ${s1x},${s1y + sr} Q 8,${lcy} ${s2x},${s2y - sr}`;

  return (
    <svg width="326" height="300" viewBox="0 0 326 300" style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <marker id="mw" markerWidth="8" markerHeight="8" refX="6" refY="3.5" orient="auto">
          <path d="M0 1.2 L6 3.5 L0 5.8" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.2" />
        </marker>
        <marker id="mg" markerWidth="8" markerHeight="8" refX="6" refY="3.5" orient="auto">
          <path d="M0 1.2 L6 3.5 L0 5.8" fill="none" stroke={GOLD} strokeWidth="1.2" />
        </marker>
      </defs>

      {/* White arrows: Wohnungssuchende → Wohnungsmarkt */}
      <line x1={a1.x1} y1={a1.y1} x2={a1.x2} y2={a1.y2}
        stroke="rgba(255,255,255,0.58)" strokeWidth="1.5" markerEnd="url(#mw)" />
      <line x1={a2.x1} y1={a2.y1} x2={a2.x2} y2={a2.y2}
        stroke="rgba(255,255,255,0.58)" strokeWidth="1.5" markerEnd="url(#mw)" />

      {/* Gold Homelio curve connecting the two small circles */}
      <path d={curveD} fill="none" stroke={GOLD} strokeWidth="1.8" markerEnd="url(#mg)" />

      {/* "Homelio" label along the gold curve */}
      <text x="1" y={lcy + 4} fill={GOLD} fontSize="10" fontWeight="500" opacity="0.88"
        style={{ letterSpacing: '0.06em' }}>
        Homelio
      </text>

      {/* Large circle — Wohnungsmarkt */}
      <circle cx={lcx} cy={lcy} r={lr}
        fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.36)" strokeWidth="1.8" />
      <text x={lcx} y={lcy - 6} fill="rgba(255,255,255,0.90)" fontSize="12.5"
        textAnchor="middle" fontWeight="400">Wohnungs-</text>
      <text x={lcx} y={lcy + 11} fill="rgba(255,255,255,0.90)" fontSize="12.5"
        textAnchor="middle" fontWeight="400">markt</text>

      {/* Small circle upper */}
      <circle cx={s1x} cy={s1y} r={sr}
        fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.30)" strokeWidth="1.6" />
      <text x={s1x} y={s1y - 4} fill="rgba(255,255,255,0.78)" fontSize="9.5" textAnchor="middle">Wohnungs-</text>
      <text x={s1x} y={s1y + 10} fill="rgba(255,255,255,0.78)" fontSize="9.5" textAnchor="middle">suchende</text>

      {/* Small circle lower */}
      <circle cx={s2x} cy={s2y} r={sr}
        fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.30)" strokeWidth="1.6" />
      <text x={s2x} y={s2y - 4} fill="rgba(255,255,255,0.78)" fontSize="9.5" textAnchor="middle">Wohnungs-</text>
      <text x={s2x} y={s2y + 10} fill="rgba(255,255,255,0.78)" fontSize="9.5" textAnchor="middle">suchende</text>
    </svg>
  );
}

const MF1_BODY = [
  'Ein Familienzuwachs, ein neuer Job oder veränderte Lebensumstände können dazu führen, dass man mehr Platz braucht. In anderen Situationen möchte man sich bewusst verkleinern.',
  'Homelio vernetzt diese Menschen frühzeitig und diskret – noch bevor Wohnungen offiziell ausgeschrieben werden.',
  'So entstehen passende Wechsel ohne unnötigen Konkurrenzdruck.',
  'Gemeinsam mit den Verwaltungen sorgt Homelio für einen reibungslosen Ablauf.',
] as const;

function MF1Content() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Vignette stops="rgba(4,3,2,0.88) 0%, rgba(4,3,2,0.52) 32%, rgba(4,3,2,0.10) 62%, transparent 82%" />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '82px clamp(40px,6vw,96px) clamp(54px,7vh,82px)',
        gap: 'clamp(28px, 4vw, 60px)',
      }}>
        {/* Left: text */}
        <div style={{ flex: '1 1 320px', maxWidth: 440 }}>
          <p style={{
            fontSize: 10, letterSpacing: '0.34em', textTransform: 'uppercase',
            color: GOLD, opacity: 0.85, margin: '0 0 16px',
          }}>KONZEPT</p>

          <h2 style={{
            fontSize: 'clamp(26px, 3.2vw, 44px)', fontWeight: 300, lineHeight: 1.09,
            color: 'rgba(255,255,255,0.96)', margin: '0 0 24px',
            fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
          }}>
            Wenn sich das Leben verändert, verändert sich auch die Wohnung.
          </h2>

          {MF1_BODY.map((p, i) => (
            <p key={i} style={{
              fontSize: 13.5, fontWeight: 300, lineHeight: 1.70,
              color: 'rgba(255,255,255,0.54)', margin: '0 0 11px', maxWidth: 400,
            }}>{p}</p>
          ))}
        </div>

        {/* Right: glass card with SVG diagram */}
        <div style={{
          flex: '0 0 auto',
          padding: '26px 20px', borderRadius: 20,
          background: 'rgba(255,255,255,0.045)',
          backdropFilter: 'blur(16px) saturate(1.2)',
          border: '1px solid rgba(255,255,255,0.09)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ConceptDiagram />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mainframe 3 — MF2  (Video_2 paused at its endpoint)
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    n: '1', title: 'Anmelden',
    body: 'Sie registrieren sich und hinterlegen Ihr Wohnprofil.',
  },
  {
    n: '2', title: 'AI-Matching',
    body: 'Das Homelio AI-System sucht laufend nach passenden Wohnmöglichkeiten und erkennt relevante Treffer frühzeitig.',
  },
  {
    n: '3', title: 'Verbindlich akzeptieren',
    body: 'Wenn ein Vorschlag für Sie passt, akzeptieren Sie ihn verbindlich mit einem Klick.',
  },
  {
    n: '4', title: 'Verwaltung & Wechsel',
    body: 'Wir schlagen Ihr Interesse der Verwaltung vor. Wenn diese zustimmt, kommt es zum Wohnungswechsel.',
  },
] as const;

function MF2Content() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Vignette stops="rgba(4,3,2,0.88) 0%, rgba(4,3,2,0.52) 32%, rgba(4,3,2,0.10) 62%, transparent 82%" />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '82px clamp(40px,6vw,96px) clamp(54px,7vh,82px)',
        gap: 'clamp(28px, 4vw, 60px)',
      }}>
        {/* Left: label + headline + intro */}
        <div style={{ flex: '1 1 260px', maxWidth: 380, minWidth: 0 }}>
          <p style={{
            fontSize: 10, letterSpacing: '0.34em', textTransform: 'uppercase',
            color: GOLD, opacity: 0.85, margin: '0 0 16px',
          }}>MATCHING</p>
          <h2 style={{
            fontSize: 'clamp(30px, 3.8vw, 52px)', fontWeight: 300, lineHeight: 1.08,
            color: 'rgba(255,255,255,0.96)', margin: '0 0 18px',
            fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
          }}>Intelligent verbunden.</h2>
          <p style={{
            fontSize: 14, fontWeight: 300, lineHeight: 1.70,
            color: 'rgba(255,255,255,0.58)', margin: '0 0 20px', maxWidth: 340,
          }}>
            Registrieren Sie sich und erhalten Sie persönliche Wohnangebote –
            diskret, passend und ohne Konkurrenzdruck.
          </p>
          <p style={{
            fontSize: 12.5, fontWeight: 300, lineHeight: 1.60,
            color: 'rgba(255,255,255,0.36)', margin: 0, maxWidth: 320,
          }}>
            So entsteht ein diskreter, effizienter und reibungsloser Ablauf –
            für Suchende und Verwaltungen.
          </p>
        </div>

        {/* Right: vertical 4-step cards */}
        <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', maxWidth: 340, minWidth: 0 }}>
          {STEPS.map((step, i) => (
            <div key={step.n}>
              <div style={{
                padding: '11px 14px', borderRadius: 12,
                background: i === 0 ? 'rgba(201,168,76,0.09)' : 'rgba(255,255,255,0.05)',
                border: i === 0 ? `1px solid rgba(201,168,76,0.28)` : '1px solid rgba(255,255,255,0.09)',
                backdropFilter: 'blur(14px)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 1, fontSize: 11, fontWeight: 600,
                    background: i === 0 ? GOLD : 'rgba(255,255,255,0.12)',
                    color: i === 0 ? '#0C0A06' : 'rgba(255,255,255,0.55)',
                  }}>{step.n}</div>
                  <div>
                    <div style={{
                      fontSize: 13, fontWeight: 500,
                      color: 'rgba(255,255,255,0.90)', marginBottom: 3,
                    }}>{step.title}</div>
                    <div style={{
                      fontSize: 12, fontWeight: 300, lineHeight: 1.55,
                      color: 'rgba(255,255,255,0.50)',
                    }}>{step.body}</div>
                  </div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ display: 'flex', paddingLeft: 21, height: 11, alignItems: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <line x1="5" y1="0" x2="5" y2="7" stroke="rgba(255,255,255,0.20)" strokeWidth="1.2" />
                    <path d="M2 5l3 3 3-3" stroke="rgba(255,255,255,0.20)" strokeWidth="1.2"
                      fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mainframe 4 — MF3  (Video_3 paused at its endpoint)
// ─────────────────────────────────────────────────────────────────────────────
const LISTING_CARDS = [
  { size: '3.5 Zi. · 89 m²',  location: 'Zürich', tag: 'Frühangebot · Diskret' },
  { size: '4.5 Zi. · 108 m²', location: 'Zürich', tag: 'Vorab geprüft' },
] as const;

function MF3Content() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Vignette stops="rgba(4,3,2,0.90) 0%, rgba(4,3,2,0.56) 30%, rgba(4,3,2,0.12) 60%, transparent 80%" />

      {/* Left text + CTA */}
      <div style={{
        position: 'absolute',
        bottom: 'clamp(54px, 7vh, 82px)',
        left: 'clamp(40px, 6vw, 96px)',
        maxWidth: 'min(460px, 44vw)',
      }}>
        <p style={{
          fontSize: 10, letterSpacing: '0.34em', textTransform: 'uppercase',
          color: GOLD, opacity: 0.85, margin: '0 0 16px',
        }}>ANGEBOTE</p>
        <h2 style={{
          fontSize: 'clamp(34px, 4.5vw, 58px)', fontWeight: 300, lineHeight: 1.07,
          color: 'rgba(255,255,255,0.96)', margin: '0 0 18px',
          fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
        }}>
          Persönliche Angebote.<br />Früh und passend.
        </h2>
        <p style={{
          fontSize: 14.5, fontWeight: 300, lineHeight: 1.72,
          color: 'rgba(255,255,255,0.62)', margin: '0 0 12px', maxWidth: 410,
        }}>
          Erhalten Sie persönliche Angebote, bevor Wohnungen öffentlich ausgeschrieben
          werden – diskret, passend und ohne den üblichen Konkurrenzdruck.
        </p>
        <p style={{
          fontSize: 13, fontWeight: 300, lineHeight: 1.60,
          color: 'rgba(255,255,255,0.40)', margin: '0 0 28px', maxWidth: 380,
        }}>
          Einmal registrieren genügt. Homelio informiert Sie, sobald eine passende
          Wohnchance entsteht.
        </p>
        <a href="/anmelden" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '13px 28px', borderRadius: 999,
          background: GOLD, color: '#0C0A06',
          fontSize: 14, fontWeight: 500, textDecoration: 'none',
          letterSpacing: '0.01em', whiteSpace: 'nowrap',
        }}>
          Jetzt unverbindlich Angebote erhalten <span aria-hidden>→</span>
        </a>
      </div>

      {/* Floating listing cards — bottom right */}
      <div style={{
        position: 'absolute',
        right: 'clamp(40px, 6vw, 96px)',
        bottom: 'clamp(54px, 7vh, 82px)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {LISTING_CARDS.map((card, i) => (
          <div key={i} style={{
            padding: '14px 20px', borderRadius: 14,
            background: 'rgba(255,255,255,0.055)',
            backdropFilter: 'blur(20px) saturate(1.3)',
            border: '1px solid rgba(255,255,255,0.11)',
            minWidth: 210,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
              <span style={{
                fontSize: 10.5, color: 'rgba(255,255,255,0.42)',
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>{card.tag}</span>
            </div>
            <div style={{
              fontSize: 15, fontWeight: 400, color: 'rgba(255,255,255,0.92)', marginBottom: 2,
            }}>{card.size}</div>
            <div style={{
              fontSize: 12.5, fontWeight: 300, color: 'rgba(255,255,255,0.50)',
            }}>{card.location}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const MF_VIEWS = { 0: MF0Content, 1: MF1Content, 2: MF2Content, 3: MF3Content } as const;

// ─────────────────────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function HomelioScrollytellingStable() {
  const [mainframeIndex,    setMainframeIndex]   = useState<MFIndex>(0);
  const [mode,              setMode]             = useState<Mode>('hold');
  const [direction,         setDirection]        = useState<Dir>(null);
  const [activeVideoSrc,    setActiveVideoSrc]   = useState('');
  const [isTransitioning,   setIsTransitioning]  = useState(false);
  const [transitionProgress,setTransitionProgress] = useState(0);
  const [uiVisible,         setUiVisible]        = useState(false);
  const [overlayOpacity,    setOverlayOpacity]   = useState(HOLD_OVERLAY_OPACITY);

  // Debug display values (dev only)
  const [dbgTime, setDbgTime] = useState(0);
  const [dbgDur,  setDbgDur]  = useState(0);

  const videoRef      = useRef<HTMLVideoElement>(null);
  const rafRef        = useRef<number | null>(null);
  const srcRef        = useRef('');                          // last src we set
  const durationsRef  = useRef<Record<string, number>>({});  // cached video durations
  const mfRef         = useRef<MFIndex>(0);
  const modeRef       = useRef<Mode>('hold');
  const lastScrollMs  = useRef(0);
  const inViewRef     = useRef(false);
  const containerRef             = useRef<HTMLDivElement>(null);
  const incomingStartedRef       = useRef(false);
  const overlayRestoreStartedRef = useRef(false);
  const skipNextUiHideRef        = useRef(false);
  const destinationFadeRef       = useRef(false);

  // Keep refs in sync with state for event-handler closures
  mfRef.current   = mainframeIndex;
  modeRef.current = mode;

  // ── setHoldMainframe ─────────────────────────────────────────────────────────
  // Loads the correct forward video, seeks to hold position, pauses.
  // The paused video frame IS the visual background — no images used.
  const setHoldMainframe = useCallback((mf: MFIndex) => {
    const vid = videoRef.current;
    if (!vid) return;

    const holdSrc = getHoldVideoForMainframe(mf);

    const apply = () => {
      durationsRef.current[holdSrc] = vid.duration;
      const holdTime = getHoldTimeForMainframe(mf, durationsRef.current);
      vid.currentTime = holdTime;
      vid.pause();
      setMainframeIndex(mf);
      setMode('hold');
      setDirection(null);
      setIsTransitioning(false);
      setTransitionProgress(0);
      setActiveVideoSrc(holdSrc);
      setOverlayOpacity(HOLD_OVERLAY_OPACITY);
      destinationFadeRef.current = false;
      requestAnimationFrame(() => setUiVisible(true));
    };

    if (!skipNextUiHideRef.current) {
      setUiVisible(false);
    }
    skipNextUiHideRef.current = false;

    if (srcRef.current !== holdSrc) {
      srcRef.current = holdSrc;
      vid.src = holdSrc;
      vid.load();
      vid.addEventListener('loadedmetadata', apply, { once: true });
    } else if (isFinite(vid.duration) && vid.duration > 0) {
      apply();
    } else {
      vid.addEventListener('loadedmetadata', apply, { once: true });
    }
  }, []);

  // ── startTransition ──────────────────────────────────────────────────────────
  const startTransition = useCallback((mf: MFIndex, dir: 'forward' | 'backward') => {
    const vid = videoRef.current;
    if (!vid) return;

    const trans = dir === 'forward' ? getForwardTransition(mf) : getBackwardTransition(mf);
    if (!trans) return;

    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    setUiVisible(false);
    setOverlayOpacity(TRANSITION_OVERLAY_OPACITY);
    setMode('transition');
    setDirection(dir);
    setIsTransitioning(true);
    setTransitionProgress(0);
    setActiveVideoSrc(trans.src);

    // Reset per-transition flags
    incomingStartedRef.current       = false;
    overlayRestoreStartedRef.current = false;

    if (srcRef.current !== trans.src) {
      srcRef.current = trans.src;
      vid.src = trans.src;
      vid.load();
    }
    vid.currentTime  = 0;
    vid.playbackRate = PLAYBACK_RATE;

    const monitor = () => {
      const v = videoRef.current;
      if (!v) return;

      let progress = 0;
      if (isFinite(v.duration) && v.duration > 0) {
        progress = v.currentTime / v.duration;
        setTransitionProgress(progress);
      }

      // ── Progress thresholds: trigger destination visuals early ───────────────
      if (!overlayRestoreStartedRef.current && progress >= DESTINATION_OVERLAY_FADE_START_PROGRESS) {
        overlayRestoreStartedRef.current = true;
        setOverlayOpacity(HOLD_OVERLAY_OPACITY);
      }
      if (!incomingStartedRef.current && progress >= DESTINATION_UI_FADE_START_PROGRESS) {
        incomingStartedRef.current = true;
        destinationFadeRef.current = true;
        // Switch content to destination and start fade-in while video still plays
        setMainframeIndex(trans.target);
        requestAnimationFrame(() => setUiVisible(true));
        // For backward: tell setHoldMainframe not to hide the UI we just showed
        if (dir === 'backward') {
          skipNextUiHideRef.current = true;
        }
      }

      const done = v.ended || (
        isFinite(v.duration) && v.duration > 0 &&
        v.currentTime >= v.duration - END_OFFSET
      );
      if (done) {
        v.pause();
        rafRef.current = null;
        if (dir === 'forward') {
          // Forward video paused at endpoint — finalize hold state
          durationsRef.current[trans.src] = v.duration;
          if (!incomingStartedRef.current) {
            // Early trigger didn't fire (very short video) — do it now
            setMainframeIndex(trans.target);
            setOverlayOpacity(HOLD_OVERLAY_OPACITY);
            requestAnimationFrame(() => setUiVisible(true));
          }
          setMode('hold');
          setDirection(null);
          setIsTransitioning(false);
          setTransitionProgress(0);
        } else {
          // Backward: reverse video done → switch to correct forward hold video
          setHoldMainframe(trans.target);
        }
      } else {
        rafRef.current = requestAnimationFrame(monitor);
      }
    };

    vid.play()
      .then(() => { rafRef.current = requestAnimationFrame(monitor); })
      .catch(() => { setHoldMainframe(trans.target); });
  }, [setHoldMainframe]);

  // ── Nav jump — instant, no transition video ───────────────────────────────────
  const jumpTo = useCallback((mf: MFIndex) => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    videoRef.current?.pause();
    setHoldMainframe(mf);
  }, [setHoldMainframe]);

  // ── Scroll / trackpad intent ──────────────────────────────────────────────────
  const handleIntent = useCallback((deltaY: number) => {
    if (!inViewRef.current) return;
    if (modeRef.current === 'transition') return;
    const now = Date.now();
    if (now - lastScrollMs.current < SCROLL_COOLDOWN_MS) return;
    const dir  = deltaY > 0 ? 'forward' : 'backward';
    const from = mfRef.current;
    if (dir === 'forward'  && from >= 3) return;
    if (dir === 'backward' && from <= 0) return;
    lastScrollMs.current = now;
    startTransition(from, dir);
  }, [startTransition]);

  // ── Event listeners ───────────────────────────────────────────────────────────
  useEffect(() => {
    const onWheel = (e: WheelEvent) => { if (inViewRef.current) { e.preventDefault(); handleIntent(e.deltaY); } };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [handleIntent]);

  useEffect(() => {
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTouchEnd   = (e: TouchEvent) => {
      const dy = startY - e.changedTouches[0].clientY;
      if (Math.abs(dy) >= 40) handleIntent(dy);
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend',   onTouchEnd,   { passive: false });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend',   onTouchEnd);
    };
  }, [handleIntent]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!inViewRef.current) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); handleIntent(1); }
      if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); handleIntent(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleIntent]);

  // ── IntersectionObserver ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { inViewRef.current = e.isIntersecting; }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Visibility change — pause gracefully if tab hides during transition ───────
  useEffect(() => {
    const onHide = () => {
      if (!document.hidden) return;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      videoRef.current?.pause();
      if (modeRef.current === 'transition') {
        setMode('hold');
        setIsTransitioning(false);
        setOverlayOpacity(HOLD_OVERLAY_OPACITY);
        setUiVisible(true);
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // ── Initial hold on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    setHoldMainframe(0);
  }, [setHoldMainframe]);

  // ── RAF cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── Debug ticker (dev only) ───────────────────────────────────────────────────
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    let raf: number;
    const tick = () => {
      const v = videoRef.current;
      if (v) { setDbgTime(v.currentTime); setDbgDur(isFinite(v.duration) ? v.duration : 0); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────────────
  const ActiveMF = MF_VIEWS[mainframeIndex];
  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100svh', overflow: 'hidden', background: '#050505' }}
    >
      {/* ── Layer 1: fullscreen video — always present, always covering ── */}
      <video
        ref={videoRef}
        preload="auto"
        muted
        playsInline
        disablePictureInPicture
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', objectFit: 'cover',
          zIndex: 1, pointerEvents: 'none',
        }}
      />

      {/* ── Layer 2: milky/dark veil — fades between hold and transition ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
        background: 'rgba(255,252,244,1)',
        opacity: overlayOpacity,
        transition: `opacity ${OVERLAY_FADE_MS}ms ease`,
      }} />

      {/* ── Layer 3: programmed mainframe UI — fades in on the paused video frame ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5,
        opacity: uiVisible ? 1 : 0,
        transition: uiVisible
          ? `opacity ${destinationFadeRef.current ? DESTINATION_UI_FADE_IN_MS : UI_FADE_IN_MS}ms ease ${destinationFadeRef.current ? 0 : UI_FADE_IN_DELAY_MS}ms`
          : `opacity ${UI_FADE_OUT_MS}ms ease`,
        pointerEvents: uiVisible ? 'auto' : 'none',
      }}>
        <ActiveMF />
      </div>

      {/* ── Layer 4: navigation — always visible ── */}
      <TopNav onJump={jumpTo} />

      {/* ── Dev debug panel ── */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute', bottom: 10, left: 10, zIndex: 9999,
          background: 'rgba(0,0,0,0.84)', color: '#00ff88',
          fontFamily: 'monospace', fontSize: 11, lineHeight: 1.9,
          padding: '8px 14px', borderRadius: 7,
          border: '1px solid rgba(0,255,136,0.18)',
          pointerEvents: 'none',
        }}>
          <div>mainframeIndex:    {mainframeIndex}</div>
          <div>mode:              {mode}</div>
          <div>direction:         {direction ?? '—'}</div>
          <div>isTransitioning:   {String(isTransitioning)}</div>
          <div>activeVideoSrc:    {activeVideoSrc.split('/').pop() ?? '—'}</div>
          <div>video currentTime: {dbgTime.toFixed(3)}</div>
          <div>video duration:    {dbgDur.toFixed(3)}</div>
          <div>progress:          {(transitionProgress * 100).toFixed(1)}%</div>
        </div>
      )}
    </div>
  );
}
