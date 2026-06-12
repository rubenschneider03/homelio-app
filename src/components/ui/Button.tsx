'use client'

import { ReactNode, CSSProperties } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: Variant
  fullWidth?: boolean
  disabled?: boolean
  style?: CSSProperties
}

const GOLD = '#d4a853'

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  style,
}: ButtonProps) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: '0.02em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'opacity 0.15s',
    width: fullWidth ? '100%' : undefined,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
  }

  const variants: Record<Variant, CSSProperties> = {
    primary: {
      background: GOLD,
      color: '#0C0A06',
      padding: '13px 28px',
      border: 'none',
    },
    secondary: {
      background: 'rgba(255,255,255,0.06)',
      color: '#f5f5f4',
      border: '1px solid rgba(255,255,255,0.14)',
      padding: '12px 28px',
    },
    ghost: {
      background: 'transparent',
      color: 'rgba(245,245,244,0.55)',
      border: 'none',
      padding: '8px 0',
    },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  )
}
