'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FieldGroup } from '@/components/ui/FieldGroup'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { TextArea } from '@/components/ui/TextArea'
import { Button } from '@/components/ui/Button'
import { PhotoUpload } from './PhotoUpload'
import { createClient } from '@/lib/supabase/client'

const ROOMS = [
  { value: '1', label: '1 Zimmer' }, { value: '1.5', label: '1.5 Zimmer' },
  { value: '2', label: '2 Zimmer' }, { value: '2.5', label: '2.5 Zimmer' },
  { value: '3', label: '3 Zimmer' }, { value: '3.5', label: '3.5 Zimmer' },
  { value: '4', label: '4 Zimmer' }, { value: '4.5', label: '4.5 Zimmer' },
  { value: '5', label: '5 Zimmer' }, { value: '5.5', label: '5.5 Zimmer' },
  { value: '6', label: '6 Zimmer' }, { value: '6+', label: '6+ Zimmer' },
]
const ELEVATOR = [
  { value: 'yes', label: 'Ja' },
  { value: 'no', label: 'Nein' },
  { value: 'unknown', label: 'Nicht bekannt' },
]
const FLEXIBILITY = [
  { value: 'immediate', label: 'Sofort' },
  { value: '1-3', label: '1–3 Monate' },
  { value: '3-6', label: '3–6 Monate' },
  { value: '6+', label: '6+ Monate' },
  { value: 'flexible', label: 'Flexibel' },
]
const PARKING = [
  { value: 'none', label: 'Kein Parkplatz' },
  { value: 'outdoor', label: 'Aussenparkplatz' },
  { value: 'indoor', label: 'Einstellhalle' },
  { value: 'carport', label: 'Carport' },
]
const LAUNDRY = [
  { value: 'private', label: 'Eigene Waschmaschine in der Wohnung' },
  { value: 'shared', label: 'Gemeinschaftswaschraum' },
  { value: 'none', label: 'Nicht vorhanden' },
]
const PETS = [
  { value: 'yes', label: 'Ja, erlaubt' },
  { value: 'no', label: 'Nein, nicht erlaubt' },
  { value: 'unknown', label: 'Nicht bekannt' },
]
const FURNISHED = [
  { value: 'no', label: 'Unmöbliert' },
  { value: 'partial', label: 'Teilmöbliert' },
  { value: 'yes', label: 'Voll möbliert' },
]
const HEATING = [
  { value: 'central', label: 'Zentralheizung' },
  { value: 'district', label: 'Fernwärme' },
  { value: 'heat_pump', label: 'Wärmepumpe' },
  { value: 'gas', label: 'Gas' },
  { value: 'oil', label: 'Öl' },
  { value: 'electric', label: 'Elektro' },
  { value: 'wood', label: 'Holz' },
  { value: 'unknown', label: 'Nicht bekannt' },
]
const NOISE = [
  { value: 'quiet', label: 'Ruhig / Wohngebiet' },
  { value: 'moderate', label: 'Moderat' },
  { value: 'urban', label: 'Urban / Belebte Lage' },
]
const ORIENTATION = [
  { value: 'south', label: 'Südseite' },
  { value: 'north', label: 'Nordseite' },
  { value: 'east', label: 'Ostseite' },
  { value: 'west', label: 'Westseite' },
  { value: 'mixed', label: 'Gemischt / Mehrere Seiten' },
]
const PROXIMITY = [
  { value: 'good', label: 'Gut' },
  { value: 'ok', label: 'Ausreichend' },
  { value: 'not_relevant', label: 'Nicht relevant' },
]
const CONFIDENTIALITY = [
  { value: 'verified_matches', label: 'Nur verifizierten Interessenten zeigen' },
  { value: 'management', label: 'Interessenten und Verwaltung informieren' },
  { value: 'anonymous', label: 'Vollständig anonymisiert' },
]

// Select / Toggle fields — tracked in F state
interface F {
  rooms: string; elevator: string; flexibility: string
  hasBalcony: boolean; hasTerrace: boolean; hasGarden: boolean
  parkingType: string; hasCellar: boolean; laundry: string
  petsAllowed: string; isWheelchair: boolean; isFurnished: string; heatingType: string
  noiseLevel: string; orientation: string; schoolProximity: string; lakeProximity: string
  confidentiality: string; allowSharing: boolean; isAuthorizedTenant: boolean
}

