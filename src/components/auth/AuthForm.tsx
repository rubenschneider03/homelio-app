'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmailConfirmScreen } from './EmailConfirmScreen'
import { createClient } from '@/lib/supabase/client'

type Tab = 'register' | 'login'
type Step = 'form' | 'confirm' | 'reset-sent'

function mapAuthError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'E-Mail oder Passwort ist falsch.'
  if (msg.includes('User already registered')) return 'Diese E-Mail ist bereits registriert.'
  if (msg.includes('Email not confirmed')) return 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.'
  if (msg.includes('Password should be')) return 'Passwort muss mindestens 6 Zeichen lang sein.'
  return 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
}

export function AuthForm() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('register')
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agbAccepted, setAgbAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'auth') {
      setError('Die E-Mail-Bestätigung ist fehlgeschlagen. Bitte versuchen Sie es erneut.')
    }
  }, [])

  async function handleRegister() {
    if (!email) { setError('Bitte geben Sie Ihre E-Mail-Adresse ein.'); return }
    if (password.length < 8) { setError('Passwort muss mindestens 8 Zeichen lang sein.'); return }
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    if (!agbAccepted) { setError('Bitte akzeptieren Sie die AGB und Datenschutzerklärung.'); return }
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: sbError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + '/auth/callback' },
    })
    setLoading(false)
    if (sbError) { setError(mapAuthError(sbError.message)); return }
    setStep('confirm')
  }

  async function handleLogin() {
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: sbError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (sbError) { setError(mapAuthError(sbError.message)); return }
    router.push('/profil/meine-wohnung')
  }

  async function handleResend() {
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email })
  }

  async function handleForgotPassword() {
    if (!email) { setError('Bitte geben Sie zuerst Ihre E-Mail-Adresse ein.'); return }
    setError('')
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/callback?next=/auth/reset-password',
    })
    setLoading(false)
    // Always show the same confirmation, whether or not the address is registered —
    // never reveal account existence via this flow.
    setStep('reset-sent')
  }

  if (step === 'confirm') {
    return <EmailConfirmScreen email={email} onResend={handleResend} />
  }

  if (step === 'reset-sent') {
    return (
      <GlassCard style={{ width: '100%', padding: '44px 32px', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 999,
          background: 'rgba(212,168,83,0.10)',
          border: '1px solid rgba(212,168,83,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: 22, color: '#d4a853',
        }}>
          ✉
        </div>
        <h2 style={{
          fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
          fontSize: 22, fontWeight: 400, color: '#f5f5f4',
          margin: '0 0 12px', lineHeight: 1.3,
        }}>
          E-Mail unterwegs
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.50)', lineHeight: 1.75, margin: '0 0 28px' }}>
          Falls ein Konto mit dieser E-Mail-Adresse existiert, erhalten Sie in Kürze einen Link zum
          Zurücksetzen Ihres Passworts.
        </p>
        <button
          onClick={() => { setStep('form'); setTab('login') }}
          style={{
            background: 'transparent', border: 'none',
            color: 'rgba(245,245,244,0.38)', fontSize: 13,
            cursor: 'pointer', padding: '8px 0', fontFamily: 'inherit',
          }}
        >
          Zurück zur Anmeldung
        </button>
      </GlassCard>
    )
  }

  return (
    <GlassCard style={{ width: '100%', padding: '32px 28px' }}>
      {/* Tab switcher */}
      <div style={{
        display: 'flex',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 9,
        padding: 3,
        marginBottom: 28,
      }}>
        {(['register', 'login'] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setError('') }}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 7,
              border: 'none',
              background: tab === t ? 'rgba(255,255,255,0.09)' : 'transparent',
              color: tab === t ? '#f5f5f4' : 'rgba(245,245,244,0.38)',
              fontSize: 13,
              fontWeight: tab === t ? 500 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {t === 'register' ? 'Konto erstellen' : 'Anmelden'}
          </button>
        ))}
      </div>

      {tab === 'register' ? (
        <form
          onSubmit={e => { e.preventDefault(); handleRegister() }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <Input
            label="E-Mail-Adresse"
            type="email"
            placeholder="ihre@email.ch"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Passwort"
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

          {/* AGB consent — required to create account */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 4 }}>
            <input
              type="checkbox"
              id="agb-accept"
              checked={agbAccepted}
              onChange={e => setAgbAccepted(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0, accentColor: '#d4a853', width: 15, height: 15, cursor: 'pointer' }}
            />
            <label
              htmlFor="agb-accept"
              style={{ fontSize: 12, color: 'rgba(245,245,244,0.55)', lineHeight: 1.60, cursor: 'pointer' }}
            >
              Ich akzeptiere die{' '}
              <a href="/agb" target="_blank" rel="noopener" style={{ color: '#d4a853', textDecoration: 'none' }}>AGB</a>
              {' '}und{' '}
              <a href="/datenschutz" target="_blank" rel="noopener" style={{ color: '#d4a853', textDecoration: 'none' }}>Datenschutzerklärung</a>
              {' '}und bin einverstanden, dass Homelio meine Wohnungsbilder sowie anonymisierte Wohnungs- und Suchdaten im Rahmen des Matching-Prozesses an Verwaltungen weitergeben darf.
            </label>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'rgba(220,80,80,0.90)', margin: 0, lineHeight: 1.5 }}>{error}</p>
          )}

          <Button type="submit" fullWidth disabled={loading || !agbAccepted} style={{ marginTop: 4 }}>
            {loading ? 'Konto wird erstellt...' : 'Konto erstellen →'}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={e => { e.preventDefault(); handleLogin() }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <Input
            label="E-Mail-Adresse"
            type="email"
            placeholder="ihre@email.ch"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Passwort"
            type="password"
            placeholder="Ihr Passwort"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <p style={{ fontSize: 13, color: 'rgba(220,80,80,0.90)', margin: 0, lineHeight: 1.5 }}>{error}</p>
          )}

          <Button type="submit" fullWidth disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Anmelden...' : 'Anmelden →'}
          </Button>

          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={loading}
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(245,245,244,0.35)', fontSize: 12,
              cursor: loading ? 'default' : 'pointer', padding: '4px 0', fontFamily: 'inherit',
              textAlign: 'center',
            }}
          >
            Passwort vergessen?
          </button>
        </form>
      )}
    </GlassCard>
  )
}
