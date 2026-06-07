'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
//  Config
// ─────────────────────────────────────────────────────────────────────────────
const PLAYBACK_RATE      = 1.35;   // video speed multiplier
const SCROLL_COOLDOWN_MS = 700;    // ms between scroll triggers
const END_OFFSET         = 0.05;   // seconds before duration to stop & hold
const GOLD               = '#C9A84C';

// ── Media paths ───────────────────────────────────────────────────────────────
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

// ── Types ─────────────────────────────────────────────────────────────────────
type MFIndex = 0 | 1 | 2 | 3;
type Mode    = 'hold' | 'transition';
type Dir     = 'forward' | 'backward' | null;

// ── Hold config: which forward video + where to seek for each mainframe ───────
// MF0 → Video_1 at t=0   (start frame)
// MF1 → Video_1 at end   (Video_1 endpoint)
// MF2 → Video_2 at end   (Video_2 endpoint)
// MF3 → Video_3 at end   (Video_3 endpoint)
const HOLD_CFG: Record<MFIndex, { src: string; atStart: boolean }> = {
  0: { src: FWD_VIDEOS[0], atStart: true  },
  1: { src: FWD_VIDEOS[0], atStart: false },
  2: { src: FWD_VIDEOS[1], atStart: false },
  3: { src: FWD_VIDEOS[2], atStart: false },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Navigation
// ─────────────────────────────────────────────────────────────────────────────
function TopNav({ onJump }: { onJump: (mf: MFIndex) => void }) {
  return (
    <div style={{
      position: 'absolute', top: 20, left: 0, right: 0,
      display: 'flex', justifyContent: 'center',
      zIndex: 100, pointerEvents: 'none',
    }}>
      <nav style={{
        pointerEvents: 'auto',
        display: 'flex', alignItems: 'center', gap: 2,
        padding: '6px 8px', borderRadius: 999,
        background: 'rgba(16,13,9,0.84)',
        backdropFilter: 'blur(20px) saturate(1.3)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
      }}>
        <NavBtn label="Homelio" onClick={() => onJump(0)} weight={600} />
        <NavSep />
        <NavBtn label="Konzept"        onClick={() => onJump(1)} />
        <NavBtn label="Wohnung finden" onClick={() => onJump(2)} />
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
function NavBtn({ label, onClick, weight = 400 }: { label: string; onClick: () => void; weight?: number }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', background: 'none', border: 'none', cursor: 'pointer',
      fontSize: 13, fontWeight: weight, borderRadius: 999, transition: 'color 0.15s',
      color: weight === 600 ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.54)',
      letterSpacing: weight === 600 ? '0.04em' : undefined,
    }}>{label}</button>
  );
}
function NavSep() {
  return <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.13)', flexShrink: 0, margin: '0 2px' }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Shared UI atoms
// ─────────────────────────────────────────────────────────────────────────────
function MFLabel({ text, gold }: { text: string; gold?: boolean }) {
  return (
    <p style={{
      fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', marginBottom: 20,
      color: gold ? GOLD : 'rgba(255,255,255,0.40)', opacity: gold ? 0.85 : 1,
    }}>{text}</p>
  );
}

function CTABtn({ label = 'Jetzt unverbindlich Angebote erhalten' }: { label?: string }) {
  return (
    <a href="/anmelden" style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '13px 28px', borderRadius: 999,
      background: GOLD, color: '#0C0A06',
      fontSize: 14, fontWeight: 500, textDecoration: 'none',
      letterSpacing: '0.01em', whiteSpace: 'nowrap',
    }}>
      {label} <span aria-hidden>→</span>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mainframe 1 — Entry
// ─────────────────────────────────────────────────────────────────────────────
const TRUST_POINTS = [
  'Ihre Daten bleiben vertraulich und geschützt.',
  'Datenschutzkonform nach Schweizer Standards.',
  'Keine Weitergabe. Keine Werbung. Kein Spam.',
] as const;

