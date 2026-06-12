'use client'

import { useState, TextareaHTMLAttributes } from 'react'

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  id?: string
  optional?: boolean
  hint?: string
  rows?: number
}

export function TextArea({ label, id, optional, hint, rows = 4, ...rest }: TextAreaProps) {
  const [focused, setFocused] = useState(false)
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={inputId} style={{
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgba(245,245,244,0.50)',
      }}>
        {label}
        {optional && (
          <span style={{ color: 'rgba(245,245,244,0.28)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>
            optional
          </span>
        )}
      </label>

      <div style={{
        border: `1px solid ${focused ? 'rgba(212,168,83,0.55)' : 'rgba(255,255,255,0.10)'}`,
        borderRadius: 8,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
        background: 'rgba(255,255,255,0.03)',
      }}>
        <textarea
          id={inputId}
          rows={rows}
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
            resize: 'vertical',
            lineHeight: 1.6,
          }}
          {...rest}
        />
      </div>

      {hint && (
        <span style={{ fontSize: 12, color: 'rgba(245,245,244,0.35)', lineHeight: 1.5 }}>{hint}</span>
      )}
    </div>
  )
}
