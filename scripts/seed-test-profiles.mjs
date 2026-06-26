/**
 * Seeds 6 real test profiles with user_ids for AI matchmaker testing.
 * Profiles: 3 males + 3 females, mix of regions/castes.
 */
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://hsympuhzwpiquvovmssc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzeW1wdWh6d3BpcXV2b3Ztc3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjQ1NDcsImV4cCI6MjA5NzMwMDU0N30.iLXE3vTSDhPqDSKiXP7PYY_nYLI8zQmzGdp-IvF937o'
)

const TEST_PROFILES = [
  {
    id: 'a1000001-0000-0000-0000-000000000001',
    user_id: null,
    full_name: 'Aditya Reddy Pullela',
    gender: 'male',
    date_of_birth: '1993-06-15',
    height_cm: 178,
    religion: 'Hindu',
    caste: 'Reddy',
    mother_tongue: 'Telugu',
    native_district: 'Nellore',
    native_state: 'Andhra Pradesh',
    current_city: 'Hyderabad',
    profession: 'Software Engineer',
    education: 'B.Tech - Computer Science, NIT Warangal',
    about: 'Software engineer at a product company. Love cricket, travel, and cooking. Looking for a partner who values family and career equally.',
    photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
    photo_visibility: 'public',
    verified: true,
    profile_created_by: 'self',
    member_number: 9001,
  },
  {
    id: 'a1000002-0000-0000-0000-000000000002',
    user_id: null,
    full_name: 'Karthik Varma Dasari',
    gender: 'male',
    date_of_birth: '1991-03-22',
    height_cm: 175,
    religion: 'Hindu',
    caste: 'Kamma',
    mother_tongue: 'Telugu',
    native_district: 'Krishna',
    native_state: 'Andhra Pradesh',
    current_city: 'Bangalore',
    profession: 'Product Manager',
    education: 'MBA - IIM Bangalore',
    about: 'Product manager at a tech startup. Passionate about building products that matter. Seeking a grounded, ambitious partner.',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    photo_visibility: 'public',
    verified: true,
    profile_created_by: 'self',
    member_number: 9002,
  },
  {
    id: 'a1000003-0000-0000-0000-000000000003',
    user_id: null,
    full_name: 'Venkat Brahmin Sastry',
    gender: 'male',
    date_of_birth: '1994-11-08',
    height_cm: 172,
    religion: 'Hindu',
    caste: 'Brahmin',
    mother_tongue: 'Telugu',
    native_district: 'Guntur',
    native_state: 'Andhra Pradesh',
    current_city: 'Hyderabad',
    profession: 'Data Analyst',
    education: 'M.Sc - Statistics, University of Hyderabad',
    about: 'Data analyst with a love for classical music and philosophy. Traditional values, modern outlook.',
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    photo_visibility: 'public',
    verified: false,
    profile_created_by: 'self',
    member_number: 9003,
  },
  {
    id: 'a1000004-0000-0000-0000-000000000004',
    user_id: null,
    full_name: 'Meghana Reddy Vangala',
    gender: 'female',
    date_of_birth: '1995-09-12',
    height_cm: 163,
    religion: 'Hindu',
    caste: 'Reddy',
    mother_tongue: 'Telugu',
    native_district: 'Nellore',
    native_state: 'Andhra Pradesh',
    current_city: 'Hyderabad',
    profession: 'Doctor',
    education: 'MBBS + MD - Osmania Medical College',
    about: 'Cardiologist resident. Family-oriented, love cooking traditional Telugu food. Looking for someone who respects my career.',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    photo_visibility: 'public',
    verified: true,
    profile_created_by: 'self',
    member_number: 9004,
  },
  {
    id: 'a1000005-0000-0000-0000-000000000005',
    user_id: null,
    full_name: 'Preethi Kamma Nadella',
    gender: 'female',
    date_of_birth: '1993-01-25',
    height_cm: 160,
    religion: 'Hindu',
    caste: 'Kamma',
    mother_tongue: 'Telugu',
    native_district: 'Krishna',
    native_state: 'Andhra Pradesh',
    current_city: 'Bangalore',
    profession: 'UX Designer',
    education: 'B.Des - NID Ahmedabad',
    about: 'Senior UX designer at a product company. Passionate about design, art, and travel. Looking for an intellectually curious partner.',
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
    photo_visibility: 'public',
    verified: true,
    profile_created_by: 'self',
    member_number: 9005,
  },
  {
    id: 'a1000006-0000-0000-0000-000000000006',
    user_id: null,
    full_name: 'Sravani Brahmin Yerra',
    gender: 'female',
    date_of_birth: '1995-07-30',
    height_cm: 158,
    religion: 'Hindu',
    caste: 'Brahmin',
    mother_tongue: 'Telugu',
    native_district: 'Guntur',
    native_state: 'Andhra Pradesh',
    current_city: 'Hyderabad',
    profession: 'Software Engineer',
    education: 'B.Tech - CSE, JNTU Hyderabad',
    about: 'Software engineer at a fintech company. Love music, classical dance (Kuchipudi), and reading. Seeking a caring and ambitious partner.',
    photo_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80',
    photo_visibility: 'public',
    verified: true,
    profile_created_by: 'self',
    member_number: 9006,
  },
]

async function main() {
  console.log('Seeding 6 test profiles with user_ids...\n')

  // Delete any existing test profiles first
  const ids = TEST_PROFILES.map(p => p.id)
  await sb.from('ai_picks').delete().in('for_profile_id', ids)
  await sb.from('ai_picks').delete().in('suggested_profile_id', ids)
  await sb.from('profiles').delete().in('id', ids)

  const { error } = await sb.from('profiles').insert(TEST_PROFILES)
  if (error) {
    console.error('Insert error:', error.message)
    process.exit(1)
  }

  console.log('✅ Inserted 6 test profiles:')
  TEST_PROFILES.forEach(p => console.log(`  ${p.gender === 'male' ? '👨' : '👩'} ${p.full_name} — ${p.native_district}, ${p.caste} — user_id: ${p.user_id}`))

  console.log('\nLogin credentials for testing:')
  console.log('  Set localStorage: my_profile_id + my_user_id to any of the IDs above')
  TEST_PROFILES.forEach(p => console.log(`  ${p.full_name}: ${p.id}`))
}

main().catch(console.error)
