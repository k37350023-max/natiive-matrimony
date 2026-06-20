import { createClient } from '@supabase/supabase-js'

const URL  = 'https://hsympuhzwpiquvovmssc.supabase.co'
const KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzeW1wdWh6d3BpcXV2b3Ztc3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjQ1NDcsImV4cCI6MjA5NzMwMDU0N30.iLXE3vTSDhPqDSKiXP7PYY_nYLI8zQmzGdp-IvF937o'
const supabase = createClient(URL, KEY)

// ── 1. Wipe all dependent tables first ─────────────────────────
console.log('🗑  Wiping tables…')
const tables = ['messages','notifications','profile_views','shortlists','interests','matches','profiles']
for (const t of tables) {
  const { error } = await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) console.error(`  ✗ ${t}:`, error.message)
  else        console.log(`  ✓ cleared ${t}`)
}

// ── 2. Seed profiles ────────────────────────────────────────────
// High-quality Unsplash photos — Indian-looking professionals
const PHOTOS = {
  m1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  m2: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  m3: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
  m4: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
  m5: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
  f1: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
  f2: 'https://images.unsplash.com/photo-1494790108755-2616b612b1de?w=400&q=80',
  f3: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
  f4: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80',
  f5: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80',
}

const now = new Date().toISOString()
const daysAgo = (d) => new Date(Date.now() - d*24*60*60*1000).toISOString()

