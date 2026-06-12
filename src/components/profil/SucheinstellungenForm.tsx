'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FieldGroup } from '@/components/ui/FieldGroup'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import { PremiumUpsellCard } from './PremiumUpsellCard'
import { createClient } from '@/lib/supabase/client'

const ROOMS_OPT = [
  { value: '1', label: '1 Zi.' }, { value: '1.5', label: '1.5 Zi.' },
  { value: '2', label: '2 Zi.' }, { value: '2.5', label: '2.5 Zi.' },
  { value: '3', label: '3 Zi.' }, { value: '3.5', label: '3.5 Zi.' },
  { value: '4', label: '4 Zi.' }, { value: '4.5', label: '4.5 Zi.' },
  { value: '5+', label: '5+ Zi.' },
]
const HOUSEHOLD = [
  { value: '1', label: '1 Person' }, { value: '2', label: '2 Personen' },
  { value: '3', label: '3 Personen' }, { value: '4', label: '4 Personen' },
  { value: '5+', label: '5+ Personen' },
]
const TRANSPORT = [
  { value: 'low', label: 'Gering — Auto vorhanden' },
  { value: 'medium', label: 'Mittel — gelegentlich ÖV' },
  { value: 'high', label: 'Hoch — täglich ÖV / kein Auto' },
]
const RADIUS = [
  { value: '1', label: '1 km' }, { value: '2', label: '2 km' },
  { value: '5', label: '5 km' }, { value: '10', label: '10 km' },
  { value: '20', label: '20 km' }, { value: 'any', label: 'Unbegrenzt' },
]
const NOTIFY = [
  { value: 'immediately', label: 'Sofort bei neuem Match' },
  { value: 'daily', label: 'Täglich (Zusammenfassung)' },
  { value: 'weekly', label: 'Wöchentlich' },
]
const BUILDING_AGE = [
  { value: 'new', label: 'Neubau (nach 2000)' },
  { value: 'mid', label: 'Mittleres Baujahr (1970–2000)' },
  { value: 'old', label: 'Altbau (vor 1970)' },
  { value: 'any', label: 'Keine Präferenz' },
]
const NOISE_OPT = [
  { value: 'low', label: 'Gering' },
  { value: 'high', label: 'Hoch — nur ruhige Lagen' },
]
const SUN_OPT = [
  { value: 'south', label: 'Südseite bevorzugt' },
  { value: 'any', label: 'Keine Präferenz' },
]

interface S {
  // Free tier
  cityRegion: string
  maxRentGross: string
  // Premium — text / number / select
  roomsMin: string
  roomsMax: string
  areaMinSqm: string
  desiredMoveIn: string
  householdSize: string
  searchRadiusKm: string
  transportImportance: string
  preferredNeighborhoods: string
  commuteDestination: string
  commuteMaxMinutes: string
  preferredTransitLines: string
  noiseSensitivity: string
  sunOrientation: string
  minFloor: string
  maxWalkToStop: string
  buildingAge: string
  preferredManagements: string
  blockedManagements: string
  notifyFrequency: string
  // Premium — booleans
  hasPets: boolean
  requiresBalcony: boolean
  requiresElevator: boolean
  renovatedKitchen: boolean
  renovatedBathroom: boolean
  requiresPrivateWasher: boolean
  requiresParking: boolean
}

const S_INIT: S = {
  cityRegion: '',
  maxRentGross: '',
  roomsMin: '',
  roomsMax: '',
  areaMinSqm: '',
  desiredMoveIn: '',
  householdSize: '',
  searchRadiusKm: '',
  transportImportance: '',
  preferredNeighborhoods: '',
  commuteDestination: '',
  commuteMaxMinutes: '',
  preferredTransitLines: '',
  noiseSensitivity: '',
  sunOrientation: '',
  minFloor: '',
  maxWalkToStop: '',
  buildingAge: '',
  preferredManagements: '',
  blockedManagements: '',
  notifyFrequency: 'daily',
  hasPets: false,
  requiresBalcony: false,
  requiresElevator: false,
  renovatedKitchen: false,
  renovatedBathroom: false,
  requiresPrivateWasher: false,
  requiresParking: false,
}

const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }

