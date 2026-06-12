'use client'

interface ToggleProps {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
  optional?: boolean
}

export function Toggle({ label, hint, checked, onChange, optional }: ToggleProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: 'rgba(245,245,244,0.88)', fontWeight: 400, lineHeight: 1.4 }}>
          {label}
          {optional && (
            <span style={{ color: 'rgba(245,245,244,0.32)', fontSize: 12, marginLeft: 6 }}>optional</span>
          )}
        </div>
        {hint && (
          <div style={{ fontSize: 12, color: 'rgba(245,245,244,0.38)', marginTop: 3, lineHeight: 1.5 }}>{hint}</div>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          flexShrink: 0,
          width: 42,
          height: 24,
          borderRadius: 999,
          background: checked ? '#d4a853' : 'rgba(255,255,255,0.09)',
          border: `1px solid ${checked ? 'rgba(212,168,83,0.6)' : 'rgba(255,255,255,0.13)'}`,
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.2s, border-color 0.2s',
          padding: 0,
          marginTop: 1,
        }}
      >
        <span style={{
          display: 'block',
          width: 17,
          height: 17,
          borderRadius: 999,
          background: '#fff',
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          transition: 'left 0.18s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
        }} />
      </button>
    </div>
  )
}
