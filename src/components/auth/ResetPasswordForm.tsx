'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

type Status = 'verifying' | 'ready' | 'invalid' | 'success'

export function ResetPasswordForm() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('verifying')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function verify() {
      // The code exchange now happens server-side in /auth/callback before this
      // page is ever reached — the recovery session is already in cookies here.
      // We only need to confirm it actually exists.
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setStatus(session ? 'ready' : 'invalid')
    }
    verify()
  }, [])

  async function handleSubmit() {
    if (password.length < 8) { setError('Passwort muss mindestens 8 Zeichen lang sein.'); return }
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError('Beim Speichern ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.')
      return
    }
    setStatus('success')
    setTimeout(() => router.push('/profil/meine-wohnung'), 1800)
  }

  if (status === 'verifying') {
    return (
      <GlassCard style={{ width: '100%', padding: '44px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.45)', margin: 0 }}>Link wird überprüft…</p>
      </GlassCard>
    )
  }

  if (status === 'invalid') {
    return (
      <GlassCard style={{ width: '100%', padding: '44px 32px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
          fontSize: 22, fontWeight: 400, color: '#f5f5f4', margin: '0 0 12px', lineHeight: 1.3,
        }}>
          Link ungültig oder abgelaufen
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.50)', lineHeight: 1.75, margin: '0 0 24px' }}>
          Bitte fordern Sie über die Anmeldeseite einen neuen Link zum Zurücksetzen Ihres Passworts an.
        </p>
        <Button onClick={() => router.push('/anmelden')}>Zur Anmeldung</Button>
      </GlassCard>
    )
  }

  if (status === 'success') {
    return (
      <GlassCard style={{ width: '100%', padding: '44px 32px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
          fontSize: 22, fontWeight: 400, color: '#f5f5f4', margin: '0 0 12px', lineHeight: 1.3,
        }}>
          Passwort aktualisiert
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.50)', lineHeight: 1.75, margin: 0 }}>
          Sie werden weitergeleitet…
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard style={{ width: '100%', padding: '32px 28px' }}>
      <h2 style={{
        fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
        fontSize: 22, fontWeight: 400, color: '#f5f5f4', margin: '0 0 20px', lineHeight: 1.3,
      }}>
        Neues Passwort festlegen
      </h2>
      <form onSubmit={e => { e.preventDefault(); handleSubmit() }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          label="Neues Passwort"
          type="password"
          placeholder="Mindestens 8 Zeichen"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <Input
          label="Passwort bestätigen"
          type="password"
          placeholder="Passwort wiederholen"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
        {error && (
          <p style={{ fontSize: 13, color: 'rgba(220,80,80,0.90)', margin: 0, lineHeight: 1.5 }}>{error}</p>
        )}
        <Button type="submit" fullWidth disabled={loading} style={{ marginTop: 4 }}>
          {loading ? 'Wird gespeichert…' : 'Passwort speichern'}
        </Button>
      </form>
    </GlassCard>
  )
}