const profiles = [
  // ── GROOMS ──
  {
    full_name: 'Arjun Reddy Vemula',
    gender: 'male',
    date_of_birth: '1995-03-14',
    profession: 'Software Engineer',
    education: 'B.Tech - Computer Science, NIT Warangal',
    height_cm: 178,
    religion: 'Hindu',
    caste: 'Reddy',
    gotra: 'Bharadwaja',
    mother_tongue: 'Telugu',
    native_district: 'Hyderabad',
    native_state: 'Telangana',
    native_region: 'Telangana',
    current_city: 'Hyderabad',
    marital_status: 'Never Married',
    family_type: 'Nuclear',
    father_name: 'Venkateswara Reddy Vemula',
    siblings: JSON.stringify([{ name: 'Sravani', relation: 'Sister', married: true }]),
    diet: 'Non-Vegetarian',
    star: 'Rohini',
    about: 'I am a passionate software engineer at a leading IT company in Hyderabad. I enjoy trekking, cricket, and exploring local cuisine. Looking for a life partner who values family and has a career of her own. I believe in equal partnership and mutual respect.',
    photo_url: PHOTOS.m1,
    photo_visibility: 'public',
    status: 'approved',
    verified: true,
    email: 'arjun.vemula@gmail.com',
    phone: '9876543210',
    pref_age_min: 23,
    pref_age_max: 28,
    profile_created_by: 'self',
    last_login_at: daysAgo(0),
    created_at: daysAgo(5),
    member_number: 1,
  },
  {
    full_name: 'Karthik Sharma Naidu',
    gender: 'male',
    date_of_birth: '1993-07-22',
    profession: 'Doctor - MBBS, MD',
    education: 'MD - Internal Medicine, Osmania Medical College',
    height_cm: 175,
    religion: 'Hindu',
    caste: 'Naidu',
    gotra: 'Vishwamitra',
    mother_tongue: 'Telugu',
    native_district: 'Visakhapatnam',
    native_state: 'Andhra Pradesh',
    native_region: 'Coastal Andhra',
    current_city: 'Hyderabad',
    marital_status: 'Never Married',
    family_type: 'Joint',
    father_name: 'Ramakrishna Naidu',
    siblings: JSON.stringify([{ name: 'Deepika', relation: 'Sister', married: false }]),
    diet: 'Vegetarian',
    star: 'Hasta',
    about: 'Practising physician at Apollo Hospitals with a passion for patient care. I come from a traditional joint family in Vizag but am currently based in Hyderabad. Love classical music, yoga, and weekend trips to the coast. Seeking a warm, educated partner who appreciates both tradition and modernity.',
    photo_url: PHOTOS.m2,
    photo_visibility: 'public',
    status: 'approved',
    verified: true,
    email: 'karthik.naidu@gmail.com',
    phone: '9876543211',
    pref_age_min: 24,
    pref_age_max: 30,
    profile_created_by: 'self',
    last_login_at: daysAgo(1),
    created_at: daysAgo(8),
    member_number: 2,
  },
  {
    full_name: 'Rohit Varma Challa',
    gender: 'male',
    date_of_birth: '1996-11-05',
    profession: 'Chartered Accountant',
    education: 'CA Final, ICAI',
    height_cm: 172,
    religion: 'Hindu',
    caste: 'Kamma',
    gotra: 'Kaundinya',
    mother_tongue: 'Telugu',
    native_district: 'Guntur',
    native_state: 'Andhra Pradesh',
    native_region: 'Coastal Andhra',
    current_city: 'Bangalore',
    marital_status: 'Never Married',
    family_type: 'Nuclear',
    father_name: 'Subrahmanyam Challa',
    siblings: JSON.stringify([]),
    diet: 'Non-Vegetarian',
    star: 'Ashwini',
    about: 'CA working with a Big 4 firm in Bangalore. I am the only child and my parents are looking for a settled match. I enjoy badminton, cooking, and watching Telugu movies. Looking for someone who is family-oriented and professionally driven.',
    photo_url: PHOTOS.m3,
    photo_visibility: 'public',
    status: 'approved',
    verified: true,
    email: 'rohit.challa@gmail.com',
    phone: '9876543212',
    pref_age_min: 22,
    pref_age_max: 27,
    profile_created_by: 'parent',
    last_login_at: daysAgo(2),
    created_at: daysAgo(3),
    member_number: 3,
  },
  {
    full_name: 'Sai Teja Boddupalli',
    gender: 'male',
    date_of_birth: '1994-01-30',
    profession: 'Data Scientist',
    education: 'M.Tech - AI & ML, IIT Hyderabad',
    height_cm: 180,
    religion: 'Hindu',
    caste: 'Brahmin',
    gotra: 'Atreya',
    mother_tongue: 'Telugu',
    native_district: 'Warangal',
    native_state: 'Telangana',
    native_region: 'Telangana',
    current_city: 'Pune',
    marital_status: 'Never Married',
    family_type: 'Nuclear',
    father_name: 'Nageshwara Rao Boddupalli',
    siblings: JSON.stringify([{ name: 'Anusha', relation: 'Sister', married: true }]),
    diet: 'Vegetarian',
    star: 'Mrigashira',
    about: 'Data scientist at a fintech startup in Pune. IIT graduate who loves problem-solving both at work and in life. Passionate about chess, philosophy, and cooking traditional Telugu food. Looking for an intellectually curious partner who enjoys deep conversations.',
    photo_url: PHOTOS.m4,
    photo_visibility: 'public',
    status: 'approved',
    verified: true,
    email: 'saiteja.boddupalli@gmail.com',
    phone: '9876543213',
    pref_age_min: 23,
    pref_age_max: 29,
    profile_created_by: 'self',
    last_login_at: daysAgo(0),
    created_at: daysAgo(1),
    member_number: 4,
  },
  {
    full_name: 'Vikram Rao Annavarapu',
    gender: 'male',
    date_of_birth: '1992-09-18',
    profession: 'Civil Engineer',
    education: 'B.Tech - Civil, JNTU Kakinada',
    height_cm: 176,
    religion: 'Hindu',
    caste: 'Kapu',
    gotra: 'Shrivatsa',
    mother_tongue: 'Telugu',
    native_district: 'Rajahmundry',
    native_state: 'Andhra Pradesh',
    native_region: 'Coastal Andhra',
    current_city: 'Hyderabad',
    marital_status: 'Never Married',
    family_type: 'Joint',
    father_name: 'Venkata Rao Annavarapu',
    siblings: JSON.stringify([{ name: 'Srikanth', relation: 'Brother', married: true }, { name: 'Madhuri', relation: 'Sister', married: false }]),
    diet: 'Non-Vegetarian',
    star: 'Punarvasu',
    about: 'Civil engineer working on large infrastructure projects in Hyderabad. Belong to a well-settled agricultural family from Rajahmundry. I enjoy river-side walks, photography, and Carnatic music. Seeking a homely and educated life partner from a traditional Telugu family.',
    photo_url: PHOTOS.m5,
    photo_visibility: 'public',
    status: 'approved',
    verified: true,
    email: 'vikram.annavarapu@gmail.com',
    phone: '9876543214',
    pref_age_min: 24,
    pref_age_max: 30,
    profile_created_by: 'parent',
    last_login_at: daysAgo(3),
    created_at: daysAgo(12),
    member_number: 5,
  },

  // ── BRIDES ──
  {
    full_name: 'Priya Lakshmi Gudipati',
    gender: 'female',
    date_of_birth: '1997-06-12',
    profession: 'Software Engineer',
    education: 'B.Tech - IT, BITS Pilani',
    height_cm: 163,
    religion: 'Hindu',
    caste: 'Reddy',
    gotra: 'Bharadwaja',
    mother_tongue: 'Telugu',
    native_district: 'Hyderabad',
    native_state: 'Telangana',
    native_region: 'Telangana',
    current_city: 'Hyderabad',
    marital_status: 'Never Married',
    family_type: 'Nuclear',
    father_name: 'Srinivas Gudipati',
    siblings: JSON.stringify([{ name: 'Arun', relation: 'Brother', married: false }]),
    diet: 'Non-Vegetarian',
    star: 'Bharani',
    about: 'Software engineer at Microsoft, Hyderabad. BITS Pilani graduate who is passionate about technology and social impact. I love reading, Bharatanatyam, and cooking healthy meals. Looking for an ambitious, kind-hearted partner who respects individuality and values strong family bonds.',
    photo_url: PHOTOS.f1,
    photo_visibility: 'public',
    status: 'approved',
    verified: true,
    email: 'priya.gudipati@gmail.com',
    phone: '9876543215',
    pref_age_min: 26,
    pref_age_max: 32,
    profile_created_by: 'self',
    last_login_at: daysAgo(0),
    created_at: daysAgo(4),
    member_number: 6,
  },
  {
    full_name: 'Ananya Rao Kakarlapudi',
    gender: 'female',
    date_of_birth: '1996-02-28',
    profession: 'Doctor - MBBS',
    education: 'MBBS, Andhra Medical College, Vizag',
    height_cm: 160,
    religion: 'Hindu',
    caste: 'Brahmin',
    gotra: 'Koundinya',
    mother_tongue: 'Telugu',
    native_district: 'Visakhapatnam',
    native_state: 'Andhra Pradesh',
    native_region: 'Coastal Andhra',
    current_city: 'Visakhapatnam',
    marital_status: 'Never Married',
    family_type: 'Joint',
    father_name: 'Venkateswara Rao Kakarlapudi',
    siblings: JSON.stringify([{ name: 'Rahul', relation: 'Brother', married: false }]),
    diet: 'Vegetarian',
    star: 'Pushyami',
    about: 'Junior resident doctor completing my MD in Paediatrics. I come from a deeply rooted Telugu Brahmin family in Vizag. I enjoy Sanskrit slokas, classical music, and painting. Seeking a well-settled, understanding partner who appreciates traditional values while supporting my career.',
    photo_url: PHOTOS.f2,
    photo_visibility: 'public',
    status: 'approved',
    verified: true,
    email: 'ananya.kakarlapudi@gmail.com',
    phone: '9876543216',
    pref_age_min: 27,
    pref_age_max: 33,
    profile_created_by: 'parent',
    last_login_at: daysAgo(1),
    created_at: daysAgo(6),
    member_number: 7,
  },
  {
    full_name: 'Divya Sri Mangipudi',
    gender: 'female',
    date_of_birth: '1998-09-03',
    profession: 'MBA - Finance',
    education: 'MBA - Finance, IIM Indore',
    height_cm: 165,
    religion: 'Hindu',
    caste: 'Kamma',
    gotra: 'Kaundinya',
    mother_tongue: 'Telugu',
    native_district: 'Krishna',
    native_state: 'Andhra Pradesh',
    native_region: 'Coastal Andhra',
    current_city: 'Mumbai',
    marital_status: 'Never Married',
    family_type: 'Nuclear',
    father_name: 'Satish Mangipudi',
    siblings: JSON.stringify([{ name: 'Nikhil', relation: 'Brother', married: false }]),
    diet: 'Non-Vegetarian',
    star: 'Uttara',
    about: 'IIM Indore graduate working as an investment analyst in Mumbai. I am passionate about financial markets, fitness, and travel. Visiting 30+ countries has broadened my perspective, but I remain deeply connected to my Telugu roots. Looking for someone who is ambitious, grounded, and loves life.',
    photo_url: PHOTOS.f3,
    photo_visibility: 'public',
    status: 'approved',
    verified: true,
    email: 'divya.mangipudi@gmail.com',
    phone: '9876543217',
    pref_age_min: 26,
    pref_age_max: 32,
    profile_created_by: 'self',
    last_login_at: daysAgo(0),
    created_at: daysAgo(2),
    member_number: 8,
  },
  {
    full_name: 'Keerthi Vardhini Pasala',
    gender: 'female',
    date_of_birth: '1995-12-20',
    profession: 'Lawyer',
    education: 'LLB, NALSAR University of Law',
    height_cm: 162,
    religion: 'Hindu',
    caste: 'Naidu',
    gotra: 'Vishwamitra',
    mother_tongue: 'Telugu',
    native_district: 'Nalgonda',
    native_state: 'Telangana',
    native_region: 'Telangana',
    current_city: 'Hyderabad',
    marital_status: 'Never Married',
    family_type: 'Nuclear',
    father_name: 'Krishna Murthy Pasala',
    siblings: JSON.stringify([{ name: 'Siddharth', relation: 'Brother', married: false }]),
    diet: 'Non-Vegetarian',
    star: 'Swati',
    about: 'Practising advocate at the Telangana High Court specialising in corporate and family law. NALSAR alumna who is passionate about justice and community work. I enjoy debates, theatre, and cooking traditional Telangana recipes. Seeking a confident, independent partner who respects my profession and ambitions.',
    photo_url: PHOTOS.f4,
    photo_visibility: 'public',
    status: 'approved',
    verified: true,
    email: 'keerthi.pasala@gmail.com',
    phone: '9876543218',
    pref_age_min: 27,
    pref_age_max: 34,
    profile_created_by: 'self',
    last_login_at: daysAgo(2),
    created_at: daysAgo(9),
    member_number: 9,
  },
  {
    full_name: 'Swathi Nandini Yerramilli',
    gender: 'female',
    date_of_birth: '1997-04-08',
    profession: 'UX Designer',
    education: 'B.Des - Design, NID Ahmedabad',
    height_cm: 161,
    religion: 'Hindu',
    caste: 'Reddy',
    gotra: 'Bharadwaja',
    mother_tongue: 'Telugu',
    native_district: 'Khammam',
    native_state: 'Telangana',
    native_region: 'Telangana',
    current_city: 'Bangalore',
    marital_status: 'Never Married',
    family_type: 'Nuclear',
    father_name: 'Raju Yerramilli',
    siblings: JSON.stringify([{ name: 'Vyshnavi', relation: 'Sister', married: false }]),
    diet: 'Vegetarian',
    star: 'Chitra',
    about: 'NID graduate working as a senior UX designer at a top product company in Bangalore. I channel creativity in both my career and hobbies — sketching, pottery, and photography. I am close to my roots and visit Khammam every festival. Looking for a creative, thoughtful partner who loves art and adventure equally.',
    photo_url: PHOTOS.f5,
    photo_visibility: 'public',
    status: 'approved',
    verified: true,
    email: 'swathi.yerramilli@gmail.com',
    phone: '9876543219',
    pref_age_min: 25,
    pref_age_max: 31,
    profile_created_by: 'self',
    last_login_at: daysAgo(0),
    created_at: daysAgo(1),
    member_number: 10,
  },
]

