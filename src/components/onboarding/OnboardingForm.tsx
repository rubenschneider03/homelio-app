'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { trackCompleteRegistration } from '@/lib/metaPixel'

export function OnboardingForm() {
  const router = useRouter()
  const [street, setStreet] = useState('')
  const [houseNr, setHouseNr] = useState('')
  const [zip, setZip] = useState('')
  const [city, setCity] = useState('')
  const [verwaltung, setVerwaltung] = useState('')
  const [aptNr, setAptNr] = useState('')
  const [floor, setFloor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/anmelden')
      return
    }

    const { error: aptError } = await supabase
      .from('apartments')
      .upsert(
        {
          user_id: user.id,
          status: 'draft',
          street,
          house_nr: houseNr,
          zip,
          city,
          management_company: verwaltung,
          apt_nr: aptNr.trim() || null,
          floor: floor ? parseInt(floor, 10) : null,
        },
        { onConflict: 'user_id' }
      )

    if (aptError) {
      setError('Beim Speichern ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.')
      setLoading(false)
      return
    }

    // Set the completion timestamp only while it is still NULL: the returned
    // rows are the durable, cross-device signal that onboarding was completed
    // right now for the first time (a re-run matches zero rows).
    const { data: completedNow, error: profileError } = await supabase
      .from('profiles')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', user.id)
      .is('onboarding_completed_at', null)
      .select('id')

    if (profileError) {
      setError('Beim Speichern ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.')
      setLoading(false)
      return
    }

    // Meta event only on the first completion; sent only if marketing consent
    // and the pixel are present (checked inside the helper).
    if (completedNow && completedNow.length > 0) {
      trackCompleteRegistration()
    }

    router.push('/profil/meine-wohnung')
  }

  return (
    <GlassCard style={{ width: '100%', padding: '36px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: 'rgba(212,168,83,0.70)',
          margin: '0 0 10px',
        }}>
          Schritt 2 von 2
        </p>
        <h2 style={{
          fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
          fontSize: 22, fontWeight: 400, color: '#f5f5f4',
          margin: '0 0 8px', lineHeight: 1.3,
        }}>
          Ihre aktuelle Wohnung
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.45)', margin: 0, lineHeight: 1.65 }}>
          Damit Homelio Sie mit passenden Interessenten verbinden kann, benötigen wir Ihre aktuelle Adresse und Verwaltung.
        </p>
      </div>

      <form onSubmit={e => { e.preventDefault(); handleSubmit() }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Street row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 10 }}>
          <Input
            label="Strasse"
            placeholder="Musterstrasse"
            value={street}
            onChange={e => setStreet(e.target.value)}
            required
          />
          <Input
            label="Nr."
            placeholder="12a"
            value={houseNr}
            onChange={e => setHouseNr(e.target.value)}
            required
          />
        </div>

        {/* ZIP + City */}
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 10 }}>
          <Input
            label="PLZ"
            placeholder="8001"
            value={zip}
            onChange={e => setZip(e.target.value)}
            required
          />
          <Input
            label="Ort"
            placeholder="Zürich"
            value={city}
            onChange={e => setCity(e.target.value)}
            required
          />
        </div>

        <Input
          label="Hausverwaltung / Vermieter"
          placeholder="z.B. Wincasa AG, REME Verwaltung, Privat"
          value={verwaltung}
          onChange={e => setVerwaltung(e.target.value)}
          hint="Geben Sie den Namen Ihrer aktuellen Verwaltung oder Ihres Vermieters an."
          required
        />

        {/* Optional */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input
            label="Wohnungsnummer"
            placeholder="z.B. 3a"
            optional
            value={aptNr}
            onChange={e => setAptNr(e.target.value)}
          />
          <Input
            label="Stockwerk"
            placeholder="z.B. 2"
            optional
            type="number"
            value={floor}
            onChange={e => setFloor(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {error && (
            <p style={{ fontSize: 13, color: 'rgba(220,80,80,0.90)', margin: 0, lineHeight: 1.5 }}>
              {error}
            </p>
          )}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Wird gespeichert…' : 'Weiter zum Profil →'}
          </Button>
        </div>
      </form>
    </GlassCard>
  )
}