function MF0() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Milky veil unique to MF0 */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,252,244,0.08)', pointerEvents: 'none' }} />

      {/* Bottom gradient for text legibility */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(4,3,2,0.88) 0%, rgba(4,3,2,0.50) 30%, rgba(4,3,2,0.10) 58%, transparent 78%)',
      }} />

      {/* Left text block */}
      <div style={{
        position: 'absolute',
        left: 'clamp(32px, 5.5vw, 80px)',
        bottom: 'clamp(56px, 7vh, 88px)',
        maxWidth: 'min(520px, 48vw)',
      }}>
        <MFLabel text="Homelio" />
        <h1 style={{
          fontSize: 'clamp(38px, 5vw, 66px)', fontWeight: 300, lineHeight: 1.04,
          color: 'rgba(255,255,255,0.96)', marginBottom: 20,
          fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
        }}>
          Sie überlegen umzuziehen?
        </h1>
        <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', marginBottom: 8, maxWidth: 430 }}>
          Registrieren Sie sich einmal und erhalten Sie persönliche Wohnangebote,
          oft bevor sie öffentlich ausgeschrieben sind – ohne direkten Konkurrenzdruck.
        </p>
        <p style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.6, color: 'rgba(255,255,255,0.44)', marginBottom: 28, maxWidth: 400 }}>
          Ihre Daten bleiben vertraulich und datenschutzkonform geschützt.
        </p>
        <CTABtn />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginTop: 22 }}>
          {TRUST_POINTS.map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L10.5 3v3.5c0 2.3-1.9 4-4.5 4.5C3.4 10.5 1.5 8.8 1.5 6.5V3L6 1z"
                  stroke={GOLD} strokeWidth="1" fill="none" opacity="0.7" />
              </svg>
              <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.42)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat card — bottom right */}
      <div style={{
        position: 'absolute',
        right: 'clamp(32px, 5.5vw, 80px)',
        bottom: 'clamp(56px, 7vh, 88px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: '20px 26px', borderRadius: 18,
        background: 'rgba(255,255,255,0.055)',
        backdropFilter: 'blur(16px) saturate(1.2)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 9l7-6 7 6v9h-4.5v-5.5h-5V18H3V9z"
            stroke={GOLD} strokeWidth="1.3" fill="none" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 30, fontWeight: 300, color: 'rgba(255,255,255,0.93)', lineHeight: 1.1, marginTop: 4 }}>450</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', textAlign: 'center', lineHeight: 1.5 }}>aktuelle<br />Wohnchancen</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mainframe 2 — Concept + diagram