console.log('\n👤 Inserting profiles…')
const { data: inserted, error: insertErr } = await supabase.from('profiles').insert(profiles).select('id, full_name, gender')
if (insertErr) { console.error('Insert error:', insertErr); process.exit(1) }
console.log(`  ✓ Inserted ${inserted.length} profiles`)

// ── 3. Create sample interests & matches ──────────────────────
const grooms = inserted.filter(p => p.gender === 'male')
const brides = inserted.filter(p => p.gender === 'female')

// Pair 1: Arjun → Priya (mutual match)
// Pair 2: Karthik → Ananya (mutual match)
// Pair 3: Rohit → Divya (interest sent, pending)
// Pair 4: Sai Teja → Swathi (interest sent, pending)
// Pair 5: Divya → Vikram (she sent interest to him)

const interestPairs = [
  { from: grooms[0], to: brides[0], status: 'accepted' }, // Arjun → Priya
  { from: brides[0], to: grooms[0], status: 'accepted' }, // Priya → Arjun (mutual)
  { from: grooms[1], to: brides[1], status: 'accepted' }, // Karthik → Ananya
  { from: brides[1], to: grooms[1], status: 'accepted' }, // Ananya → Karthik (mutual)
  { from: grooms[2], to: brides[2], status: 'pending'  }, // Rohit → Divya
  { from: grooms[3], to: brides[4], status: 'pending'  }, // Sai Teja → Swathi
  { from: brides[2], to: grooms[4], status: 'pending'  }, // Divya → Vikram
  { from: grooms[4], to: brides[3], status: 'pending'  }, // Vikram → Keerthi
]

