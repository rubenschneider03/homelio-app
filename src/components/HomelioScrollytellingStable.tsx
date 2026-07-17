'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { HeaderAuthButton } from '@/components/landing/HeaderAuthButton';

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────
const END_OFFSET         = 0.05;
const PLAYBACK_RATE      = 1.35;
const SCROLL_COOLDOWN_MS = 1000;
const GOLD               = '#C9A84C';
const SHOW_DEBUG         = false;

// ── Overlay / animation constants (edit freely) ───────────────────────────────
const HOLD_OVERLAY_OPACITY                  = 0.38;  // milky veil strength in hold mode
const TRANSITION_OVERLAY_OPACITY            = 0.08;  // veil nearly gone while video plays
const UI_FADE_OUT_MS                        = 1200;  // UI fades out at transition start
const UI_FADE_IN_MS                         = 1400;  // UI fades in for nav-jump arrivals
const OVERLAY_FADE_MS                       = 1300;  // overlay crossfade duration
const UI_FADE_IN_DELAY_MS                   = 300;   // extra pause before UI appears on arrival
const DESTINATION_UI_FADE_START_PROGRESS    = 0.78;  // when destination UI starts fading in
const DESTINATION_UI_FADE_IN_MS            = 1500;  // duration of destination UI fade-in
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
  const glassPill = {
    pointerEvents: 'auto' as const,
    alignItems: 'center' as const,
    gap: 2,
    borderRadius: 999,
    background: 'rgba(20,16,8,0.44)',
    backdropFilter: 'blur(28px) saturate(1.8)',
    border: '1px solid rgba(255,255,255,0.20)',
    boxShadow: '0 2px 16px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
  };
  return (
    <div
      className="top-[0px] md:top-[20px]"
      style={{
        position: 'absolute', left: 0, right: 0, zIndex: 100,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none',
      }}
    >
      {/* Mobile: gold wordmark above compact pill — hidden on desktop */}
      <div className="flex flex-col md:hidden" style={{ width: '100%', gap: 0, alignItems: 'center' }}>
        <button
          onClick={() => onJump(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            pointerEvents: 'auto',
          }}
        >
          <img src="/logo/homelio-logo-name.png" alt="Homelio" style={{ height: 56, maxWidth: 450, objectFit: 'contain', display: 'block' }} />
        </button>
        <nav style={{ display: 'flex', ...glassPill, padding: '4px 5px', alignSelf: 'center' }}>
          <button onClick={() => onJump(1)} style={{
            padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 400, borderRadius: 999, color: 'rgba(255,255,255,0.82)',
          }}>Konzept</button>
          <button onClick={() => onJump(2)} style={{
            padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 400, borderRadius: 999, color: 'rgba(255,255,255,0.82)',
          }}>Finden</button>
          <button onClick={() => onJump(3)} style={{
            padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 400, borderRadius: 999, color: 'rgba(255,255,255,0.82)',
          }}>Angebote</button>
          <HeaderAuthButton style={{
            marginLeft: 4, padding: '6px 14px', borderRadius: 999,
            background: GOLD, color: '#0C0A06',
            fontSize: 12, fontWeight: 500, textDecoration: 'none',
            whiteSpace: 'nowrap', letterSpacing: '0.01em',
          }} />
        </nav>
      </div>

      {/* Desktop: wordmark above pill — hidden on mobile */}
      <div className="hidden md:flex flex-col items-center" style={{ gap: 4 }}>
        <button
          onClick={() => onJump(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            pointerEvents: 'auto',
          }}
        >
          <img src="/logo/homelio-logo-name.png" alt="Homelio" style={{ height: 95, maxWidth: 700, objectFit: 'contain', display: 'block' }} />
        </button>
        <nav style={{ display: 'flex', ...glassPill, padding: '5px 6px' }}>
          <button onClick={() => onJump(1)} style={navBtnStyle()}>Konzept</button>
          <button onClick={() => onJump(2)} style={navBtnStyle()}>Wohnung finden</button>
          <button onClick={() => onJump(3)} style={navBtnStyle()}>Angebote</button>
          <HeaderAuthButton style={{
            marginLeft: 6, padding: '7px 18px', borderRadius: 999,
            background: GOLD, color: '#0C0A06',
            fontSize: 13, fontWeight: 500, textDecoration: 'none',
            whiteSpace: 'nowrap', letterSpacing: '0.01em',
          }} />
        </nav>
      </div>
    </div>
  );
}

