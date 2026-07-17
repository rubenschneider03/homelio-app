'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const CONFIRM_WORD = 'LÖSCHEN'

/**
 * Small, muted danger zone at the bottom of "Meine Wohnung". Account deletion
 * is irreversible, so it requires opening the confirm step and typing the
 * confirmation word before the button enables.
 */
export function DeleteAccountSection() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setError('')
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const parts = [data?.step, data?.detail, !data?.step ? data?.error : null].filter(Boolean)
        const suffix = parts.length ? ` (${parts.join(': ')})` : ` (HTTP ${res.status})`
        setError(`Das Konto konnte nicht gelöscht werden.${suffix}`)
        setDeleting(false)
        return
      }
      // Clear the local session, then leave for the homepage.
      await createClient().auth.signOut()
      router.replace('/')
      router.refresh()
    } catch {
      setError('Das Konto konnte nicht gelöscht werden. Bitte versuchen Sie es später erneut.')
      setDeleting(false)
    }
  }

  return (
    <div style={{ marginTop: 24, textAlign: 'center' }}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            fontSize: 12, color: 'rgba(245,245,244,0.30)',
            background: 'none', border: 'none', cursor: 'pointer',
            letterSpacing: '0.03em', padding: '6px 0', fontFamily: 'inherit',
            textDecoration: 'underline', textUnderlineOffset: 3,
          }}
        >
          Konto löschen
        </button>
      ) : (
        <div style={{
          maxWidth: 420, margin: '0 auto',
          background: 'rgba(40,12,12,0.30)',
          border: '1px solid rgba(200,80,80,0.28)',
          borderRadius: 12, padding: '18px 20px', textAlign: 'left',
        }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(245,245,244,0.85)', margin: '0 0 8px' }}>
            Konto endgültig löschen?
          </p>
          <p style={{ fontSize: 12, color: 'rgba(245,245,244,0.55)', lineHeight: 1.65, margin: '0 0 14px' }}>
            Ihr Konto sowie Ihre Wohnung, Suchprofil, Fotos und Matches werden unwiderruflich
            entfernt. Dies kann nicht rückgängig gemacht werden. Geben Sie zur Bestätigung{' '}
            <strong style={{ color: 'rgba(245,245,244,0.80)' }}>{CONFIRM_WORD}</strong> ein.
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder={CONFIRM_WORD}
            autoComplete="off"
            style={{
              width: '100%', boxSizing: 'border-box', marginBottom: 12,
              padding: '9px 12px', borderRadius: 8,
              background: 'rgba(0,0,0,0.25)', color: '#f5f5f4',
              border: '1px solid rgba(255,255,255,0.14)',
              fontSize: 13, fontFamily: 'inherit', letterSpacing: '0.08em',
            }}
          />
          {error && (
            <p style={{ fontSize: 12, color: 'rgba(220,90,90,0.95)', margin: '0 0 12px', lineHeight: 1.5 }}>
              {error}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={confirmText !== CONFIRM_WORD || deleting}
              style={{
                padding: '9px 18px', borderRadius: 999, border: 'none',
                fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                background: confirmText === CONFIRM_WORD && !deleting ? 'rgba(200,70,70,0.90)' : 'rgba(200,70,70,0.30)',
                color: confirmText === CONFIRM_WORD && !deleting ? '#fff' : 'rgba(255,255,255,0.5)',
                cursor: confirmText === CONFIRM_WORD && !deleting ? 'pointer' : 'default',
              }}
            >
              {deleting ? 'Wird gelöscht…' : 'Endgültig löschen'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setConfirmText(''); setError('') }}
              disabled={deleting}
              style={{
                padding: '9px 18px', borderRadius: 999,
                background: 'rgba(255,255,255,0.06)', color: 'rgba(245,245,244,0.75)',
                border: '1px solid rgba(255,255,255,0.14)',
                fontSize: 13, cursor: deleting ? 'default' : 'pointer', fontFamily: 'inherit',
              }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