// ─────────────────────────────────────────────────────────────────────────────
function ConceptDiagram() {
  const bigCx = 252, bigCy = 148, bigR = 76;
  const s1Cx  = 66,  s1Cy  = 72,  sR  = 46;
  const s2Cx  = 66,  s2Cy  = 224;

  const a1dx = bigCx - s1Cx, a1dy = bigCy - s1Cy, a1L = Math.hypot(a1dx, a1dy);
  const a1x1 = s1Cx + (sR/a1L)*a1dx, a1y1 = s1Cy + (sR/a1L)*a1dy;
  const a1x2 = bigCx - (bigR/a1L)*a1dx, a1y2 = bigCy - (bigR/a1L)*a1dy;

  const a2dx = bigCx - s2Cx, a2dy = bigCy - s2Cy, a2L = Math.hypot(a2dx, a2dy);
  const a2x1 = s2Cx + (sR/a2L)*a2dx, a2y1 = s2Cy + (sR/a2L)*a2dy;
  const a2x2 = bigCx - (bigR/a2L)*a2dx, a2y2 = bigCy - (bigR/a2L)*a2dy;

  return (
    <svg width="340" height="308" viewBox="0 0 340 308" style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <marker id="aw" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,1 L5,3.5 L0,6" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.1" />
        </marker>
        <marker id="ag" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,1 L5,3.5 L0,6" fill="none" stroke={GOLD} strokeWidth="1.1" />
        </marker>
      </defs>
      <line x1={a1x1} y1={a1y1} x2={a1x2} y2={a1y2}
        stroke="rgba(255,255,255,0.52)" strokeWidth="1.4" markerEnd="url(#aw)" />
      <line x1={a2x1} y1={a2y1} x2={a2x2} y2={a2y2}
        stroke="rgba(255,255,255,0.52)" strokeWidth="1.4" markerEnd="url(#aw)" />
      <path d={`M ${s1Cx} ${s1Cy+sR} Q 12,${(s1Cy+s2Cy)/2} ${s2Cx} ${s2Cy-sR}`}
        fill="none" stroke={GOLD} strokeWidth="1.6" markerEnd="url(#ag)" />
      <text x="10" y={((s1Cy+s2Cy)/2)+4}
        fill={GOLD} fontSize="10.5" fontWeight="500" textAnchor="middle" style={{ letterSpacing: '0.04em' }}>
        Homelio
      </text>
      <circle cx={bigCx} cy={bigCy} r={bigR} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.36)" strokeWidth="1.8" />
      <text x={bigCx} y={bigCy-6} fill="rgba(255,255,255,0.88)" fontSize="12" textAnchor="middle">Wohnungs-</text>
      <text x={bigCx} y={bigCy+11} fill="rgba(255,255,255,0.88)" fontSize="12" textAnchor="middle">markt</text>
      <circle cx={s1Cx} cy={s1Cy} r={sR} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.30)" strokeWidth="1.6" />
      <text x={s1Cx} y={s1Cy-5} fill="rgba(255,255,255,0.78)" fontSize="9.5" textAnchor="middle">Wohnungs-</text>
      <text x={s1Cx} y={s1Cy+9} fill="rgba(255,255,255,0.78)" fontSize="9.5" textAnchor="middle">suchende</text>
      <circle cx={s2Cx} cy={s2Cy} r={sR} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.30)" strokeWidth="1.6" />
      <text x={s2Cx} y={s2Cy-5} fill="rgba(255,255,255,0.78)" fontSize="9.5" textAnchor="middle">Wohnungs-</text>
      <text x={s2Cx} y={s2Cy+9} fill="rgba(255,255,255,0.78)" fontSize="9.5" textAnchor="middle">suchende</text>
    </svg>
  );
}

function MF1() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(4,3,2,0.85) 0%, rgba(4,3,2,0.50) 35%, rgba(4,3,2,0.12) 62%, transparent 82%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center',
        padding: '88px clamp(32px,5.5vw,80px) 56px',
        gap: 'clamp(32px,5vw,72px)',
      }}>
        <div style={{ flex: '1 1 340px', maxWidth: 440 }}>
          <MFLabel text="Konzept" gold />
          <h2 style={{
            fontSize: 'clamp(26px,3.4vw,48px)', fontWeight: 300, lineHeight: 1.08,
            color: 'rgba(255,255,255,0.95)', marginBottom: 22,
            fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
          }}>
            Wenn sich das Leben verändert, verändert sich auch die Wohnung.
          </h2>
          {[
            'Ein Familienzuwachs, ein neuer Job oder veränderte Lebensumstände können dazu führen, dass man mehr Platz braucht. In anderen Situationen möchte man sich bewusst verkleinern.',
            'Homelio vernetzt diese Menschen frühzeitig und diskret – noch bevor Wohnungen offiziell ausgeschrieben werden.',
            'So entstehen passende Wechsel ohne unnötigen Konkurrenzdruck. Gemeinsam mit den Verwaltungen sorgt Homelio für einen reibungslosen Ablauf.',
          ].map((p, i) => (
            <p key={i} style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.68, color: 'rgba(255,255,255,0.56)', margin: '0 0 12px' }}>{p}</p>
          ))}
        </div>
        <div style={{
          flex: '0 0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '28px 32px', borderRadius: 20,
          background: 'rgba(255,255,255,0.045)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.09)',
        }}>
          <ConceptDiagram />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mainframe 3 — Matching / Process steps
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { n: '1', title: 'Anmelden',               body: 'Sie registrieren sich und hinterlegen Ihr Wohnprofil.' },
  { n: '2', title: 'AI-Matching',             body: 'Das Homelio AI-System sucht laufend nach passenden Wohnmöglichkeiten und erkennt relevante Treffer frühzeitig.' },
  { n: '3', title: 'Verbindlich akzeptieren', body: 'Wenn ein Vorschlag für Sie passt, akzeptieren Sie ihn verbindlich mit einem Klick.' },
  { n: '4', title: 'Verwaltung & Wechsel',   body: 'Wir schlagen Ihr Interesse der Verwaltung vor. Wenn diese zustimmt, kommt es zum Wohnungswechsel.' },
] as const;

