/* Shared shape + helpers for saved search alerts. Used by the API (dedupe
   signature, label, matching) and the client (build payload, render chips). */

export type AlertFilters = {
  region?: string
  state?: string
  district?: string
  ageRange?: string
  profCat?: string
  maritalFilter?: string
  heightRange?: string
  motherTongues?: string[]
  casteFilter?: string
  religionFilter?: string
  educationFilter?: string
  incomeFilter?: string
  activeWithin?: string
  verifiedOnly?: boolean
  photoOnly?: boolean
}

const KEYS: (keyof AlertFilters)[] = [
  'region', 'state', 'district', 'ageRange', 'profCat', 'maritalFilter',
  'heightRange', 'motherTongues', 'casteFilter', 'religionFilter',
  'educationFilter', 'incomeFilter', 'activeWithin', 'verifiedOnly', 'photoOnly',
]

/** Drop empty values so an "all off" filter set normalizes to {}. */
export function normalizeFilters(f: AlertFilters | undefined | null): AlertFilters {
  const out: AlertFilters = {}
  if (!f) return out
  for (const k of KEYS) {
    const v = f[k]
    if (Array.isArray(v)) { if (v.length) (out[k] as string[]) = [...v].sort() }
    else if (typeof v === 'boolean') { if (v) (out[k] as boolean) = true }
    else if (typeof v === 'string') { const t = v.trim(); if (t) (out[k] as string) = t }
  }
  return out
}

/** Stable dedupe key across native place + location + filters. */
export function alertSignature(nativePlace: string, currentLocation: string, filters: AlertFilters): string {
  const nf = normalizeFilters(filters)
  const parts = [`np:${nativePlace.toLowerCase()}`, `cl:${currentLocation.toLowerCase()}`]
  for (const k of KEYS) {
    const v = nf[k]
    if (v === undefined) continue
    parts.push(`${k}:${Array.isArray(v) ? v.join('+') : v}`)
  }
  return parts.join('|')
}

/** Human label for an alert card, e.g. "Guntur · 26-30 · Brahmin". */
export function alertLabel(nativePlace: string, currentLocation: string, filters: AlertFilters): string {
  const nf = normalizeFilters(filters)
  const bits: string[] = []
  if (nativePlace) bits.push(nativePlace)
  else if (nf.district) bits.push(nf.district)
  else if (nf.state) bits.push(nf.state)
  else if (nf.region) bits.push(nf.region)
  if (currentLocation) bits.push(`in ${currentLocation}`)
  if (nf.ageRange) bits.push(nf.ageRange)
  if (nf.casteFilter) bits.push(nf.casteFilter)
  if (nf.religionFilter) bits.push(nf.religionFilter)
  if (nf.profCat) bits.push(nf.profCat)
  if (!bits.length) return 'All profiles'
  return bits.slice(0, 4).join(' · ')
}

/** Short chips describing the alert's filters (for the /alerts page). */
export function alertChips(nativePlace: string, currentLocation: string, filters: AlertFilters): string[] {
  const nf = normalizeFilters(filters)
  const chips: string[] = []
  if (nativePlace) chips.push(`Native: ${nativePlace}`)
  if (currentLocation) chips.push(`Living in: ${currentLocation}`)
  if (nf.region) chips.push(nf.region)
  if (nf.state) chips.push(nf.state)
  if (nf.district) chips.push(nf.district)
  if (nf.ageRange) chips.push(`Age ${nf.ageRange}`)
  if (nf.heightRange) chips.push(nf.heightRange)
  if (nf.casteFilter) chips.push(nf.casteFilter)
  if (nf.religionFilter) chips.push(nf.religionFilter)
  if (nf.motherTongues?.length) chips.push(nf.motherTongues.join(', '))
  if (nf.profCat) chips.push(nf.profCat)
  if (nf.educationFilter) chips.push(nf.educationFilter)
  if (nf.incomeFilter) chips.push(nf.incomeFilter)
  if (nf.maritalFilter) chips.push(nf.maritalFilter)
  if (nf.activeWithin) chips.push(`Active ${nf.activeWithin}`)
  if (nf.verifiedOnly) chips.push('Verified only')
  if (nf.photoOnly) chips.push('With photo')
  return chips
}

/** Build the /browse URL that re-applies an alert's filters. */
export function alertBrowseHref(nativePlace: string, currentLocation: string, filters: AlertFilters): string {
  const nf = normalizeFilters(filters)
  const p = new URLSearchParams()
  if (nativePlace) p.set('native_place', nativePlace)
  if (currentLocation) p.set('current_location', currentLocation)
  for (const k of ['region', 'state', 'district', 'ageRange', 'casteFilter', 'religionFilter'] as const) {
    const v = nf[k]
    if (typeof v === 'string' && v) p.set(k, v)
  }
  const qs = p.toString()
  return qs ? `/browse?${qs}` : '/browse'
}
