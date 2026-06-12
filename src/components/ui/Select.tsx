'use client'

import { SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  id?: string
  options: SelectOption[]
  optional?: boolean
  placeholder?: string
  hint?: string
}

export function Select({ label, id, options, optional, placeholder, hint, value, ...rest }: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const hasValue = value !== '' && value !== undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={selectId} style={{
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

      <select
        id={selectId}
        value={value}
        style={{
          background: '#131009',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 8,
          padding: '11px 36px 11px 14px',
          fontSize: 15,
          color: hasValue ? '#f5f5f4' : 'rgba(245,245,244,0.32)',
          outline: 'none',
          width: '100%',
          fontFamily: 'inherit',
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='11' height='7' viewBox='0 0 11 7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5.5 5.5L10 1' stroke='rgba(245,245,244,0.35)' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 13px center',
        }}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {hint && (
        <span style={{ fontSize: 12, color: 'rgba(245,245,244,0.35)', lineHeight: 1.5 }}>{hint}</span>
      )}
    </div>
  )
}
