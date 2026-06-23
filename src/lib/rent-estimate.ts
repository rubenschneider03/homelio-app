// Homelio Miet-Einschätzung — pure computation, no external calls, no DB access.

export interface RentEstimateInput {
  city?: string | null
  district?: string | null
  rooms?: number | null
  area_sqm?: number | null
  rent_net?: number | null
  additional_costs?: number | null
  rent_gross?: number | null
  floor?: number | null
  has_balcony?: boolean
  has_elevator?: string | null
  parking_type?: string | null
  laundry?: string | null
}

export interface RentEstimateResult {
  available: boolean
  grossLow?: number
  grossHigh?: number
  netLow?: number
  netHigh?: number
  confidence?: 'Niedrig' | 'Mittel' | 'Hoch'
  comparison?: string
  basis: string
  referenceRateText: string
  missingFields?: string[]
  marketConflictNote?: string
}

// MVP static assumption. Must be kept up to date from BWO hypothekarischer Referenzzinssatz.
const CURRENT_REFERENCE_RATE = 1.25

// Gross CHF/m² baseline by city — used for market sanity check and fallback anchor
const CITY_BASELINES: Array<[string, number]> = [
  ['glattpark', 29], ['opfikon', 29], ['glattbrugg', 29],
  ['zürich', 26], ['zurich', 26],
  ['basel', 23],
  ['bern', 22],
]

const PRIME_ZÜRICH_DISTRICTS = [
  'kreis 1', 'kreis 2', 'kreis 3', 'kreis 4', 'kreis 5',
  'kreis 6', 'kreis 7', 'kreis 8',
  'wiedikon', 'seefeld', 'enge', 'riesbach', 'fluntern',
  'hottingen', 'hirslanden',
]

function cityBaseline(city: string | null | undefined): number {
  if (!city) return 23
  const c = city.toLowerCase()
  for (const [key, val] of CITY_BASELINES) {
    if (c.includes(key)) return val
  }
  return 23
}

// Additional upward adjustment applied to the high end based on location demand
function locationHighAdj(city: string | null | undefined, district: string | null | undefined): number {
  const c = (city ?? '').toLowerCase()
  const d = (district ?? '').toLowerCase()

  if (c.includes('zürich') || c.includes('zurich')) {
    for (const pd of PRIME_ZÜRICH_DISTRICTS) {
      if (d.includes(pd)) return 0.03  // prime Zürich district
    }
    return 0.02  // Zürich, non-prime
  }
  if (d.includes('glattpark') || c.includes('glattpark') || c.includes('opfikon') || c.includes('glattbrugg')) return 0.015
  if (c.includes('basel')) return 0.01
  if (c.includes('bern')) return 0.01
  return 0
}

function round50(n: number): number {
  return Math.round(n / 50) * 50
}