const interestsToInsert = interestPairs.map(p => ({
  from_user: p.from.id,
  to_user: p.to.id,
  status: p.status,
  note: p.status === 'accepted' ? 'Loved your profile!' : 'Would love to connect!',
}))

const { error: intErr } = await supabase.from('interests').insert(interestsToInsert)
if (intErr) console.error('Interest error:', intErr.message)
else console.log(`  ✓ Created ${interestsToInsert.length} interests`)

// ── 4. Create matches for accepted pairs ──────────────────────
const matchPairs = [
  [grooms[0].id, brides[0].id], // Arjun & Priya
  [grooms[1].id, brides[1].id], // Karthik & Ananya
]
const matchRows = matchPairs.map(([u1, u2]) => ({ user1: u1, user2: u2 }))
const { data: matches, error: matchErr } = await supabase.from('matches').insert(matchRows).select('id, user1, user2')
if (matchErr) console.error('Match error:', matchErr.message)
else console.log(`  ✓ Created ${matches.length} matches`)

// ── 5. Seed chat messages ─────────────────────────────────────
if (matches?.length) {
  const [m1, m2] = matches

  const msgs = [
    // Arjun & Priya conversation
    { match_id: m1.id, from_profile_id: m1.user1, content: 'Hi Priya! I came across your profile and was really impressed. Would love to connect!', created_at: daysAgo(3) },
    { match_id: m1.id, from_profile_id: m1.user2, content: 'Hi Arjun! Thank you, your profile is lovely too 😊 Which part of Hyderabad are you from?', created_at: new Date(Date.now() - 3*24*60*60*1000 + 30*60*1000).toISOString() },
    { match_id: m1.id, from_profile_id: m1.user1, content: 'I am from Banjara Hills. I saw you work at Microsoft — thats amazing! What team are you in?', created_at: new Date(Date.now() - 3*24*60*60*1000 + 60*60*1000).toISOString() },
    { match_id: m1.id, from_profile_id: m1.user2, content: 'Azure cloud team! And you\'re in software too right? Would be great to catch up over coffee sometime.', created_at: new Date(Date.now() - 2*24*60*60*1000).toISOString() },
    { match_id: m1.id, from_profile_id: m1.user1, content: 'That sounds wonderful! Are you free this weekend? There\'s a nice place in Jubilee Hills we could meet at.', created_at: new Date(Date.now() - 1*24*60*60*1000).toISOString() },
    { match_id: m1.id, from_profile_id: m1.user2, content: 'Saturday works perfectly for me! 😊', created_at: new Date(Date.now() - 2*60*60*1000).toISOString() },

    // Karthik & Ananya conversation
    { match_id: m2.id, from_profile_id: m2.user1, content: 'Namaste Ananya! Fellow doctor here — I really liked your profile. It\'s rare to find someone so dedicated to paediatrics.', created_at: daysAgo(2) },
    { match_id: m2.id, from_profile_id: m2.user2, content: 'Namaste Karthik! Thank you so much 🙏 Internal medicine is such important work too. Apollo Hospitals is top-class.', created_at: new Date(Date.now() - 2*24*60*60*1000 + 45*60*1000).toISOString() },
    { match_id: m2.id, from_profile_id: m2.user1, content: 'Are you planning to do MD after your MBBS? I am happy to share any guidance if useful.', created_at: new Date(Date.now() - 1*24*60*60*1000).toISOString() },
    { match_id: m2.id, from_profile_id: m2.user2, content: 'Yes! Currently preparing for DNB. Would really appreciate your guidance 😊 When are you next in Vizag?', created_at: new Date(Date.now() - 3*60*60*1000).toISOString() },
  ]

  const { error: msgErr } = await supabase.from('messages').insert(msgs)
  if (msgErr) console.error('Messages error:', msgErr.message)
  else console.log(`  ✓ Created ${msgs.length} chat messages`)
}