function MF2() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(4,3,2,0.88) 0%, rgba(4,3,2,0.50) 35%, rgba(4,3,2,0.12) 62%, transparent 82%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center',
        padding: '88px clamp(32px,5.5vw,80px) 56px',
        gap: 'clamp(24px,4vw,64px)',
      }}>
        <div style={{ flex: '1 1 300px', maxWidth: 380 }}>
          <MFLabel text="Matching" gold />
          <h2 style={{
            fontSize: 'clamp(30px,4vw,54px)', fontWeight: 300, lineHeight: 1.07,
            color: 'rgba(255,255,255,0.95)', marginBottom: 16,
            fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
          }}>
            Intelligent verbunden.
          </h2>
          <p style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.7, color: 'rgba(255,255,255,0.58)', marginBottom: 0, maxWidth: 340 }}>
            Registrieren Sie sich und erhalten Sie persönliche Wohnangebote – diskret, passend und ohne Konkurrenzdruck.
          </p>
          <p style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.6, color: 'rgba(255,255,255,0.38)', marginTop: 16, maxWidth: 340 }}>
            So entsteht ein diskreter, effizienter und reibungsloser Ablauf – für Suchende und Verwaltungen.
          </p>
        </div>
        <div style={{ flex: '1 1 280px', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {STEPS.map((s, i) => (
            <div key={s.n}>
              <div style={{
                padding: '12px 14px', borderRadius: 12,
                background: i === 0 ? 'rgba(201,168,76,0.10)' : 'rgba(255,255,255,0.05)',
                border: i === 0 ? '1px solid rgba(201,168,76,0.28)' : '1px solid rgba(255,255,255,0.09)',
                backdropFilter: 'blur(10px)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600, marginTop: 1,
                    background: i === 0 ? GOLD : 'rgba(255,255,255,0.12)',
                    color: i === 0 ? '#0C0A06' : 'rgba(255,255,255,0.60)',
                  }}>{s.n}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.90)', marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: 12, fontWeight: 300, lineHeight: 1.55, color: 'rgba(255,255,255,0.50)' }}>{s.body}</div>
                  </div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ paddingLeft: 21, height: 10, display: 'flex', alignItems: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <line x1="5" y1="0" x2="5" y2="7" stroke="rgba(255,255,255,0.20)" strokeWidth="1.2"/>
                    <path d="M2 5l3 3 3-3" stroke="rgba(255,255,255,0.20)" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
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
//  Mainframe 4 — Offers / CTA
// ─────────────────────────────────────────────────────────────────────────────
function MF3() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(4,3,2,0.88) 0%, rgba(4,3,2,0.48) 30%, rgba(4,3,2,0.10) 58%, transparent 78%)',
      }} />
      <div style={{
        position: 'absolute',
        left: 'clamp(32px,5.5vw,80px)',
        bottom: 'clamp(56px,7vh,88px)',
        maxWidth: 520,
      }}>
        <MFLabel text="Angebote" gold />
        <h2 style={{
          fontSize: 'clamp(34px,4.5vw,58px)', fontWeight: 300, lineHeight: 1.06,
          color: 'rgba(255,255,255,0.95)', marginBottom: 18,
          fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
        }}>
          Persönliche Angebote.<br />Früh und passend.
        </h2>
        <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.70, color: 'rgba(255,255,255,0.63)', marginBottom: 10, maxWidth: 430 }}>
          Erhalten Sie persönliche Angebote, bevor Wohnungen öffentlich ausgeschrieben werden –
          diskret, passend und ohne den üblichen Konkurrenzdruck.
        </p>
        <p style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.6, color: 'rgba(255,255,255,0.42)', marginBottom: 28, maxWidth: 400 }}>
          Einmal registrieren genügt. Homelio informiert Sie, sobald eine passende Wohnchance entsteht.
        </p>
        <CTABtn />
      </div>
    </div>
  );
}

