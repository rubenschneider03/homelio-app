'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TextArea } from '@/components/ui/TextArea'
import { Button } from '@/components/ui/Button'

const HOUSEHOLD = [
  { value: '1', label: '1 Person' },
  { value: '2', label: '2 Personen' },
  { value: '3', label: '3 Personen' },
  { value: '4', label: '4 Personen' },
  { value: '5+', label: '5+ Personen' },
]

interface AppProfile {
  full_name: string
  phone: string
  email: string
  motivation: string
  household_size: string
  income_note: string
  status: 'draft' | 'ready'
}

const INIT: AppProfile = {
  full_name: '', phone: '', email: '', motivation: '',
  household_size: '', income_note: '', status: 'draft',
}

export function ApplicationPanel() {
  const [data, setData] = useState<AppProfile>(INIT)
  const upd = <K extends keyof AppProfile>(k: K, v: AppProfile[K]) =>
    setData(p => ({ ...p, [k]: v }))

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [tableReady, setTableReady] = useState(true)
  const [feeAcknowledged, setFeeAcknowledged] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: row, error } = await supabase
        .from('user_application_profiles')
        .select('full_name, phone, email, motivation, household_size, income_note, status')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        // Table does not exist yet — migration 004 must be run first
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          setTableReady(false)
        }
        setLoading(false)
        return
      }

      if (row) {
        setData({
          full_name: row.full_name ?? '',
          phone: row.phone ?? '',
          email: row.email ?? '',
          motivation: row.motivation ?? '',
          household_size: row.household_size ?? '',
          income_note: row.income_note ?? '',
          status: (row.status as 'draft' | 'ready') ?? 'draft',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(markReady: boolean) {
    setSaveError('')
    setSaveSuccess(false)
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const newStatus: 'draft' | 'ready' = markReady ? 'ready' : 'draft'

    const { error } = await supabase
      .from('user_application_profiles')
      .upsert({
        user_id: user.id,
        full_name: data.full_name.trim() || null,
        phone: data.phone.trim() || null,
        email: data.email.trim() || null,
        motivation: data.motivation.trim() || null,
        household_size: data.household_size || null,
        income_note: data.income_note.trim() || null,
        status: newStatus,
      }, { onConflict: 'user_id' })

    if (error) {
      setSaveError('Beim Speichern ist ein Fehler aufgetreten.')
      setSaving(false)
      return
    }

    setData(p => ({ ...p, status: newStatus }))
    setSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  return (
    <div style={{
      background: 'rgba(18,14,8,0.55)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 'clamp(20px, 4vw, 32px)',
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>
      {/* Header */}
      <div>
        <h3 style={{
          fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
          fontSize: 20, fontWeight: 400, color: '#f5f5f4',
          margin: '0 0 8px', lineHeight: 1.2,
        }}>
          Bewerbung / Dossier
        </h3>
        <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.52)', margin: 0, lineHeight: 1.7 }}>
          Damit Homelio Ihre Anfrage bei einer Verwaltung weiterleiten kann, ergänzen Sie bitte Ihre
          Bewerbungsangaben. Die Daten werden vertraulich behandelt und nur bei einem konkreten Match weitergeleitet.
        </p>
      </div>

      {/* Status badge */}
      {!loading && tableReady && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: data.status === 'ready' ? 'rgba(80,200,100,0.07)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${data.status === 'ready' ? 'rgba(80,200,100,0.22)' : 'rgba(255,255,255,0.09)'}`,
          borderRadius: 999, padding: '6px 14px', alignSelf: 'flex-start',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: data.status === 'ready' ? 'rgba(80,200,100,0.85)' : 'rgba(245,245,244,0.25)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: data.status === 'ready' ? 'rgba(120,220,130,0.85)' : 'rgba(245,245,244,0.48)' }}>
            {data.status === 'ready' ? 'Bereit zur Weiterleitung' : 'Noch nicht an Verwaltungen übermittelt'}
          </span>
        </div>
      )}

      {!tableReady ? (
        <div style={{
          background: 'rgba(212,168,83,0.06)',
          border: '1px solid rgba(212,168,83,0.18)',
          borderRadius: 10, padding: '14px 18px',
          fontSize: 13, color: 'rgba(245,245,244,0.50)', lineHeight: 1.65,
        }}>
          Diese Funktion steht nach dem nächsten Datenbank-Update zur Verfügung.
          Bitte führen Sie Migration 004_mvp_hardening.sql in Supabase aus.
        </div>
      ) : loading ? (
        <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.45)', margin: 0 }}>Wird geladen…</p>
      ) : (
        <form onSubmit={e => { e.preventDefault(); handleSave(false) }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Input
              label="Vollständiger Name"
              placeholder="Vorname Nachname"
              optional
              value={data.full_name}
              onChange={e => upd('full_name', e.target.value)}
            />
            <Input
              label="Telefon"
              type="tel"
              placeholder="+41 79 000 00 00"
              optional
              value={data.phone}
              onChange={e => upd('phone', e.target.value)}
            />
          </div>

          <Input
            label="E-Mail für Kontaktaufnahme"
            type="email"
            placeholder="ihre@email.ch"
            optional
            value={data.email}
            onChange={e => upd('email', e.target.value)}
          />

          <Select
            label="Haushaltsgrösse"
            options={HOUSEHOLD}
            placeholder="Bitte wählen"
            optional
            value={data.household_size}
            onChange={e => upd('household_size', e.target.value)}
          />

          <Input
            label="Einkommens- / Beschäftigungshinweis"
            placeholder="z.B. Festanstellung, Zürich, seit 3 Jahren"
            optional
            value={data.income_note}
            onChange={e => upd('income_note', e.target.value)}
          />

          <TextArea
            label="Kurze Vorstellung / Motivation"
            placeholder="z.B. Wir sind ein ruhiges Pärchen und suchen eine langfristige Lösung in Zürich…"
            optional
            rows={3}
            value={data.motivation}
            onChange={e => upd('motivation', e.target.value)}
          />

          {/* Document upload placeholder */}
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px dashed rgba(255,255,255,0.12)',
            borderRadius: 10, padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontSize: 20, opacity: 0.45 }}>📄</span>
            <div>
              <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.48)', margin: 0, lineHeight: 1.5 }}>
                Dokumentenupload (Betreibungsauszug, Lohnausweis) folgt in einer späteren Version.
              </p>
            </div>
          </div>

          {/* Success fee disclosure — required acknowledgment before marking the dossier as ready */}
          <div style={{
            background: 'rgba(212,168,83,0.05)',
            border: '1px solid rgba(212,168,83,0.18)',
            borderRadius: 10, padding: '16px 18px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.65)', margin: 0, lineHeight: 1.65 }}>
              Bei erfolgreicher Vermittlung über Homelio wird eine einmalige Erfolgsgebühr von CHF 100 fällig.
              Erfolgreich bedeutet, dass über einen Homelio-Kontakt ein Mietvertrag abgeschlossen wird.
            </p>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={feeAcknowledged}
                onChange={e => setFeeAcknowledged(e.target.checked)}
                style={{ marginTop: 2, flexShrink: 0, width: 17, height: 17, accentColor: '#d4a853', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: 'rgba(245,245,244,0.72)', lineHeight: 1.6 }}>
                Ich bestätige, dass bei erfolgreichem Abschluss eines Mietvertrags über einen Homelio-Kontakt
                eine einmalige Erfolgsgebühr von CHF 100 fällig wird.
              </span>
            </label>
          </div>

          {saveError && (
            <p style={{ fontSize: 13, color: 'rgba(220,80,80,0.90)', margin: 0 }}>{saveError}</p>
          )}
          {saveSuccess && (
            <p style={{ fontSize: 13, color: 'rgba(80,200,100,0.85)', margin: 0 }}>✓ Gespeichert.</p>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button type="submit" variant="secondary" disabled={saving}>
              {saving ? 'Wird gespeichert…' : 'Entwurf speichern'}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={saving || !feeAcknowledged}
              onClick={() => handleSave(true)}
            >
              {saving ? '…' : 'Als bereit markieren'}
            </Button>
          </div>
          {!feeAcknowledged && (
            <p style={{ fontSize: 12, color: 'rgba(245,245,244,0.38)', margin: 0, lineHeight: 1.6 }}>
              Bitte bestätigen Sie die Erfolgsgebühr oben, um das Dossier als bereit zu markieren.
            </p>
          )}
          <p style={{ fontSize: 11, color: 'rgba(245,245,244,0.34)', margin: 0, lineHeight: 1.6 }}>
            Ihre Bewerbungsangaben werden nur bei einem konkreten beidseitigen Match und auf Anfrage an die zuständige Verwaltung weitergeleitet.
          </p>
        </form>
      )}
    </div>
  )
}