// ── 6. Seed profile views ─────────────────────────────────────
const viewPairs = [
  { viewer_id: grooms[0].id, viewed_id: brides[1].id },
  { viewer_id: grooms[0].id, viewed_id: brides[2].id },
  { viewer_id: grooms[1].id, viewed_id: brides[0].id },
  { viewer_id: brides[0].id, viewed_id: grooms[1].id },
  { viewer_id: brides[0].id, viewed_id: grooms[2].id },
  { viewer_id: brides[2].id, viewed_id: grooms[3].id },
]
const { error: viewErr } = await supabase.from('profile_views').insert(viewPairs)
if (viewErr) console.error('Views error:', viewErr.message)
else console.log(`  ✓ Created ${viewPairs.length} profile views`)

// ── 7. Seed shortlists ────────────────────────────────────────
const slPairs = [
  { by_profile_id: grooms[0].id, profile_id: brides[2].id },
  { by_profile_id: grooms[1].id, profile_id: brides[3].id },
  { by_profile_id: brides[0].id, profile_id: grooms[2].id },
  { by_profile_id: brides[3].id, profile_id: grooms[0].id },
]
const { error: slErr } = await supabase.from('shortlists').insert(slPairs)
if (slErr) console.error('Shortlist error:', slErr.message)
else console.log(`  ✓ Created ${slPairs.length} shortlists`)

console.log('\n✅ Reseed complete! 10 profiles, interests, matches, chats all set.\n')
