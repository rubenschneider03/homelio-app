'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmailConfirmScreen } from './EmailConfirmScreen'
import { createClient } from '@/lib/supabase/client'

type Tab = 'register' | 'login'
type Step = 'form' | 'confirm'

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

  if (step === 'confirm') {
    return <EmailConfirmScreen email={email} onResend={handleResend} />
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

          {error && (
            <p style={{ fontSize: 13, color: 'rgba(220,80,80,0.90)', margin: 0, lineHeight: 1.5 }}>{error}</p>
          )}

          <p style={{ fontSize: 12, color: 'rgba(245,245,244,0.32)', margin: '4px 0 0', lineHeight: 1.7 }}>
            Mit der Registrierung akzeptieren Sie unsere{' '}
            <a href="/agb" style={{ color: '#d4a853', textDecoration: 'none' }}>AGB</a>
            {' '}und unsere{' '}
            <a href="/datenschutz" style={{ color: '#d4a853', textDecoration: 'none' }}>Datenschutzerklärung</a>.
          </p>

          <Button type="submit" fullWidth disabled={loading} style={{ marginTop: 4 }}>
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
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(245,245,244,0.35)', fontSize: 12,
              cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit',
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