function navBtnStyle(weight = 400) {
  return {
    padding: '7px 14px', background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: weight, borderRadius: 999, color: weight === 600
      ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.82)',
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
  'Vertraulich: Ihre Verwaltung erfährt nichts von Ihrer Suche.',
  'Datenschutzkonform nach Schweizer Standards.',
  'Keine Weitergabe. Keine Werbung. Kein Spam.',
] as const;

// Distinct icon per trust point — eye-off / shield+check / blocked circle
const TRUST_ICONS = [
  /* 0 — confidential search / eye crossed out */
  <svg key="eyeoff" width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M1.8 8c1.3-2.3 3.5-3.8 6.2-3.8 1 0 1.9.2 2.7.6M14.2 8c-1.3 2.3-3.5 3.8-6.2 3.8-1 0-1.9-.2-2.7-.6"
      stroke={GOLD} strokeWidth="1.1" strokeLinecap="round" />
    <circle cx="8" cy="8" r="1.9" stroke={GOLD} strokeWidth="1.1" />
    <path d="M3 13.2L13 2.8" stroke={GOLD} strokeWidth="1.1" strokeLinecap="round" />
  </svg>,
  /* 1 — Swiss compliance / shield + checkmark */
  <svg key="shield" width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M8 1.5L14 4.2v4c0 3.2-2.5 5.5-6 6.3C4.5 13.7 2 11.4 2 8.2v-4L8 1.5z"
      stroke={GOLD} strokeWidth="1.1" strokeLinejoin="round" />
    <path d="M5.5 8l2 2 3-3.5" stroke={GOLD} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  /* 2 — no sharing / no spam / blocked */
  <svg key="blocked" width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="6" stroke={GOLD} strokeWidth="1.1" />
    <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke={GOLD} strokeWidth="1.1" strokeLinecap="round" />
  </svg>,
];