const INIT: F = {
  rooms: '', elevator: '', flexibility: '',
  hasBalcony: false, hasTerrace: false, hasGarden: false,
  parkingType: '', hasCellar: false, laundry: '',
  petsAllowed: '', isWheelchair: false, isFurnished: '', heatingType: '',
  noiseLevel: '', orientation: '', schoolProximity: '', lakeProximity: '',
  confidentiality: 'verified_matches', allowSharing: false, isAuthorizedTenant: false,
}

// Text / number / date fields — tracked in T state (newly controlled)
interface T {
  street: string; houseNr: string; zip: string; city: string
  managementCompany: string; aptNr: string; floor: string
  areaM2: string; rentGross: string; rentNet: string; additionalCosts: string
  earliestMoveOut: string; nearestStop: string; transportMinutes: string
  buildRenovYear: string; highlights: string; moveOutReason: string
}

const T_INIT: T = {
  street: '', houseNr: '', zip: '', city: '',
  managementCompany: '', aptNr: '', floor: '',
  areaM2: '', rentGross: '', rentNet: '', additionalCosts: '',
  earliestMoveOut: '', nearestStop: '', transportMinutes: '',
  buildRenovYear: '', highlights: '', moveOutReason: '',
}

const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
const row3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }

export function MeineWohnungForm() {
  const router = useRouter()

  const [f, setF] = useState<F>(INIT)
  const set = <K extends keyof F>(k: K, v: F[K]) => setF(p => ({ ...p, [k]: v }))

  const [t, setT] = useState<T>(T_INIT)
  const setTxt = (k: keyof T, v: string) => setT(p => ({ ...p, [k]: v }))

  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    async function loadApartment() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/anmelden')
        return
      }
      const { data: apt } = await supabase
        .from('apartments')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (apt) {
        setT({
          street: apt.street ?? '',
          houseNr: apt.house_nr ?? '',
          zip: apt.zip ?? '',
          city: apt.city ?? '',
          managementCompany: apt.management_company ?? '',
          aptNr: apt.apt_nr ?? '',
          floor: apt.floor?.toString() ?? '',
          areaM2: apt.area_sqm?.toString() ?? '',
          rentGross: apt.rent_gross?.toString() ?? '',
          rentNet: apt.rent_net?.toString() ?? '',
          additionalCosts: apt.additional_costs?.toString() ?? '',
          earliestMoveOut: apt.earliest_move_out ?? '',
          nearestStop: apt.nearest_stop ?? '',
          transportMinutes: apt.transport_minutes_center?.toString() ?? '',
          buildRenovYear: [apt.build_year, apt.renovation_year].filter(x => x != null).join(' / '),
          highlights: apt.highlights ?? '',
          moveOutReason: apt.move_out_reason ?? '',
        })
        setF({
          rooms: apt.rooms?.toString() ?? '',
          elevator: apt.has_elevator ?? '',
          flexibility: apt.move_out_flexibility ?? '',
          hasBalcony: apt.has_balcony ?? false,
          hasTerrace: apt.has_terrace ?? false,
          hasGarden: apt.has_garden ?? false,
          parkingType: apt.parking_type ?? '',
          hasCellar: apt.has_cellar ?? false,
          laundry: apt.laundry ?? '',
          petsAllowed: apt.pets_allowed ?? '',
          isWheelchair: apt.is_wheelchair_accessible ?? false,
          isFurnished: apt.is_furnished ?? '',
          heatingType: apt.heating_type ?? '',
          noiseLevel: apt.noise_level ?? '',
          orientation: apt.orientation ?? '',
          schoolProximity: apt.school_proximity ?? '',
          lakeProximity: apt.lake_proximity ?? '',
          confidentiality: apt.confidentiality ?? 'verified_matches',
          allowSharing: apt.allow_sharing ?? false,
          isAuthorizedTenant: apt.is_authorized_tenant ?? false,
        })
      }
      setLoadingData(false)
    }
    loadApartment()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit() {
    setSaveError('')
    setSaveSuccess(false)
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.replace('/anmelden')
      return
    }

    // Parse combined "Baujahr / Renovationsjahr" field into two DB integers
    const buildParts = t.buildRenovYear.split('/')
    const buildYear = parseInt(buildParts[0]?.trim(), 10) || null
    const renovYear = parseInt(buildParts[1]?.trim(), 10) || null

    const { error: aptError } = await supabase
      .from('apartments')
      .upsert(
        {
          user_id: user.id,
          status: 'draft',
          street: t.street,
          house_nr: t.houseNr,
          zip: t.zip,
          city: t.city,
          management_company: t.managementCompany,
          apt_nr: t.aptNr.trim() || null,
          floor: parseInt(t.floor, 10) || null,
          area_sqm: parseInt(t.areaM2, 10) || null,
          rent_gross: parseInt(t.rentGross, 10) || null,
          rent_net: parseInt(t.rentNet, 10) || null,
          additional_costs: parseInt(t.additionalCosts, 10) || null,
          earliest_move_out: t.earliestMoveOut || null,
          has_elevator: f.elevator || null,
          move_out_flexibility: f.flexibility || null,
          rooms: f.rooms ? parseFloat(f.rooms) : null,
          has_balcony: f.hasBalcony,
          has_terrace: f.hasTerrace,
          has_garden: f.hasGarden,
          has_cellar: f.hasCellar,
          is_wheelchair_accessible: f.isWheelchair,
          parking_type: f.parkingType || null,
          laundry: f.laundry || null,
          pets_allowed: f.petsAllowed || null,
          is_furnished: f.isFurnished || null,
          heating_type: f.heatingType || null,
          noise_level: f.noiseLevel || null,
          orientation: f.orientation || null,
          nearest_stop: t.nearestStop.trim() || null,
          transport_minutes_center: parseInt(t.transportMinutes, 10) || null,
          school_proximity: f.schoolProximity || null,
          lake_proximity: f.lakeProximity || null,
          build_year: buildYear,
          renovation_year: renovYear,
          highlights: t.highlights.trim() || null,
          move_out_reason: t.moveOutReason.trim() || null,
          confidentiality: f.confidentiality,
          allow_sharing: f.allowSharing,
          is_authorized_tenant: f.isAuthorizedTenant,
        },
        { onConflict: 'user_id' }
      )

    if (aptError) {
      setSaveError('Beim Speichern ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.')
      setSaving(false)
      return
    }

    setSaving(false)
    setSaveSuccess(true)
  }

  return (
    <div style={{
      background: 'rgba(18,14,8,0.55)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 'clamp(24px, 4vw, 48px)',
    }}>
      {loadingData ? (
        <p style={{
          fontSize: 14, color: 'rgba(245,245,244,0.40)',
          textAlign: 'center', padding: '60px 0', margin: 0,
        }}>
          Daten werden geladen…
        </p>
      ) : (
        <>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{
              fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
              fontSize: 24, fontWeight: 400, color: '#f5f5f4',
              margin: '0 0 8px', lineHeight: 1.2,
            }}>
              Meine Wohnung
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.42)', margin: 0, lineHeight: 1.65 }}>
              Ihre Angaben helfen Homelio, passende Interessenten zu finden. Alle Pflichtfelder sind mit * markiert.
            </p>
          </div>

          <form onSubmit={e => { e.preventDefault(); handleSubmit() }} style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>

            {/* ── Adresse ── */}
            <FieldGroup title="Adresse">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 12 }}>
                <Input label="Strasse *" placeholder="Musterstrasse" required
                  value={t.street} onChange={e => setTxt('street', e.target.value)} />
                <Input label="Nr. *" placeholder="12a" required
                  value={t.houseNr} onChange={e => setTxt('houseNr', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12 }}>
                <Input label="PLZ *" placeholder="8001" required
                  value={t.zip} onChange={e => setTxt('zip', e.target.value)} />
                <Input label="Ort *" placeholder="Zürich" required
                  value={t.city} onChange={e => setTxt('city', e.target.value)} />
              </div>
              <Input
                label="Hausverwaltung / Vermieter *"
                placeholder="z.B. Wincasa AG, REME Verwaltung, Privat"
                hint="Name Ihrer aktuellen Verwaltung oder Ihres Vermieters."
                required
                value={t.managementCompany}
                onChange={e => setTxt('managementCompany', e.target.value)}
              />
              <div style={row2}>
                <Input label="Wohnungsnummer" placeholder="z.B. 3a" optional
                  value={t.aptNr} onChange={e => setTxt('aptNr', e.target.value)} />
                <Input label="Stockwerk" placeholder="z.B. 2" type="number" optional
                  value={t.floor} onChange={e => setTxt('floor', e.target.value)} />
              </div>
            </FieldGroup>

            {/* ── Wohnungsdaten ── */}
            <FieldGroup title="Wohnungsdaten">
              <div style={row2}>
                <Select label="Anzahl Zimmer *" options={ROOMS} placeholder="Bitte wählen" value={f.rooms} onChange={e => set('rooms', e.target.value)} />
                <Input label="Wohnfläche m² *" placeholder="75" type="number" required
                  value={t.areaM2} onChange={e => setTxt('areaM2', e.target.value)} />
              </div>
              <div style={row3}>
                <Input label="Bruttomiete CHF *" placeholder="2'200" type="number" required
                  value={t.rentGross} onChange={e => setTxt('rentGross', e.target.value)} />
                <Input label="Nettomiete CHF" placeholder="1'850" type="number" optional
                  value={t.rentNet} onChange={e => setTxt('rentNet', e.target.value)} />
                <Input label="Nebenkosten CHF" placeholder="350" type="number" optional
                  value={t.additionalCosts} onChange={e => setTxt('additionalCosts', e.target.value)} />
              </div>
              <div style={row2}>
                <Select label="Lift vorhanden *" options={ELEVATOR} placeholder="Bitte wählen" value={f.elevator} onChange={e => set('elevator', e.target.value)} />
                <Input label="Frühester Auszug *" type="date" required
                  value={t.earliestMoveOut} onChange={e => setTxt('earliestMoveOut', e.target.value)} />
              </div>
              <Select
                label="Flexibilität beim Auszug *"
                options={FLEXIBILITY}
                placeholder="Bitte wählen"
                value={f.flexibility}
                onChange={e => set('flexibility', e.target.value)}
              />
            </FieldGroup>

            {/* ── Ausstattung ── */}
            <FieldGroup title="Ausstattung" description="Optionale Angaben — helfen bei der Präzision des Matchings.">
              <Toggle label="Balkon" checked={f.hasBalcony} onChange={v => set('hasBalcony', v)} optional />
              <Toggle label="Terrasse" checked={f.hasTerrace} onChange={v => set('hasTerrace', v)} optional />
              <Toggle label="Sitzplatz / Garten" checked={f.hasGarden} onChange={v => set('hasGarden', v)} optional />
              <Toggle label="Keller / Lagerraum" checked={f.hasCellar} onChange={v => set('hasCellar', v)} optional />
              <Toggle label="Rollstuhlgängig" checked={f.isWheelchair} onChange={v => set('isWheelchair', v)} optional />
              <div style={row2}>
                <Select label="Parkierung" options={PARKING} placeholder="Bitte wählen" optional value={f.parkingType} onChange={e => set('parkingType', e.target.value)} />
                <Select label="Waschsituation" options={LAUNDRY} placeholder="Bitte wählen" optional value={f.laundry} onChange={e => set('laundry', e.target.value)} />
              </div>
              <div style={row2}>
                <Select label="Haustiere erlaubt" options={PETS} placeholder="Bitte wählen" optional value={f.petsAllowed} onChange={e => set('petsAllowed', e.target.value)} />
                <Select label="Möblierung" options={FURNISHED} placeholder="Bitte wählen" optional value={f.isFurnished} onChange={e => set('isFurnished', e.target.value)} />
              </div>
              <div style={row2}>
                <Select label="Heizungsart" options={HEATING} placeholder="Bitte wählen" optional value={f.heatingType} onChange={e => set('heatingType', e.target.value)} />
                <Input label="Baujahr / Renovationsjahr" placeholder="z.B. 2003 / 2019" optional
                  value={t.buildRenovYear} onChange={e => setTxt('buildRenovYear', e.target.value)} />
              </div>
            </FieldGroup>

            {/* ── Lage & Umgebung ── */}
            <FieldGroup title="Lage & Umgebung" description="Optionale Angaben zur Lagequalität der Wohnung.">
              <div style={row2}>
                <Select label="Lärmpegel" options={NOISE} placeholder="Bitte wählen" optional value={f.noiseLevel} onChange={e => set('noiseLevel', e.target.value)} />
                <Select label="Ausrichtung / Besonnung" options={ORIENTATION} placeholder="Bitte wählen" optional value={f.orientation} onChange={e => set('orientation', e.target.value)} />
              </div>
              <div style={row2}>
                <Input label="Nächste Haltestelle" placeholder="z.B. Bellevue (Tram 2/4)" optional
                  value={t.nearestStop} onChange={e => setTxt('nearestStop', e.target.value)} />
                <Input label="Fahrzeit ÖV Zentrum (min)" placeholder="z.B. 8" type="number" optional
                  value={t.transportMinutes} onChange={e => setTxt('transportMinutes', e.target.value)} />
              </div>
              <div style={row2}>
                <Select label="Schule / Kita in der Nähe" options={PROXIMITY} placeholder="Bitte wählen" optional value={f.schoolProximity} onChange={e => set('schoolProximity', e.target.value)} />
                <Select label="See / Grünfläche in der Nähe" options={PROXIMITY} placeholder="Bitte wählen" optional value={f.lakeProximity} onChange={e => set('lakeProximity', e.target.value)} />
              </div>
            </FieldGroup>

            {/* ── Hinweise ── */}
            <FieldGroup title="Hinweise" description="Optionale freie Angaben.">
              <TextArea
                label="Besonderheiten der Wohnung"
                placeholder="z.B. Aussenanlagen, Gemeinschaftsräume, Besonderheiten …"
                hint="Was sollten Interessenten über diese Wohnung wissen?"
                optional
                rows={3}
                value={t.highlights}
                onChange={e => setTxt('highlights', e.target.value)}
              />
              <TextArea
                label="Grund für Auszug"
                placeholder="z.B. Jobwechsel, Familienzuwachs, Verkleinerung …"
                hint="Vertraulich — wird nicht direkt an Interessenten weitergegeben."
                optional
                rows={2}
                value={t.moveOutReason}
                onChange={e => setTxt('moveOutReason', e.target.value)}
              />
            </FieldGroup>

            {/* ── Datenschutz & Einwilligung ── */}
            <FieldGroup title="Datenschutz & Einwilligung">
              <Select
                label="Datenschutzeinstellung"
                options={CONFIDENTIALITY}
                value={f.confidentiality}
                onChange={e => set('confidentiality', e.target.value)}
                hint="Bestimmen Sie, wer Ihre Angaben einsehen kann."
              />
              <Toggle
                label="Anonymisierte Datenweitergabe erlauben"
                hint="Homelio darf anonymisierte Wohnungsdaten mit verifizierten Interessenten und Verwaltungen teilen, um das Matching zu verbessern."
                checked={f.allowSharing}
                onChange={v => set('allowSharing', v)}
                optional
              />
              {/* Consent checkbox */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer' }}>
                <div style={{ marginTop: 2, flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={f.isAuthorizedTenant}
                    onChange={e => set('isAuthorizedTenant', e.target.checked)}
                    required
                    style={{ width: 18, height: 18, accentColor: '#d4a853', cursor: 'pointer', flexShrink: 0 }}
                  />
                </div>
                <span style={{ fontSize: 14, color: 'rgba(245,245,244,0.75)', lineHeight: 1.65 }}>
                  Ich bin der aktuelle Mieter dieser Wohnung und bin berechtigt, diese Angaben einzureichen. *
                </span>
              </label>
              <p style={{ fontSize: 12, color: 'rgba(245,245,244,0.28)', margin: 0, lineHeight: 1.65 }}>
                Ihre Daten werden vertraulich behandelt und gemäss unserer{' '}
                <a href="/datenschutz" style={{ color: '#d4a853', textDecoration: 'none' }}>Datenschutzerklärung</a>
                {' '}gespeichert. Sie können Ihre Angaben jederzeit bearbeiten oder löschen.
              </p>
            </FieldGroup>

            {/* ── Fotos ── */}
            <FieldGroup title="Fotos" description="Bis zu 20 Fotos Ihrer aktuellen Wohnung. Helfen Interessenten bei der Einschätzung.">
              <PhotoUpload />
            </FieldGroup>

            {/* ── Save ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
              {saveError && (
                <p style={{ fontSize: 13, color: 'rgba(220,80,80,0.90)', margin: 0, lineHeight: 1.5 }}>
                  {saveError}
                </p>
              )}
              {saveSuccess && (
                <p style={{ fontSize: 13, color: 'rgba(80,200,100,0.90)', margin: 0, lineHeight: 1.5 }}>
                  ✓ Änderungen gespeichert.
                </p>
              )}
              <Button type="submit" fullWidth disabled={saving}>
                {saving ? 'Wird gespeichert…' : 'Profil speichern'}
              </Button>
            </div>

          </form>
        </>
      )}
    </div>
  )
}