export function SucheinstellungenForm() {
  const router = useRouter()
  const [s, setS] = useState<S>(S_INIT)
  const upd = <K extends keyof S>(k: K, v: S[K]) => setS(p => ({ ...p, [k]: v }))

  const [isPremium, setIsPremium] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/anmelden')
        return
      }

      // Load is_premium from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single()
      setIsPremium(profile?.is_premium ?? false)

      // Load existing search preferences
      const { data: prefs } = await supabase
        .from('search_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (prefs) {
        setS({
          cityRegion: prefs.city_region ?? '',
          maxRentGross: prefs.max_rent_gross?.toString() ?? '',
          roomsMin: prefs.rooms_min?.toString() ?? '',
          roomsMax: prefs.rooms_max?.toString() ?? '',
          areaMinSqm: prefs.area_min_sqm?.toString() ?? '',
          desiredMoveIn: prefs.desired_move_in ?? '',
          householdSize: prefs.household_size ?? '',
          searchRadiusKm: prefs.search_radius_km == null ? 'any' : prefs.search_radius_km.toString(),
          transportImportance: prefs.transport_importance ?? '',
          preferredNeighborhoods: prefs.preferred_neighborhoods ?? '',
          commuteDestination: prefs.commute_destination ?? '',
          commuteMaxMinutes: prefs.commute_max_minutes?.toString() ?? '',
          preferredTransitLines: prefs.preferred_transit_lines ?? '',
          noiseSensitivity: prefs.noise_sensitivity ?? '',
          sunOrientation: prefs.sun_orientation ?? '',
          minFloor: prefs.min_floor?.toString() ?? '',
          maxWalkToStop: prefs.max_walk_to_stop_minutes?.toString() ?? '',
          buildingAge: prefs.building_age ?? '',
          preferredManagements: prefs.preferred_managements ?? '',
          blockedManagements: prefs.blocked_managements ?? '',
          notifyFrequency: prefs.notify_frequency ?? 'daily',
          hasPets: prefs.has_pets ?? false,
          requiresBalcony: prefs.requires_balcony ?? false,
          requiresElevator: prefs.requires_elevator ?? false,
          renovatedKitchen: prefs.renovated_kitchen ?? false,
          renovatedBathroom: prefs.renovated_bathroom ?? false,
          requiresPrivateWasher: prefs.requires_private_washer ?? false,
          requiresParking: prefs.requires_parking ?? false,
        })
      }

      setLoadingData(false)
    }
    loadData()
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

    // Free fields — always saved
    const basePayload = {
      user_id: user.id,
      city_region: s.cityRegion.trim() || null,
      max_rent_gross: parseInt(s.maxRentGross, 10) || null,
    }

    // Premium fields — only saved when profiles.is_premium = true.
    // Non-premium upserts omit these keys so existing premium column values are preserved.
    const premiumPayload = isPremium ? {
      rooms_min: parseFloat(s.roomsMin) || null,
      rooms_max: parseFloat(s.roomsMax) || null,
      area_min_sqm: parseInt(s.areaMinSqm, 10) || null,
      desired_move_in: s.desiredMoveIn || null,
      household_size: s.householdSize || null,
      search_radius_km: s.searchRadiusKm === 'any' ? null : parseInt(s.searchRadiusKm, 10) || null,
      transport_importance: s.transportImportance || null,
      preferred_neighborhoods: s.preferredNeighborhoods.trim() || null,
      commute_destination: s.commuteDestination.trim() || null,
      commute_max_minutes: parseInt(s.commuteMaxMinutes, 10) || null,
      preferred_transit_lines: s.preferredTransitLines.trim() || null,
      noise_sensitivity: s.noiseSensitivity || null,
      sun_orientation: s.sunOrientation || null,
      min_floor: parseInt(s.minFloor, 10) || null,
      max_walk_to_stop_minutes: parseInt(s.maxWalkToStop, 10) || null,
      building_age: s.buildingAge || null,
      preferred_managements: s.preferredManagements.trim() || null,
      blocked_managements: s.blockedManagements.trim() || null,
      notify_frequency: s.notifyFrequency || 'daily',
      has_pets: s.hasPets,
      requires_balcony: s.requiresBalcony,
      requires_elevator: s.requiresElevator,
      renovated_kitchen: s.renovatedKitchen,
      renovated_bathroom: s.renovatedBathroom,
      requires_private_washer: s.requiresPrivateWasher,
      requires_parking: s.requiresParking,
    } : {}

    const { error: prefsError } = await supabase
      .from('search_preferences')
      .upsert(
        { ...basePayload, ...premiumPayload },
        { onConflict: 'user_id' }
      )

    if (prefsError) {
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
      display: 'flex', flexDirection: 'column', gap: 40,
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
          <div>
            <h2 style={{
              fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
              fontSize: 24, fontWeight: 400, color: '#f5f5f4',
              margin: '0 0 8px', lineHeight: 1.2,
            }}>
              Sucheinstellungen
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.42)', margin: 0, lineHeight: 1.65 }}>
              Definieren Sie, welche Wohnungen für Sie in Frage kommen. Mit Premium schalten Sie alle Filter frei und erhalten höhere Matching-Priorität.
            </p>
          </div>

          <form onSubmit={e => { e.preventDefault(); handleSubmit() }} style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

            {/* ── Kostenlose Basissuche ── */}
            <FieldGroup
              title="Basissuche"
              description="Für alle Nutzer kostenlos verfügbar."
            >
              <Input
                label="Gewünschte Stadt / Region"
                placeholder="z.B. Zürich, Winterthur, Basel"
                hint="Mehrere Orte mit Komma trennen."
                value={s.cityRegion}
                onChange={e => upd('cityRegion', e.target.value)}
              />
              <Input
                label="Max. Monatsmiete CHF"
                placeholder="z.B. 2'500"
                type="number"
                hint="Bruttomiete inkl. Nebenkosten."
                value={s.maxRentGross}
                onChange={e => upd('maxRentGross', e.target.value)}
              />
            </FieldGroup>

            {/* ── Premium upsell card — only shown to non-premium users ── */}
            {!isPremium && <PremiumUpsellCard />}

            {/* ── Premium-only fields ── */}
            <div style={{ position: 'relative' }}>

              {/* Lock overlay — only shown for non-premium users */}
              {!isPremium && (
                <div style={{
                  position: 'absolute', inset: -8, zIndex: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 16,
                  background: 'rgba(8,6,3,0.60)',
                }}>
                  <div style={{ textAlign: 'center', padding: '28px 32px' }}>
                    <div style={{ fontSize: 26, marginBottom: 10 }}>🔒</div>
                    <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.55)', margin: '0 0 18px', lineHeight: 1.65 }}>
                      Diese Filter sind exklusiv für Homelio Premium.
                    </p>
                    <button
                      type="button"
                      style={{
                        background: '#d4a853', color: '#0C0A06', border: 'none',
                        borderRadius: 999, padding: '11px 24px',
                        fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        fontFamily: 'inherit', letterSpacing: '0.02em',
                      }}
                    >
                      Premium aktivieren — CHF 9.95 / Monat
                    </button>
                  </div>
                </div>
              )}

              {/* Premium fields — interactive for premium users, dimmed for free users */}
              <div style={{
                opacity: isPremium ? 1 : 0.22,
                pointerEvents: isPremium ? 'auto' : 'none',
                userSelect: isPremium ? 'auto' : 'none',
                display: 'flex', flexDirection: 'column', gap: 36,
              }}>

                <FieldGroup title="Suchfilter" premium>
                  <div style={row2}>
                    <Select label="Min. Zimmer" options={ROOMS_OPT} placeholder="Beliebig" value={s.roomsMin} onChange={e => upd('roomsMin', e.target.value)} optional />
                    <Select label="Max. Zimmer" options={ROOMS_OPT} placeholder="Beliebig" value={s.roomsMax} onChange={e => upd('roomsMax', e.target.value)} optional />
                  </div>
                  <div style={row2}>
                    <Input label="Min. Wohnfläche m²" placeholder="z.B. 60" type="number"
                      value={s.areaMinSqm} onChange={e => upd('areaMinSqm', e.target.value)} />
                    <Input label="Gewünschter Einzug" type="date"
                      value={s.desiredMoveIn} onChange={e => upd('desiredMoveIn', e.target.value)} />
                  </div>
                  <div style={row2}>
                    <Select label="Haushaltsgrösse" options={HOUSEHOLD} placeholder="Bitte wählen" value={s.householdSize} onChange={e => upd('householdSize', e.target.value)} optional />
                    <Select label="Suchradius" options={RADIUS} placeholder="Bitte wählen" value={s.searchRadiusKm} onChange={e => upd('searchRadiusKm', e.target.value)} optional />
                  </div>
                  <Toggle label="Haustier(e) vorhanden" checked={s.hasPets} onChange={v => upd('hasPets', v)} optional />
                  <Toggle label="Balkon / Aussenbereich gewünscht" checked={s.requiresBalcony} onChange={v => upd('requiresBalcony', v)} optional />
                  <Toggle label="Lift zwingend erforderlich" checked={s.requiresElevator} onChange={v => upd('requiresElevator', v)} optional />
                  <Select label="ÖV-Wichtigkeit" options={TRANSPORT} placeholder="Bitte wählen" value={s.transportImportance} onChange={e => upd('transportImportance', e.target.value)} optional />
                  <Input label="Bevorzugte Quartiere / Strassen" placeholder="z.B. Riesbach, Seefeld, Niederdorf"
                    value={s.preferredNeighborhoods} onChange={e => upd('preferredNeighborhoods', e.target.value)} />
                  <div style={row2}>
                    <Input label="Pendelziel (Adresse)" placeholder="z.B. Bahnhofplatz 1, Zürich"
                      value={s.commuteDestination} onChange={e => upd('commuteDestination', e.target.value)} />
                    <Input label="Max. Pendelzeit (min)" placeholder="z.B. 20" type="number"
                      value={s.commuteMaxMinutes} onChange={e => upd('commuteMaxMinutes', e.target.value)} />
                  </div>
                  <Input label="Bevorzugte ÖV-Linien" placeholder="z.B. Tram 4, S3, Bus 31" hint="Mehrere Linien mit Komma trennen."
                    value={s.preferredTransitLines} onChange={e => upd('preferredTransitLines', e.target.value)} />
                </FieldGroup>

                <FieldGroup title="Wohnungsqualität" premium>
                  <div style={row2}>
                    <Select label="Lärmsensibilität" options={NOISE_OPT} placeholder="Bitte wählen" value={s.noiseSensitivity} onChange={e => upd('noiseSensitivity', e.target.value)} optional />
                    <Select label="Besonnung / Ausrichtung" options={SUN_OPT} placeholder="Bitte wählen" value={s.sunOrientation} onChange={e => upd('sunOrientation', e.target.value)} optional />
                  </div>
                  <div style={row2}>
                    <Input label="Bevorzugtes Stockwerk (ab)" placeholder="z.B. 3" type="number"
                      value={s.minFloor} onChange={e => upd('minFloor', e.target.value)} />
                    <Input label="Max. Gehzeit zur Haltestelle (min)" placeholder="z.B. 5" type="number"
                      value={s.maxWalkToStop} onChange={e => upd('maxWalkToStop', e.target.value)} />
                  </div>
                  <Select label="Gebäudealter" options={BUILDING_AGE} placeholder="Keine Präferenz" value={s.buildingAge} onChange={e => upd('buildingAge', e.target.value)} optional />
                  <Toggle label="Renovierte Küche bevorzugt" checked={s.renovatedKitchen} onChange={v => upd('renovatedKitchen', v)} optional />
                  <Toggle label="Renoviertes Bad bevorzugt" checked={s.renovatedBathroom} onChange={v => upd('renovatedBathroom', v)} optional />
                  <Toggle label="Private Waschmaschine in der Wohnung" checked={s.requiresPrivateWasher} onChange={v => upd('requiresPrivateWasher', v)} optional />
                  <Toggle label="Parkplatz / Garage erforderlich" checked={s.requiresParking} onChange={v => upd('requiresParking', v)} optional />
                </FieldGroup>

                <FieldGroup title="Benachrichtigungen & Verwaltungen" premium>
                  <Select label="Benachrichtigungsfrequenz" options={NOTIFY} value={s.notifyFrequency} onChange={e => upd('notifyFrequency', e.target.value)} />
                  <Input label="Bevorzugte Verwaltungen" placeholder="z.B. Wincasa AG, REME Verwaltung" hint="Angebote dieser Verwaltungen bevorzugen." optional
                    value={s.preferredManagements} onChange={e => upd('preferredManagements', e.target.value)} />
                  <Input label="Gesperrte Verwaltungen" placeholder="z.B. Verwaltung XY" hint="Angebote dieser Verwaltungen ausblenden." optional
                    value={s.blockedManagements} onChange={e => upd('blockedManagements', e.target.value)} />
                  {/* "Zweites Suchprofil" has no DB column — future feature placeholder, not saved */}
                  <Input label="Zweites Suchprofil (Name)" placeholder="z.B. Ausweichsuche Winterthur" hint="Bis zu 3 Suchprofile speichern." optional />
                </FieldGroup>

              </div>
            </div>

            {/* ── Save ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {saveError && (
                <p style={{ fontSize: 13, color: 'rgba(220,80,80,0.90)', margin: 0, lineHeight: 1.5 }}>
                  {saveError}
                </p>
              )}
              {saveSuccess && (
                <p style={{ fontSize: 13, color: 'rgba(80,200,100,0.90)', margin: 0, lineHeight: 1.5 }}>
                  ✓ Einstellungen gespeichert.
                </p>
              )}
              <Button type="submit" fullWidth disabled={saving}>
                {saving ? 'Wird gespeichert…' : 'Einstellungen speichern'}
              </Button>
            </div>

          </form>
        </>
      )}
    </div>
  )
}