function MF0Content() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Vignette stops="rgba(4,3,2,0.68) 0%, rgba(4,3,2,0.38) 26%, rgba(4,3,2,0.08) 55%, transparent 76%" />

      {/* MF0-only left readability gradient */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to right, rgba(4,3,2,0.54) 0%, rgba(4,3,2,0.40) 22%, rgba(4,3,2,0.20) 46%, rgba(4,3,2,0.07) 62%, transparent 76%)',
      }} />

      {/* Mobile-only contrast overlay */}
      <div className="block md:hidden" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'rgba(4,3,2,0.22)',
      }} />

      {/* Left text block — mobile: fixed top; desktop: vertically centered at 53% */}
      <div
        className="flex flex-col justify-center bottom-0 top-[90px] md:top-[53%] md:bottom-auto md:block md:-translate-y-1/2"
        style={{
          position: 'absolute',
          left: 'clamp(20px, 9vw, 148px)',
          maxWidth: 'min(540px, calc(100vw - 40px))',
        }}
      >
        <h1
          className="mb-[12px] md:mb-[24px]"
          style={{
            fontSize: 'clamp(28px, 5.5vw, 78px)', fontWeight: 300, lineHeight: 1.12,
            color: 'rgba(255,252,244,0.95)', marginTop: 0,
            fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
          }}
        >
          Sie überlegen umzuziehen?
        </h1>

        <p
          className="mb-[16px] md:mb-[32px]"
          style={{
            fontSize: 'clamp(13px, 1.4vw, 17px)', fontWeight: 300, lineHeight: 1.76,
            color: 'rgba(255,252,244,0.94)', marginTop: 0, maxWidth: 430,
          }}
        >
          Registrieren Sie sich kostenlos und erhalten Sie persönliche Wohnungsangebote,
          bevor sie öffentlich ausgeschrieben sind – ohne direkten Konkurrenzdruck.
          Ihre Daten bleiben vertraulich und datenschutzkonform geschützt.
        </p>

        {/* CTA */}
        <a
          href="/anmelden"
          className="inline-flex items-center text-[12px] md:text-[15px] py-[10px] px-[20px] md:py-[14px] md:px-[30px] whitespace-nowrap self-start"
          style={{
            gap: 8, borderRadius: 999,
            background: GOLD, color: '#0C0A06',
            fontWeight: 500, textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          Jetzt unverbindlich Angebote erhalten <span aria-hidden>→</span>
        </a>

        {/* Trust points */}
        <div className="mt-[20px] md:mt-[30px] gap-[8px] md:gap-[12px]" style={{ display: 'flex', flexDirection: 'column' }}>
          {TRUST_POINTS.map((t, i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              {TRUST_ICONS[i]}
              <span style={{ fontSize: 'clamp(12px, 1.2vw, 14px)', color: 'rgba(255,252,244,0.92)', lineHeight: 1.4 }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Mobile-only stat card — centered below trust bullets */}
        <div className="flex md:hidden" style={{ marginTop: 14 }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '8px 18px', borderRadius: 14,
            background: 'rgba(18,14,7,0.52)',
            border: '1px solid rgba(255,255,255,0.16)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M2 9.5L10 3l8 6.5V19H13v-5.5H7V19H2V9.5z"
                stroke={GOLD} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 22, fontWeight: 300, color: 'rgba(255,252,244,0.95)', lineHeight: 1.05, marginTop: 2 }}>450</span>
            <span style={{ fontSize: 11, color: 'rgba(255,252,244,0.88)', textAlign: 'center', lineHeight: 1.55 }}>aktuelle<br />Wohnchancen</span>
          </div>
        </div>
      </div>

      {/* Stat card — bottom-aligned with trust points (desktop only) */}
      <div className="hidden md:flex" style={{
        position: 'absolute',
        bottom: 'clamp(100px, 26vh, 310px)',
        right: 'clamp(88px, 12vw, 172px)',
        flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '30px 42px', borderRadius: 24,
        background: 'rgba(18,14,7,0.52)',
        border: '1px solid rgba(255,255,255,0.16)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2 9.5L10 3l8 6.5V19H13v-5.5H7V19H2V9.5z"
            stroke={GOLD} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
        </svg>
        <span style={{
          fontSize: 42, fontWeight: 300, color: 'rgba(255,252,244,0.95)',
          lineHeight: 1.05, marginTop: 10,
        }}>450</span>
        <span style={{
          fontSize: 14, color: 'rgba(255,252,244,0.88)',
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
    <svg
      width="490" height="450" viewBox="0 0 326 300"
      className="max-w-[220px] xl:max-w-none"
      style={{ overflow: 'visible', display: 'block', width: 'min(490px, 100%)', height: 'auto' }}
    >
      <defs>
        <marker id="mw" markerWidth="8" markerHeight="8" refX="6" refY="3.5" orient="auto">
          <path d="M0 1.2 L6 3.5 L0 5.8" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.2" />
        </marker>
        <marker id="mg" markerWidth="8" markerHeight="8" refX="6" refY="3.5" orient="auto">
          <path d="M0 1.2 L6 3.5 L0 5.8" fill="none" stroke={GOLD} strokeWidth="1.2" />
        </marker>
        <marker id="mg-rev" markerWidth="8" markerHeight="8" refX="6" refY="3.5" orient="auto-start-reverse">
          <path d="M0 1.2 L6 3.5 L0 5.8" fill="none" stroke={GOLD} strokeWidth="1.2" />
        </marker>
      </defs>

      {/* White arrows: Wohnungssuchende → Wohnungsmarkt */}
      <line x1={a1.x1} y1={a1.y1} x2={a1.x2} y2={a1.y2}
        stroke="rgba(255,255,255,0.58)" strokeWidth="1.5" markerEnd="url(#mw)" />
      <line x1={a2.x1} y1={a2.y1} x2={a2.x2} y2={a2.y2}
        stroke="rgba(255,255,255,0.58)" strokeWidth="1.5" markerEnd="url(#mw)" />

      {/* Gold Homelio curve connecting the two small circles — bidirectional */}
      <path d={curveD} fill="none" stroke={GOLD} strokeWidth="1.8"
        markerStart="url(#mg-rev)" markerEnd="url(#mg)" />

      {/* "Homelio" label — beside the gold curve, clear of the path */}
      <text x="44" y="145" textAnchor="start" fill={GOLD} fontSize="10" fontWeight="500" opacity="0.88"
        style={{ letterSpacing: '0.06em' }}>
        Homelio
      </text>

      {/* Large circle — Wohnungsmarkt */}
      <circle cx={lcx} cy={lcy} r={lr}
        fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.36)" strokeWidth="1.8" />
      <text x={lcx} y={lcy - 6} fill="rgba(255,255,255,0.90)" fontSize="14"
        textAnchor="middle" fontWeight="400">Wohnungs-</text>
      <text x={lcx} y={lcy + 11} fill="rgba(255,255,255,0.90)" fontSize="14"
        textAnchor="middle" fontWeight="400">markt</text>

      {/* Small circle upper */}
      <circle cx={s1x} cy={s1y} r={sr}
        fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.30)" strokeWidth="1.6" />
      <text x={s1x} y={s1y - 4} fill="rgba(255,255,255,0.78)" fontSize="11" textAnchor="middle">Wohnungs-</text>
      <text x={s1x} y={s1y + 10} fill="rgba(255,255,255,0.78)" fontSize="11" textAnchor="middle">suchende</text>

      {/* Small circle lower */}
      <circle cx={s2x} cy={s2y} r={sr}
        fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.30)" strokeWidth="1.6" />
      <text x={s2x} y={s2y - 4} fill="rgba(255,255,255,0.78)" fontSize="11" textAnchor="middle">Wohnungs-</text>
      <text x={s2x} y={s2y + 10} fill="rgba(255,255,255,0.78)" fontSize="11" textAnchor="middle">suchende</text>
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
      <Vignette stops="rgba(4,3,2,0.90) 0%, rgba(4,3,2,0.60) 32%, rgba(4,3,2,0.18) 62%, transparent 82%" />

      {/* Left readability gradient */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to right, rgba(4,3,2,0.68) 0%, rgba(4,3,2,0.52) 22%, rgba(4,3,2,0.26) 46%, rgba(4,3,2,0.09) 62%, transparent 76%)',
      }} />

      <div
        className="flex-col items-center justify-center xl:flex-row md:items-center xl:justify-between pt-[100px] md:pt-[120px] pb-[24px] md:pb-[clamp(54px,7vh,82px)]"
        style={{
          position: 'absolute', inset: 0,
          display: 'flex',
          paddingLeft: 'clamp(20px,9vw,148px)',
          paddingRight: 'clamp(20px,6vw,96px)',
          gap: 'clamp(10px, 2vw, 60px)',
        }}
      >
        {/* Left: text */}
        <div className="w-full xl:w-auto xl:flex-[1_1_380px]" style={{ maxWidth: 500 }}>
          <p className="hidden md:block" style={{
            fontSize: 10, letterSpacing: '0.34em', textTransform: 'uppercase',
            color: GOLD, opacity: 0.85, margin: '0 0 16px',
          }}>KONZEPT</p>

          <h2
            className="mb-[10px] md:mb-[24px]"
            style={{
              fontSize: 'clamp(20px, 3.4vw, 54px)', fontWeight: 300, lineHeight: 1.10,
              color: 'rgba(255,252,244,0.96)', marginTop: 0,
              fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
            }}
          >
            Wenn sich das Leben verändert, verändert sich auch die Wohnung.
          </h2>

          {MF1_BODY.map((p, i) => (
            <p key={i} className="mb-[8px] md:mb-[14px] leading-[1.5] md:leading-[1.75]" style={{
              fontSize: 'clamp(11px, 1.2vw, 16px)', fontWeight: 300,
              color: 'rgba(255,252,244,0.86)', marginTop: 0, marginLeft: 0, marginRight: 0, maxWidth: 450,
            }}>{p}</p>
          ))}
        </div>

        {/* Right: glass card with SVG diagram */}
        <div
          className="xl:w-auto"
          style={{
            flex: '0 0 auto',
            padding: 'clamp(10px,2.5vw,36px) clamp(12px,2vw,32px)',
            borderRadius: 'clamp(14px,2vw,24px)',
            background: 'rgba(18,14,7,0.52)',
            border: '1px solid rgba(255,255,255,0.16)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
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
    n: '4', title: 'Verwaltung der neuen Wohnung prüft',
    body: 'Wir schlagen Ihr Interesse der Verwaltung der neuen Wohnung vor. Wenn diese zustimmt, wird der nächste Schritt vorbereitet.',
  },
  {
    n: '5', title: 'Besichtigung & Vertragsabschluss',
    body: 'Sie besichtigen die Wohnung und schliessen den Vertrag direkt mit der Verwaltung ab.',
  },
] as const;

function MF2Content() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Vignette stops="rgba(4,3,2,0.90) 0%, rgba(4,3,2,0.60) 32%, rgba(4,3,2,0.18) 62%, transparent 82%" />

      {/* Left readability gradient */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to right, rgba(4,3,2,0.68) 0%, rgba(4,3,2,0.52) 22%, rgba(4,3,2,0.26) 46%, rgba(4,3,2,0.09) 62%, transparent 76%)',
      }} />

      <div
        className="flex flex-col justify-center md:flex-row md:items-center md:justify-between pb-7 md:pb-[clamp(54px,7vh,82px)]"
        style={{
          position: 'absolute', inset: 0,
          paddingTop: 'clamp(82px, 13vh, 136px)',
          paddingLeft: 'clamp(20px,9vw,148px)',
          paddingRight: 'clamp(20px,6vw,96px)',
          gap: 'clamp(10px, 4vw, 60px)',
        }}
      >
        {/* Left: label + headline + intro */}
        <div className="w-full md:w-auto md:flex-[1_1_300px]" style={{ maxWidth: 420, minWidth: 0 }}>
          <p className="hidden md:block" style={{
            fontSize: 10, letterSpacing: '0.34em', textTransform: 'uppercase',
            color: GOLD, opacity: 0.85, margin: '0 0 16px',
          }}>MATCHING</p>
          <h2
            className="mb-[10px] md:mb-[24px]"
            style={{
              fontSize: 'clamp(22px, 4.6vw, 64px)', fontWeight: 300, lineHeight: 1.09,
              color: 'rgba(255,252,244,0.96)', marginTop: 0,
              fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
            }}
          >Intelligent verbunden.</h2>
          <p
            className="mb-[10px] md:mb-[24px]"
            style={{
              fontSize: 'clamp(13px, 1.6vw, 16px)', fontWeight: 300, lineHeight: 1.75,
              color: 'rgba(255,252,244,0.82)', marginTop: 0, maxWidth: 360,
            }}
          >
            In wenigen Schritten vom Wohnprofil zur passenden Wohnung.
          </p>
          <p style={{
            fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 300, lineHeight: 1.60,
            color: 'rgba(255,252,244,0.60)', margin: 0, maxWidth: 340,
          }}>
            Homelio begleitet den Ablauf strukturiert: vom Erfassen Ihres Wohnprofils
            über das intelligente Matching bis zur Besichtigung und zum Vertragsabschluss.
          </p>
        </div>

        {/* Right: vertical 5-step cards */}
        <div className="w-full md:w-auto" style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', maxWidth: 380, minWidth: 0 }}>
          {STEPS.map((step, i) => (
            <div key={step.n}>
              <div style={{
                padding: 'clamp(6px,1.2vw,11px) clamp(10px,1.3vw,14px)', borderRadius: 12,
                background: i === 0 ? 'rgba(18,14,7,0.64)' : 'rgba(18,14,7,0.44)',
                border: i === 0 ? '1px solid rgba(201,168,76,0.32)' : '1px solid rgba(255,255,255,0.12)',
                boxShadow: i === 0 ? '0 4px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(201,168,76,0.10)' : '0 2px 12px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.05)',
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
                      fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 500,
                      color: 'rgba(255,255,255,0.90)', marginBottom: 3,
                    }}>{step.title}</div>
                    <div style={{
                      fontSize: 'clamp(10px, 1.0vw, 12px)', fontWeight: 300, lineHeight: 1.55,
                      color: 'rgba(255,252,244,0.72)',
                    }}>{step.body}</div>
                  </div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ display: 'flex', paddingLeft: 21, height: 'clamp(5px, 1.0vw, 11px)', alignItems: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <line x1="5" y1="0" x2="5" y2="7" stroke="rgba(255,255,255,0.20)" strokeWidth="1.2" />
                    <path d="M2 5l3 3 3-3" stroke="rgba(255,255,255,0.20)" strokeWidth="1.2"
                      fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
          <p style={{
            fontSize: 'clamp(10px, 1.0vw, 12px)', fontWeight: 300, lineHeight: 1.55,
            color: 'rgba(255,252,244,0.62)', margin: '10px 0 0', maxWidth: 360,
          }}>
            Sie entscheiden selbst, ob und wann Sie ein Angebot weiterverfolgen.
            Ihre aktuelle Wohnung wird nicht automatisch gekündigt.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mainframe 4 — MF3  (Video_3 paused at its endpoint)
// ─────────────────────────────────────────────────────────────────────────────

function MF3Content() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Vignette stops="rgba(4,3,2,0.92) 0%, rgba(4,3,2,0.64) 30%, rgba(4,3,2,0.18) 60%, transparent 80%" />

      {/* Left readability gradient */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to right, rgba(4,3,2,0.68) 0%, rgba(4,3,2,0.52) 22%, rgba(4,3,2,0.26) 46%, rgba(4,3,2,0.09) 62%, transparent 76%)',
      }} />

      {/* Left text + CTA */}
      <div
        className="top-[50%] -translate-y-1/2 md:top-[53%]"
        style={{
          position: 'absolute',
          left: 'clamp(20px, 9vw, 148px)',
          maxWidth: 'min(520px, calc(100vw - 40px))',
        }}
      >
        <p className="hidden md:block" style={{
          fontSize: 10, letterSpacing: '0.34em', textTransform: 'uppercase',
          color: GOLD, opacity: 0.85, margin: '0 0 16px',
        }}>ANGEBOTE</p>
        <h2
          className="mb-[12px] md:mb-[24px]"
          style={{
            fontSize: 'clamp(22px, 4.6vw, 64px)', fontWeight: 300, lineHeight: 1.10,
            color: 'rgba(255,252,244,0.96)', marginTop: 0,
            fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
          }}
        >
          Persönliche Angebote.<br />Früh und passend.
        </h2>
        <p
          className="mb-[12px] md:mb-[24px]"
          style={{
            fontSize: 'clamp(13px, 1.4vw, 16px)', fontWeight: 300, lineHeight: 1.75,
            color: 'rgba(255,252,244,0.86)', marginTop: 0, maxWidth: 460,
          }}
        >
          Erhalten Sie persönliche Angebote, bevor Wohnungen öffentlich ausgeschrieben
          werden – diskret, passend und ohne den üblichen Konkurrenzdruck.
        </p>
        <p
          className="mb-[16px] md:mb-[32px]"
          style={{
            fontSize: 'clamp(12px, 1.2vw, 14px)', fontWeight: 300, lineHeight: 1.65,
            color: 'rgba(255,252,244,0.62)', marginTop: 0, maxWidth: 420,
          }}
        >
          Einmal registrieren genügt. Homelio informiert Sie, sobald eine passende
          Wohnchance entsteht.
        </p>
        <a
          href="/anmelden"
          className="inline-flex items-center text-[12px] md:text-[15px] py-[10px] px-[20px] md:py-[14px] md:px-[30px] whitespace-nowrap"
          style={{
            gap: 8, borderRadius: 999,
            background: GOLD, color: '#0C0A06',
            fontWeight: 500, textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          Jetzt unverbindlich Angebote erhalten <span aria-hidden>→</span>
        </a>
        <p style={{
          fontSize: 'clamp(11px, 1.1vw, 13px)', fontWeight: 300, lineHeight: 1.5,
          color: 'rgba(255,252,244,0.62)', margin: '12px 0 0', maxWidth: 420,
        }}>
          Unverbindlich und vertraulich – Ihre Verwaltung wird nicht informiert.
        </p>
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
    let singleTouchStarted = false;
    // Ignore multi-touch (pinch zoom) — only track single-finger swipes.
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) { singleTouchStarted = false; return; }
      singleTouchStarted = true;
      startY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!singleTouchStarted) return;
      singleTouchStarted = false;
      const dy = startY - e.changedTouches[0].clientY;
      if (Math.abs(dy) >= 40) handleIntent(dy);
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend',   onTouchEnd,   { passive: true });
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
      style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: '#050505' }}
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

      {/* ── Layer 2.5: cinematic blur — Frames 2/3/4 only, fades with UI ── */}
      {mainframeIndex !== 0 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
          backdropFilter: 'blur(4px) saturate(1.1)',
          opacity: uiVisible ? 1 : 0,
          transition: uiVisible
            ? `opacity ${destinationFadeRef.current ? DESTINATION_UI_FADE_IN_MS : UI_FADE_IN_MS}ms ease ${destinationFadeRef.current ? 0 : UI_FADE_IN_DELAY_MS}ms`
            : `opacity ${UI_FADE_OUT_MS}ms ease`,
        }} />
      )}

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

      {/* ── Layer 3.5: mobile top contrast gradient — logo readability, always visible ── */}
      <div
        className="block md:hidden"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 190, zIndex: 10, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(255,252,244,0.34) 0%, rgba(255,252,244,0.24) 42px, rgba(255,252,244,0.13) 92px, rgba(4,3,2,0.06) 135px, transparent 190px)',
        }}
      />
      {/* ── Layer 3.5: desktop top contrast gradient — logo readability, always visible ── */}
      <div
        className="hidden md:block"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 210, zIndex: 10, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(255,252,244,0.24) 0%, rgba(255,252,244,0.16) 55px, rgba(255,252,244,0.08) 125px, transparent 210px)',
        }}
      />

      {/* ── Layer 4: navigation — always visible ── */}
      <TopNav onJump={jumpTo} />

      {/* ── Dev debug panel ── */}
      {SHOW_DEBUG && process.env.NODE_ENV === 'development' && (
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