export function computeRentEstimate(input: RentEstimateInput): RentEstimateResult {
  const basis = 'Basierend auf aktueller Miete, Lage, Wohnfläche, Zimmerzahl, Ausstattung und Referenzzinsumfeld.'
  const referenceRateText = `Referenzzinsannahme: ${CURRENT_REFERENCE_RATE.toFixed(2)}%`

  // ── 1. Current gross rent ─────────────────────────────────────────────────────
  let currentGross: number
  let currentNet: number | null = null
  let hasActualRent = false
  const missingFields: string[] = []

  if (input.rent_gross && input.rent_gross > 0) {
    currentGross = input.rent_gross
    hasActualRent = true
    if (input.rent_net && input.rent_net > 0) currentNet = input.rent_net
  } else if (input.rent_net && input.rent_net > 0) {
    currentNet = input.rent_net
    const nk = (input.additional_costs && input.additional_costs > 0)
      ? input.additional_costs
      : Math.max(150, (input.area_sqm ?? 0) * 3.5)
    currentGross = input.rent_net + nk
    hasActualRent = true
  } else {
    // No current rent — fall back to area/market anchor with lower confidence
    missingFields.push('aktuelle Miete')
    if (!input.area_sqm) {
      if (!input.city) missingFields.push('Ort')
      missingFields.push('Wohnfläche')
      return { available: false, basis, referenceRateText, missingFields }
    }
    currentGross = input.area_sqm * cityBaseline(input.city)
    hasActualRent = false
  }

  if (!input.area_sqm) missingFields.push('Wohnfläche')
  if (!input.city) missingFields.push('Ort')

  // ── 2. Base uplift ────────────────────────────────────────────────────────────
  const conservativeLow = currentGross * 1.02
  const optimisticHigh = currentGross * 1.15

  // ── 3. Location adjustment (applied to high end) ──────────────────────────────
  const locAdj = locationHighAdj(input.city, input.district)
  let highEnd = optimisticHigh * (1 + locAdj)

  // ── 4. Feature adjustments (small, applied to high end only) ─────────────────
  let featureAdj = 0
  if (input.has_balcony) featureAdj += 0.01
  const elev = (input.has_elevator ?? '').toLowerCase()
  if (elev && elev !== 'nein' && elev !== 'no' && elev !== 'false' && elev !== 'keiner' && elev !== 'none') featureAdj += 0.01
  const laundry = (input.laundry ?? '').toLowerCase()
  if (laundry.includes('eigen') || laundry.includes('privat') || laundry.includes('in wohnung') || laundry === 'private') featureAdj += 0.01
  const parking = (input.parking_type ?? '').toLowerCase()
  if (parking && parking !== 'keiner' && parking !== 'kein' && parking !== 'none' && parking !== 'nein' && parking !== 'no') featureAdj += 0.01
  if ((input.floor ?? 0) >= 3) featureAdj += 0.005
  highEnd = highEnd * (1 + featureAdj)

  // ── 5. Plausibility cap ───────────────────────────────────────────────────────
  const baseline = cityBaseline(input.city)
  const marketGross = input.area_sqm ? input.area_sqm * baseline : null

  let finalLow = Math.max(conservativeLow, currentGross * 0.98)
  let finalHigh = highEnd
  let marketConflictNote: string | undefined

  if (marketGross) {
    const cap = Math.max(currentGross * 1.20, marketGross * 1.15)
    finalHigh = Math.min(finalHigh, cap)
    if (Math.abs(currentGross - marketGross) / marketGross > 0.35) {
      marketConflictNote = 'Die aktuelle Miete weicht stark von der modellierten Marktmiete ab.'
    }
  }

  // ── 6. Round to nearest CHF 50 ────────────────────────────────────────────────
  const grossLow = round50(finalLow)
  const grossHigh = round50(Math.max(finalHigh, finalLow + 50)) // ensure low < high after rounding

  // ── 7. Net estimate (proportional) ───────────────────────────────────────────
  let netLow: number | undefined
  let netHigh: number | undefined
  if (currentNet && currentNet > 0 && currentGross > 0) {
    const r = currentNet / currentGross
    netLow = round50(grossLow * r)
    netHigh = round50(grossHigh * r)
  }

  // ── 8. Confidence ─────────────────────────────────────────────────────────────
  let confidence: 'Niedrig' | 'Mittel' | 'Hoch'
  if (hasActualRent && input.area_sqm && input.city) {
    confidence = marketConflictNote ? 'Mittel' : 'Hoch'
  } else if (hasActualRent) {
    confidence = 'Mittel'
  } else {
    confidence = 'Niedrig'
  }

  // ── 9. Comparison sentence ────────────────────────────────────────────────────
  let comparison: string
  if (!hasActualRent) {
    comparison = 'Die aktuelle Miete liegt im plausiblen Bereich.'
  } else if (currentGross < grossLow * 0.97) {
    comparison = 'Die aktuelle Miete liegt eher tief.'
  } else if (currentGross > grossHigh * 1.03) {
    comparison = 'Die aktuelle Miete liegt bereits eher hoch.'
  } else {
    comparison = 'Die aktuelle Miete liegt im plausiblen Bereich.'
  }

  return {
    available: true,
    grossLow,
    grossHigh,
    netLow,
    netHigh,
    confidence,
    comparison,
    basis,
    referenceRateText,
    missingFields: missingFields.length > 0 ? missingFields : undefined,
    marketConflictNote,
  }
}