const MAINFRAMES = { 0: MF0, 1: MF1, 2: MF2, 3: MF3 } as const;

// ─────────────────────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function HomelioScrollytellingStable() {
  const [mainframeIndex,     setMainframeIndex]    = useState<MFIndex>(0);
  const [mode,               setMode]              = useState<Mode>('hold');
  const [direction,          setDirection]         = useState<Dir>(null);
  const [isTransitioning,    setIsTransitioning]   = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [activeVideoSrc,     setActiveVideoSrc]    = useState<string | null>(null);
  const [uiVisible,          setUiVisible]         = useState(false); // controls UI fade-in

  const videoRef      = useRef<HTMLVideoElement>(null);
  const rafRef        = useRef<number | null>(null);
  const mfRef         = useRef<MFIndex>(0);
  const modeRef       = useRef<Mode>('hold');
  const srcRef        = useRef<string>('');   // tracks what we last set as video.src
  const lastScrollMs  = useRef(0);
  const inViewRef     = useRef(false);
  const containerRef  = useRef<HTMLDivElement>(null);

  mfRef.current   = mainframeIndex;
  modeRef.current = mode;

  // ── Enter hold mode: correct forward video, seeked to hold position ─────────
  const enterHoldMode = useCallback((mf: MFIndex) => {
    const vid = videoRef.current;
    if (!vid) return;

    const { src, atStart } = HOLD_CFG[mf];

    const apply = () => {
      const t = atStart ? 0 : Math.max(0, vid.duration - END_OFFSET);
      vid.currentTime = t;
      vid.pause();
      setMainframeIndex(mf);
      setMode('hold');
      setDirection(null);
      setIsTransitioning(false);
      setTransitionProgress(0);
      setActiveVideoSrc(src);
      // Brief RAF delay so the seeked frame renders before UI fades in
      requestAnimationFrame(() => setUiVisible(true));
    };

    setUiVisible(false);

    if (srcRef.current !== src) {
      srcRef.current = src;
      vid.src = src;
      vid.load();
      vid.addEventListener('loadedmetadata', apply, { once: true });
    } else if (isFinite(vid.duration) && vid.duration > 0) {
      apply();
    } else {
      vid.addEventListener('loadedmetadata', apply, { once: true });
    }
  }, []);

  // ── Start a video transition ─────────────────────────────────────────────────
  const startTransition = useCallback((from: MFIndex, dir: 'forward' | 'backward') => {
    if (dir === 'forward'  && from >= 3) return;
    if (dir === 'backward' && from <= 0) return;

    const vid = videoRef.current;
    if (!vid) return;

    const vidIdx   = (dir === 'forward' ? from : from - 1) as 0|1|2;
    const transSrc = dir === 'forward' ? FWD_VIDEOS[vidIdx] : REV_VIDEOS[vidIdx];
    const target   = (dir === 'forward' ? from + 1 : from - 1) as MFIndex;

    setUiVisible(false);
    setMode('transition');
    setDirection(dir);
    setIsTransitioning(true);
    setTransitionProgress(0);
    setActiveVideoSrc(transSrc);

    if (srcRef.current !== transSrc) {
      srcRef.current = transSrc;
      vid.src = transSrc;
      vid.load();
    }
    vid.currentTime  = 0;
    vid.playbackRate = PLAYBACK_RATE;

    const monitor = () => {
      const v = videoRef.current;
      if (!v) return;
      if (isFinite(v.duration) && v.duration > 0) {
        setTransitionProgress(v.currentTime / v.duration);
      }
      const done = v.ended || (isFinite(v.duration) && v.duration > 0 && v.currentTime >= v.duration - END_OFFSET);
      if (done) {
        v.pause();
        rafRef.current = null;
        if (dir === 'forward') {
          // Video already paused at the correct visual endpoint — just enter hold without src change
          setMainframeIndex(target);
          setMode('hold');
          setDirection(null);
          setIsTransitioning(false);
          setTransitionProgress(0);
          requestAnimationFrame(() => setUiVisible(true));
        } else {
          // Backward: reverse video done → switch to correct forward video at its endpoint
          enterHoldMode(target);
        }
      } else {
        rafRef.current = requestAnimationFrame(monitor);
      }
    };

    vid.play()
      .then(() => { rafRef.current = requestAnimationFrame(monitor); })
      .catch(() => { enterHoldMode(target); });
  }, [enterHoldMode]);

  // ── Nav jump — instant, no video transition ──────────────────────────────────
  const jumpTo = useCallback((mf: MFIndex) => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    videoRef.current?.pause();
    enterHoldMode(mf);
  }, [enterHoldMode]);

  // ── Scroll intent ────────────────────────────────────────────────────────────
  const handleIntent = useCallback((deltaY: number) => {
    if (!inViewRef.current) return;
    const now = Date.now();
    if (now - lastScrollMs.current < SCROLL_COOLDOWN_MS) return;
    if (modeRef.current === 'transition') return;
    const dir  = deltaY > 0 ? 'forward' : 'backward';
    const from = mfRef.current;
    if (dir === 'forward'  && from >= 3) return;
    if (dir === 'backward' && from <= 0) return;
    lastScrollMs.current = now;
    startTransition(from, dir);
  }, [startTransition]);

  // ── Events ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onWheel = (e: WheelEvent) => { if (inViewRef.current) { e.preventDefault(); handleIntent(e.deltaY); } };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [handleIntent]);

  useEffect(() => {
    let startY = 0;
    const onStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onEnd   = (e: TouchEvent) => { const dy = startY - e.changedTouches[0].clientY; if (Math.abs(dy) >= 40) handleIntent(dy); };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend',   onEnd,   { passive: false });
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd); };
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { inViewRef.current = e.isIntersecting; }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onHide = () => {
      if (!document.hidden || !isTransitioning) return;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      videoRef.current?.pause();
      setMode('hold');
      setIsTransitioning(false);
      setUiVisible(true);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [isTransitioning]);

  // ── Initial hold on mount ────────────────────────────────────────────────────
  useEffect(() => {
    enterHoldMode(0);
  }, [enterHoldMode]);

  // ── Cleanup RAF ──────────────────────────────────────────────────────────────
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const ActiveFrame = MAINFRAMES[mainframeIndex];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100svh', overflow: 'hidden', background: '#050403' }}>

      {/* ── Single fullscreen video — always present, always covering ── */}
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

      {/* ── Programmed mainframe UI — fades in over the paused video ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5,
        opacity: uiVisible ? 1 : 0,
        transition: 'opacity 0.35s ease',
        pointerEvents: uiVisible ? 'auto' : 'none',
      }}>
        <ActiveFrame />
      </div>

      {/* ── Navigation — always on top ── */}
      <TopNav onJump={jumpTo} />

      {/* ── Dev debug panel ── */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute', bottom: 8, left: 8, zIndex: 9999,
          background: 'rgba(0,0,0,0.82)', color: '#00ff88',
          fontFamily: 'monospace', fontSize: 11,
          padding: '7px 12px', lineHeight: 1.9,
          pointerEvents: 'none', borderRadius: 6,
          border: '1px solid rgba(0,255,136,0.18)',
        }}>
          <div>mainframeIndex:    {mainframeIndex}</div>
          <div>mode:              {mode}</div>
          <div>direction:         {direction ?? '—'}</div>
          <div>isTransitioning:   {String(isTransitioning)}</div>
          <div>uiVisible:         {String(uiVisible)}</div>
          <div>progress:          {(transitionProgress * 100).toFixed(1)}%</div>
          <div>videoSrc:          {activeVideoSrc?.split('/').pop() ?? '—'}</div>
        </div>
      )}
    </div>
  );
}
