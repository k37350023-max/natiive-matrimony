/* Profile completeness — single source of truth used by the header ring,
   the profile page, and onboarding nudges.

   Each field carries a weight; percent = filled weight / total weight.
   `missing` is returned sorted by weight (highest-impact gaps first) so the
   UI can nudge the user toward the field that helps their profile most. */

export type ProfileLike = Record<string, unknown> | null | undefined

type Field = { key: string; label: string; weight: number }

/* Base fields are captured during the quick signup, so a brand-new profile
   already starts partway up the ring instead of an off-putting 0%. */
const FIELDS: Field[] = [
  { key: 'full_name',       label: 'Name',            weight: 4 },
  { key: 'gender',          label: 'Gender',          weight: 4 },
  { key: 'date_of_birth',   label: 'Date of birth',   weight: 4 },
  { key: 'native_state',    label: 'Native state',    weight: 4 },
  { key: 'native_district', label: 'Native district', weight: 4 },
  // High-impact optional fields
  { key: 'photo_url',       label: 'Profile photo',   weight: 18 },
  { key: 'about',           label: 'About you',       weight: 11 },
  { key: 'profession',      label: 'Profession',      weight: 8 },
  { key: 'education',       label: 'Education',        weight: 7 },
  { key: 'height_cm',       label: 'Height',          weight: 6 },
  { key: 'religion',        label: 'Religion',        weight: 5 },
  { key: 'current_city',    label: 'Current city',    weight: 5 },
  { key: 'caste',           label: 'Caste',           weight: 4 },
  { key: 'annual_income',   label: 'Annual income',   weight: 4 },
  { key: 'mother_tongue',   label: 'Mother tongue',   weight: 3 },
  { key: 'family_type',     label: 'Family details',  weight: 3 },
  { key: 'company',         label: 'Company',         weight: 2 },
  { key: 'diet',            label: 'Diet',            weight: 2 },
  { key: 'star',            label: 'Star / Nakshatra', weight: 1 },
  { key: 'rashi',           label: 'Rashi',           weight: 1 },
]

const TOTAL = FIELDS.reduce((s, f) => s + f.weight, 0)

function filled(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim().length > 0
  if (typeof v === 'number') return !Number.isNaN(v)
  return true
}

export function computeCompleteness(profile: ProfileLike): {
  percent: number
  missing: { key: string; label: string }[]
} {
  const p = (profile ?? {}) as Record<string, unknown>
  let earned = 0
  const missing: { key: string; label: string; weight: number }[] = []
  for (const f of FIELDS) {
    if (filled(p[f.key])) earned += f.weight
    else missing.push(f)
  }
  missing.sort((a, b) => b.weight - a.weight)
  return {
    percent: Math.round((earned / TOTAL) * 100),
    missing: missing.map(({ key, label }) => ({ key, label })),
  }
}

/* Columns the completeness check reads — handy for a single Supabase select. */
export const COMPLETENESS_COLUMNS = FIELDS.map(f => f.key).join(', ')
