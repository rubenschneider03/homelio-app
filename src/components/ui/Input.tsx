'use client'

import { useState, InputHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  id?: string
  optional?: boolean
  error?: string
  hint?: string
}

export function Input({ label, id, optional, error, hint, type = 'text', ...rest }: InputProps) {
  const [focused, setFocused] = useState(false)
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={inputId} style={{
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgba(245,245,244,0.62)',
      }}>
        {label}
        {optional && (
          <span style={{ color: 'rgba(245,245,244,0.38)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>
            optional
          </span>
        )}
      </label>

      <div style={{
        border: `1px solid ${error ? 'rgba(220,80,80,0.65)' : focused ? 'rgba(212,168,83,0.55)' : 'rgba(255,255,255,0.10)'}`,
        borderRadius: 8,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
        background: 'rgba(255,255,255,0.03)',
      }}>
        <input
          id={inputId}
          type={type}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            display: 'block',
            width: '100%',
            padding: '11px 14px',
            fontSize: 15,
            color: '#f5f5f4',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'inherit',
          }}
          {...rest}
        />
      </div>

      {hint && !error && (
        <span style={{ fontSize: 12, color: 'rgba(245,245,244,0.46)', lineHeight: 1.5 }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontSize: 12, color: 'rgba(220,80,80,0.90)' }}>{error}</span>
      )}
    </div>
  )
}
