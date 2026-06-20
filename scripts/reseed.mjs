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

// ── 2. Photo pool ───────────────────────────────────────────────
const M = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&q=80',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
]
const F = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
  'https://images.unsplash.com/photo-1494790108755-2616b612b1de?w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
]

const daysAgo = (d, extraMs = 0) => new Date(Date.now() - d*24*60*60*1000 + extraMs).toISOString()
const m = (i) => M[i % M.length]
const f = (i) => F[i % F.length]

const profiles = [
  // ══════════════ TELANGANA GROOMS (5) ══════════════
  {
    full_name: 'Arjun Reddy Vemula', gender: 'male', date_of_birth: '1995-03-14',
    profession: 'Software Engineer', education: 'B.Tech - Computer Science, NIT Warangal',
    height_cm: 178, religion: 'Hindu', caste: 'Reddy', mother_tongue: 'Telugu',
    native_district: 'Hyderabad', native_state: 'Telangana', native_region: 'Telangana',
    current_city: 'Hyderabad', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Rohini',
    about: 'Software engineer at a leading IT company in Hyderabad. I enjoy trekking, cricket, and exploring local cuisine. Looking for a life partner who values family and has a career of her own.',
    photo_url: m(0), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'arjun.vemula@ntvtest.com', phone: '9876543210',
    pref_age_min: 23, pref_age_max: 28, profile_created_by: 'self',
    last_login_at: daysAgo(0), created_at: daysAgo(5), member_number: 1,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Sai Teja Boddupalli', gender: 'male', date_of_birth: '1994-01-30',
    profession: 'Data Scientist', education: 'M.Tech - AI & ML, IIT Hyderabad',
    height_cm: 180, religion: 'Hindu', caste: 'Brahmin', mother_tongue: 'Telugu',
    native_district: 'Warangal', native_state: 'Telangana', native_region: 'Telangana',
    current_city: 'Pune', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Vegetarian', star: 'Mrigashira',
    about: 'Data scientist at a fintech startup in Pune. IIT graduate who loves chess, philosophy, and cooking traditional Telugu food. Looking for an intellectually curious partner.',
    photo_url: m(1), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'saiteja.boddupalli@ntvtest.com', phone: '9876543211',
    pref_age_min: 23, pref_age_max: 29, profile_created_by: 'self',
    last_login_at: daysAgo(0), created_at: daysAgo(1), member_number: 2,
    annual_income: '₹20L–50L',
  },
  {
    full_name: 'Rahul Naidu Cherukuri', gender: 'male', date_of_birth: '1993-08-22',
    profession: 'Product Manager', education: 'MBA, IIM Bangalore',
    height_cm: 175, religion: 'Hindu', caste: 'Naidu', mother_tongue: 'Telugu',
    native_district: 'Karimnagar', native_state: 'Telangana', native_region: 'Telangana',
    current_city: 'Bangalore', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Non-Vegetarian', star: 'Hasta',
    about: 'Product Manager at a Series B startup in Bangalore. Love cricket, travel, and long drives. From a traditional Naidu family in Karimnagar, now settled in Bangalore.',
    photo_url: m(2), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'rahul.cherukuri@ntvtest.com', phone: '9876543212',
    pref_age_min: 25, pref_age_max: 30, profile_created_by: 'parent',
    last_login_at: daysAgo(1), created_at: daysAgo(7), member_number: 3,
    annual_income: '₹20L–50L',
  },
  {
    full_name: 'Varun Kapu Marella', gender: 'male', date_of_birth: '1996-05-10',
    profession: 'Chartered Accountant', education: 'CA Final, ICAI',
    height_cm: 172, religion: 'Hindu', caste: 'Kapu', mother_tongue: 'Telugu',
    native_district: 'Khammam', native_state: 'Telangana', native_region: 'Telangana',
    current_city: 'Hyderabad', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Ashwini',
    about: 'CA working with a Big 4 firm in Hyderabad. I enjoy badminton, cooking, and Telugu movies. Looking for someone who is family-oriented and professionally driven.',
    photo_url: m(3), photo_visibility: 'public', status: 'approved', verified: false,
    email: 'varun.marella@ntvtest.com', phone: '9876543213',
    pref_age_min: 22, pref_age_max: 27, profile_created_by: 'self',
    last_login_at: daysAgo(2), created_at: daysAgo(3), member_number: 4,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Aditya Velama Koduri', gender: 'male', date_of_birth: '1992-11-15',
    profession: 'Government Officer - IAS', education: 'B.Tech + UPSC, JNTU',
    height_cm: 176, religion: 'Hindu', caste: 'Velama', mother_tongue: 'Telugu',
    native_district: 'Nalgonda', native_state: 'Telangana', native_region: 'Telangana',
    current_city: 'Hyderabad', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Non-Vegetarian', star: 'Punarvasu',
    about: 'IAS officer currently posted in Telangana. Come from a well-established Velama family. I enjoy reading, classical music, and public service. Seeking an educated, cultured life partner.',
    photo_url: m(4), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'aditya.koduri@ntvtest.com', phone: '9876543214',
    pref_age_min: 24, pref_age_max: 30, profile_created_by: 'parent',
    last_login_at: daysAgo(3), created_at: daysAgo(12), member_number: 5,
    annual_income: '₹10L–20L',
  },

  // ══════════════ ANDHRA PRADESH GROOMS (4) ══════════════
  {
    full_name: 'Karthik Sharma Naidu', gender: 'male', date_of_birth: '1993-07-22',
    profession: 'Doctor - MBBS, MD', education: 'MD - Internal Medicine, Osmania Medical College',
    height_cm: 175, religion: 'Hindu', caste: 'Naidu', mother_tongue: 'Telugu',
    native_district: 'Visakhapatnam', native_state: 'Andhra Pradesh', native_region: 'Coastal Andhra',
    current_city: 'Hyderabad', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Vegetarian', star: 'Hasta',
    about: 'Practising physician at Apollo Hospitals. I come from a traditional joint family in Vizag. Love classical music, yoga, and weekend trips to the coast. Seeking a warm, educated partner.',
    photo_url: m(5), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'karthik.naidu@ntvtest.com', phone: '9876543215',
    pref_age_min: 24, pref_age_max: 30, profile_created_by: 'self',
    last_login_at: daysAgo(1), created_at: daysAgo(8), member_number: 6,
    annual_income: '₹20L–50L',
  },
  {
    full_name: 'Rohit Varma Challa', gender: 'male', date_of_birth: '1996-11-05',
    profession: 'Chartered Accountant', education: 'CA Final, ICAI',
    height_cm: 172, religion: 'Hindu', caste: 'Kamma', mother_tongue: 'Telugu',
    native_district: 'Guntur', native_state: 'Andhra Pradesh', native_region: 'Coastal Andhra',
    current_city: 'Bangalore', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Ashwini',
    about: 'CA working with a Big 4 firm in Bangalore. Only child, parents are looking for a settled match. Enjoy badminton, cooking, and Telugu movies.',
    photo_url: m(6), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'rohit.challa@ntvtest.com', phone: '9876543216',
    pref_age_min: 22, pref_age_max: 27, profile_created_by: 'parent',
    last_login_at: daysAgo(2), created_at: daysAgo(3), member_number: 7,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Vikram Rao Annavarapu', gender: 'male', date_of_birth: '1992-09-18',
    profession: 'Civil Engineer', education: 'B.Tech - Civil, JNTU Kakinada',
    height_cm: 176, religion: 'Hindu', caste: 'Kapu', mother_tongue: 'Telugu',
    native_district: 'East Godavari', native_state: 'Andhra Pradesh', native_region: 'Coastal Andhra',
    current_city: 'Hyderabad', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Non-Vegetarian', star: 'Punarvasu',
    about: 'Civil engineer working on large infrastructure projects in Hyderabad. From a well-settled agricultural family from Rajahmundry. Enjoy river-side walks, photography, and Carnatic music.',
    photo_url: m(7), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'vikram.annavarapu@ntvtest.com', phone: '9876543217',
    pref_age_min: 24, pref_age_max: 30, profile_created_by: 'parent',
    last_login_at: daysAgo(3), created_at: daysAgo(12), member_number: 8,
    annual_income: '₹6L–10L',
  },
  {
    full_name: 'Suresh Reddy Namburi', gender: 'male', date_of_birth: '1994-04-12',
    profession: 'Business Analyst', education: 'MBA, IIM Kozhikode',
    height_cm: 174, religion: 'Hindu', caste: 'Reddy', mother_tongue: 'Telugu',
    native_district: 'Kurnool', native_state: 'Andhra Pradesh', native_region: 'Rayalaseema',
    current_city: 'Hyderabad', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Jyeshtha',
    about: 'Business analyst at a top consulting firm in Hyderabad. I enjoy strategic thinking, travelling and weekend hikes. Looking for an independent, career-driven partner from a good family.',
    photo_url: m(8), photo_visibility: 'public', status: 'approved', verified: false,
    email: 'suresh.namburi@ntvtest.com', phone: '9876543218',
    pref_age_min: 24, pref_age_max: 29, profile_created_by: 'self',
    last_login_at: daysAgo(5), created_at: daysAgo(15), member_number: 9,
    annual_income: '₹10L–20L',
  },

  // ══════════════ KARNATAKA GROOMS (3) ══════════════
  {
    full_name: 'Nikhil Gowda Prasad', gender: 'male', date_of_birth: '1995-06-25',
    profession: 'Software Engineer', education: 'B.E. - CSE, RV College Bangalore',
    height_cm: 177, religion: 'Hindu', caste: 'Brahmin', mother_tongue: 'Kannada',
    native_district: 'Bengaluru Urban', native_state: 'Karnataka', native_region: '',
    current_city: 'Bangalore', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Vegetarian', star: 'Rohini',
    about: 'Full-stack developer at a Bangalore product startup. Born and raised in Bangalore but my roots are in a small Kannada Brahmin village. I love filter coffee, trekking the Western Ghats, and cooking.',
    photo_url: m(9), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'nikhil.gowda@ntvtest.com', phone: '9876543219',
    pref_age_min: 23, pref_age_max: 28, profile_created_by: 'self',
    last_login_at: daysAgo(0), created_at: daysAgo(4), member_number: 10,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Ravi Lingayat Hosamani', gender: 'male', date_of_birth: '1993-02-14',
    profession: 'Doctor - Surgeon', education: 'MS - Surgery, Bangalore Medical College',
    height_cm: 180, religion: 'Hindu', caste: 'Lingayat', mother_tongue: 'Kannada',
    native_district: 'Dharwad', native_state: 'Karnataka', native_region: '',
    current_city: 'Bangalore', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Non-Vegetarian', star: 'Uttara',
    about: 'Surgical resident at Bangalore Medical College. Come from a respected family in Dharwad. Looking for an educated, warm partner who understands the demands of a medical career.',
    photo_url: m(0), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'ravi.hosamani@ntvtest.com', phone: '9876543220',
    pref_age_min: 25, pref_age_max: 31, profile_created_by: 'self',
    last_login_at: daysAgo(2), created_at: daysAgo(9), member_number: 11,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Deepak Vokkaligar Kumar', gender: 'male', date_of_birth: '1994-10-30',
    profession: 'Entrepreneur', education: 'B.Tech - ECE, PES University',
    height_cm: 173, religion: 'Hindu', caste: 'Vokkaliga', mother_tongue: 'Kannada',
    native_district: 'Mysuru', native_state: 'Karnataka', native_region: '',
    current_city: 'Bangalore', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Swati',
    about: 'Running my own EdTech startup in Bangalore after working 5 years at Flipkart. From a business family in Mysore. Enjoy yoga, motorcycling, and cultural events.',
    photo_url: m(1), photo_visibility: 'public', status: 'approved', verified: false,
    email: 'deepak.kumar@ntvtest.com', phone: '9876543221',
    pref_age_min: 24, pref_age_max: 30, profile_created_by: 'self',
    last_login_at: daysAgo(1), created_at: daysAgo(6), member_number: 12,
    annual_income: '₹20L–50L',
  },

  // ══════════════ TAMIL NADU GROOMS (3) ══════════════
  {
    full_name: 'Arun Mudaliar Krishnan', gender: 'male', date_of_birth: '1994-07-18',
    profession: 'Software Engineer', education: 'B.E. - IT, Anna University Chennai',
    height_cm: 171, religion: 'Hindu', caste: 'Mudaliar', mother_tongue: 'Tamil',
    native_district: 'Chennai', native_state: 'Tamil Nadu', native_region: '',
    current_city: 'Chennai', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Chitra',
    about: 'Senior software engineer at TCS Chennai. Love Carnatic music, cricket, and South Indian cooking. Looking for a kind, educated partner who appreciates both tradition and modernity.',
    photo_url: m(2), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'arun.krishnan@ntvtest.com', phone: '9876543222',
    pref_age_min: 23, pref_age_max: 28, profile_created_by: 'self',
    last_login_at: daysAgo(1), created_at: daysAgo(10), member_number: 13,
    annual_income: '₹6L–10L',
  },
  {
    full_name: 'Vijay Pillai Annamalai', gender: 'male', date_of_birth: '1992-12-05',
    profession: 'Lawyer', education: 'LLM, Madras Law College',
    height_cm: 174, religion: 'Hindu', caste: 'Brahmin', mother_tongue: 'Tamil',
    native_district: 'Coimbatore', native_state: 'Tamil Nadu', native_region: '',
    current_city: 'Chennai', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Vegetarian', star: 'Bharani',
    about: 'Advocate at Madras High Court specialising in corporate law. From a traditional Tamil Brahmin family in Coimbatore. Enjoy veena music, reading Tamil literature, and temple visits.',
    photo_url: m(3), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'vijay.annamalai@ntvtest.com', phone: '9876543223',
    pref_age_min: 25, pref_age_max: 30, profile_created_by: 'parent',
    last_login_at: daysAgo(4), created_at: daysAgo(14), member_number: 14,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Kiran Thevar Muthukumar', gender: 'male', date_of_birth: '1995-03-28',
    profession: 'Data Engineer', education: 'M.Sc - Data Science, IIT Madras',
    height_cm: 176, religion: 'Hindu', caste: 'Thevar', mother_tongue: 'Tamil',
    native_district: 'Madurai', native_state: 'Tamil Nadu', native_region: '',
    current_city: 'Hyderabad', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Pushyami',
    about: 'Data engineer at a Hyderabad MNC. IIT Madras grad from Madurai. I bridge the Telugu and Tamil worlds! Enjoy jallikattu, hiking, and visiting ancient temples on weekends.',
    photo_url: m(4), photo_visibility: 'public', status: 'approved', verified: false,
    email: 'kiran.muthukumar@ntvtest.com', phone: '9876543224',
    pref_age_min: 23, pref_age_max: 28, profile_created_by: 'self',
    last_login_at: daysAgo(0), created_at: daysAgo(2), member_number: 15,
    annual_income: '₹10L–20L',
  },

  // ══════════════ MAHARASHTRA GROOMS (3) ══════════════
  {
    full_name: 'Akash Maratha Patil', gender: 'male', date_of_birth: '1993-09-14',
    profession: 'Finance Manager', education: 'CA + MBA, Symbiosis Pune',
    height_cm: 178, religion: 'Hindu', caste: 'Maratha', mother_tongue: 'Marathi',
    native_district: 'Pune', native_state: 'Maharashtra', native_region: '',
    current_city: 'Mumbai', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Hasta',
    about: 'Finance manager at a top NBFC in Mumbai. Pune-born, Mumbai-bred. Love local trains, street food, and weekend trips to Konkan. Looking for a grounded, warm-hearted partner.',
    photo_url: m(5), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'akash.patil@ntvtest.com', phone: '9876543225',
    pref_age_min: 24, pref_age_max: 29, profile_created_by: 'self',
    last_login_at: daysAgo(1), created_at: daysAgo(7), member_number: 16,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Rohan Deshmukh Rane', gender: 'male', date_of_birth: '1994-06-20',
    profession: 'Software Engineer', education: 'B.Tech - CS, VJTI Mumbai',
    height_cm: 175, religion: 'Hindu', caste: 'Brahmin', mother_tongue: 'Marathi',
    native_district: 'Nashik', native_state: 'Maharashtra', native_region: '',
    current_city: 'Pune', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Vegetarian', star: 'Rohini',
    about: 'Software engineer at Infosys Pune. From a traditional Kokanastha Brahmin family in Nashik. I enjoy classical Indian music, chess, and weekend treks to Sahyadri mountains.',
    photo_url: m(6), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'rohan.deshmukh@ntvtest.com', phone: '9876543226',
    pref_age_min: 23, pref_age_max: 28, profile_created_by: 'parent',
    last_login_at: daysAgo(3), created_at: daysAgo(11), member_number: 17,
    annual_income: '₹6L–10L',
  },
  {
    full_name: 'Siddharth Jain Mehta', gender: 'male', date_of_birth: '1992-01-08',
    profession: 'Entrepreneur', education: 'B.Com, Mumbai University',
    height_cm: 170, religion: 'Jain', caste: 'Jain', mother_tongue: 'Hindi',
    native_district: 'Mumbai Suburban', native_state: 'Maharashtra', native_region: '',
    current_city: 'Mumbai', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Vegetarian', star: 'Mrigashira',
    about: 'Running the family diamond business in Mumbai. Third-generation entrepreneur. I value simplicity, integrity, and family above all. Looking for a Jain partner with strong values.',
    photo_url: m(7), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'siddharth.mehta@ntvtest.com', phone: '9876543227',
    pref_age_min: 22, pref_age_max: 28, profile_created_by: 'parent',
    last_login_at: daysAgo(2), created_at: daysAgo(8), member_number: 18,
    annual_income: '₹50L+',
  },

  // ══════════════ DELHI / NORTH INDIA GROOMS (3) ══════════════
  {
    full_name: 'Rajat Sharma Kapoor', gender: 'male', date_of_birth: '1994-11-22',
    profession: 'Software Engineer', education: 'B.Tech - CS, Delhi Technological University',
    height_cm: 180, religion: 'Hindu', caste: 'Brahmin', mother_tongue: 'Hindi',
    native_district: 'New Delhi', native_state: 'Delhi', native_region: '',
    current_city: 'Gurgaon', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Ashwini',
    about: 'Software engineer at Google Gurgaon. Delhi boy who loves North Indian food and Bollywood. Open to partnering with someone from any state — love transcends boundaries!',
    photo_url: m(8), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'rajat.kapoor@ntvtest.com', phone: '9876543228',
    pref_age_min: 23, pref_age_max: 28, profile_created_by: 'self',
    last_login_at: daysAgo(0), created_at: daysAgo(3), member_number: 19,
    annual_income: '₹20L–50L',
  },
  {
    full_name: 'Manish Gupta Agarwal', gender: 'male', date_of_birth: '1993-04-16',
    profession: 'Banker - Vice President', education: 'MBA Finance, FMS Delhi',
    height_cm: 173, religion: 'Hindu', caste: 'Agarwal', mother_tongue: 'Hindi',
    native_district: 'Lucknow', native_state: 'Uttar Pradesh', native_region: '',
    current_city: 'Mumbai', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Vegetarian', star: 'Swati',
    about: 'VP at HDFC Bank Mumbai. From a well-established business family in Lucknow. I enjoy cooking (especially Awadhi cuisine), photography, and classical music. Looking for a cultured, educated partner.',
    photo_url: m(9), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'manish.agarwal@ntvtest.com', phone: '9876543229',
    pref_age_min: 25, pref_age_max: 30, profile_created_by: 'parent',
    last_login_at: daysAgo(1), created_at: daysAgo(5), member_number: 20,
    annual_income: '₹20L–50L',
  },
  {
    full_name: 'Anurag Singh Chauhan', gender: 'male', date_of_birth: '1995-07-04',
    profession: 'IIT Researcher', education: 'M.Tech - Electrical, IIT Delhi',
    height_cm: 177, religion: 'Hindu', caste: 'Rajput', mother_tongue: 'Hindi',
    native_district: 'Agra', native_state: 'Uttar Pradesh', native_region: '',
    current_city: 'Delhi', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Jyeshtha',
    about: 'PhD student at IIT Delhi working on renewable energy. Fond of reading, chess, and travelling. Looking for an intellectual equal who is ambitious and warm-hearted.',
    photo_url: m(0), photo_visibility: 'public', status: 'approved', verified: false,
    email: 'anurag.chauhan@ntvtest.com', phone: '9876543230',
    pref_age_min: 24, pref_age_max: 29, profile_created_by: 'self',
    last_login_at: daysAgo(4), created_at: daysAgo(13), member_number: 21,
    annual_income: '₹3L–6L',
  },

  // ══════════════ GUJARAT GROOMS (2) ══════════════
  {
    full_name: 'Darshan Patel Soni', gender: 'male', date_of_birth: '1993-03-12',
    profession: 'Business Owner', education: 'BBA, Gujarat University',
    height_cm: 174, religion: 'Hindu', caste: 'Patel', mother_tongue: 'Gujarati',
    native_district: 'Ahmedabad', native_state: 'Gujarat', native_region: '',
    current_city: 'Ahmedabad', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Vegetarian', star: 'Uttara',
    about: 'Managing our family textile export business in Ahmedabad. Third-generation entrepreneur. Love dandiya, cricket, and travelling abroad for business and leisure.',
    photo_url: m(1), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'darshan.soni@ntvtest.com', phone: '9876543231',
    pref_age_min: 22, pref_age_max: 27, profile_created_by: 'parent',
    last_login_at: daysAgo(2), created_at: daysAgo(9), member_number: 22,
    annual_income: '₹50L+',
  },
  {
    full_name: 'Harsh Jain Doshi', gender: 'male', date_of_birth: '1994-09-28',
    profession: 'Software Engineer', education: 'B.Tech, Nirma University',
    height_cm: 172, religion: 'Jain', caste: 'Jain', mother_tongue: 'Gujarati',
    native_district: 'Surat', native_state: 'Gujarat', native_region: '',
    current_city: 'Bangalore', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Vegetarian', star: 'Punarvasu',
    about: 'Software engineer at Amazon Bangalore. Surat-born, now settled in Bangalore. Strictly Jain, looking for a Jain partner. I enjoy coding challenges, reading, and family gatherings.',
    photo_url: m(2), photo_visibility: 'public', status: 'approved', verified: false,
    email: 'harsh.doshi@ntvtest.com', phone: '9876543232',
    pref_age_min: 22, pref_age_max: 27, profile_created_by: 'self',
    last_login_at: daysAgo(1), created_at: daysAgo(4), member_number: 23,
    annual_income: '₹10L–20L',
  },

  // ══════════════ TELANGANA BRIDES (5) ══════════════
  {
    full_name: 'Priya Lakshmi Gudipati', gender: 'female', date_of_birth: '1997-06-12',
    profession: 'Software Engineer', education: 'B.Tech - IT, BITS Pilani',
    height_cm: 163, religion: 'Hindu', caste: 'Reddy', mother_tongue: 'Telugu',
    native_district: 'Hyderabad', native_state: 'Telangana', native_region: 'Telangana',
    current_city: 'Hyderabad', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Bharani',
    about: 'Software engineer at Microsoft Hyderabad. BITS Pilani graduate passionate about technology. Love Bharatanatyam and healthy cooking. Looking for an ambitious, kind-hearted partner.',
    photo_url: f(0), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'priya.gudipati@ntvtest.com', phone: '9876543233',
    pref_age_min: 26, pref_age_max: 32, profile_created_by: 'self',
    last_login_at: daysAgo(0), created_at: daysAgo(4), member_number: 24,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Keerthi Vardhini Pasala', gender: 'female', date_of_birth: '1995-12-20',
    profession: 'Lawyer', education: 'LLB, NALSAR University of Law',
    height_cm: 162, religion: 'Hindu', caste: 'Naidu', mother_tongue: 'Telugu',
    native_district: 'Nalgonda', native_state: 'Telangana', native_region: 'Telangana',
    current_city: 'Hyderabad', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Swati',
    about: 'Practising advocate at Telangana High Court specialising in corporate and family law. Passionate about justice. Enjoy debates, theatre, and cooking traditional Telangana recipes.',
    photo_url: f(1), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'keerthi.pasala@ntvtest.com', phone: '9876543234',
    pref_age_min: 27, pref_age_max: 34, profile_created_by: 'self',
    last_login_at: daysAgo(2), created_at: daysAgo(9), member_number: 25,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Swathi Nandini Yerramilli', gender: 'female', date_of_birth: '1997-04-08',
    profession: 'UX Designer', education: 'B.Des - Design, NID Ahmedabad',
    height_cm: 161, religion: 'Hindu', caste: 'Reddy', mother_tongue: 'Telugu',
    native_district: 'Khammam', native_state: 'Telangana', native_region: 'Telangana',
    current_city: 'Bangalore', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Vegetarian', star: 'Chitra',
    about: 'Senior UX designer at a top product company in Bangalore. NID graduate who channels creativity through sketching, pottery, and photography. Close to my Khammam roots.',
    photo_url: f(2), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'swathi.yerramilli@ntvtest.com', phone: '9876543235',
    pref_age_min: 25, pref_age_max: 31, profile_created_by: 'self',
    last_login_at: daysAgo(0), created_at: daysAgo(1), member_number: 26,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Manasa Kamma Polavarapu', gender: 'female', date_of_birth: '1998-02-14',
    profession: 'Doctor - MBBS', education: 'MBBS, Gandhi Medical College',
    height_cm: 158, religion: 'Hindu', caste: 'Kamma', mother_tongue: 'Telugu',
    native_district: 'Medchal', native_state: 'Telangana', native_region: 'Telangana',
    current_city: 'Hyderabad', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Non-Vegetarian', star: 'Ashwini',
    about: 'Junior resident doctor completing internship in Hyderabad. Passionate about women\'s health and community medicine. Love cooking, Kuchipudi dance, and spending time with family.',
    photo_url: f(3), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'manasa.polavarapu@ntvtest.com', phone: '9876543236',
    pref_age_min: 26, pref_age_max: 33, profile_created_by: 'parent',
    last_login_at: daysAgo(1), created_at: daysAgo(5), member_number: 27,
    annual_income: '₹3L–6L',
  },
  {
    full_name: 'Laxmi Velama Bandaru', gender: 'female', date_of_birth: '1996-08-30',
    profession: 'Bank Manager', education: 'MBA - Finance, Osmania University',
    height_cm: 160, religion: 'Hindu', caste: 'Velama', mother_tongue: 'Telugu',
    native_district: 'Nizamabad', native_state: 'Telangana', native_region: 'Telangana',
    current_city: 'Hyderabad', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Vegetarian', star: 'Uttara',
    about: 'Branch manager at SBI, Hyderabad. From a respected Velama family in Nizamabad. I enjoy classical Carnatic music, temple visits, and traditional Telugu cooking. Seeking a well-settled, respectful partner.',
    photo_url: f(4), photo_visibility: 'public', status: 'approved', verified: false,
    email: 'laxmi.bandaru@ntvtest.com', phone: '9876543237',
    pref_age_min: 27, pref_age_max: 33, profile_created_by: 'parent',
    last_login_at: daysAgo(4), created_at: daysAgo(16), member_number: 28,
    annual_income: '₹6L–10L',
  },

  // ══════════════ ANDHRA PRADESH BRIDES (4) ══════════════
  {
    full_name: 'Ananya Rao Kakarlapudi', gender: 'female', date_of_birth: '1996-02-28',
    profession: 'Doctor - MBBS', education: 'MBBS, Andhra Medical College, Vizag',
    height_cm: 160, religion: 'Hindu', caste: 'Brahmin', mother_tongue: 'Telugu',
    native_district: 'Visakhapatnam', native_state: 'Andhra Pradesh', native_region: 'Coastal Andhra',
    current_city: 'Visakhapatnam', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Vegetarian', star: 'Pushyami',
    about: 'Junior resident doctor completing MD in Paediatrics. From a deeply rooted Telugu Brahmin family in Vizag. Enjoy Sanskrit slokas, classical music, and painting.',
    photo_url: f(5), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'ananya.kakarlapudi@ntvtest.com', phone: '9876543238',
    pref_age_min: 27, pref_age_max: 33, profile_created_by: 'parent',
    last_login_at: daysAgo(1), created_at: daysAgo(6), member_number: 29,
    annual_income: '₹3L–6L',
  },
  {
    full_name: 'Divya Sri Mangipudi', gender: 'female', date_of_birth: '1998-09-03',
    profession: 'Investment Analyst', education: 'MBA - Finance, IIM Indore',
    height_cm: 165, religion: 'Hindu', caste: 'Kamma', mother_tongue: 'Telugu',
    native_district: 'Krishna', native_state: 'Andhra Pradesh', native_region: 'Coastal Andhra',
    current_city: 'Mumbai', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Uttara',
    about: 'IIM Indore graduate working as an investment analyst in Mumbai. Passionate about financial markets, fitness, and travel. Deeply connected to my Telugu roots despite a global outlook.',
    photo_url: f(6), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'divya.mangipudi@ntvtest.com', phone: '9876543239',
    pref_age_min: 26, pref_age_max: 32, profile_created_by: 'self',
    last_login_at: daysAgo(0), created_at: daysAgo(2), member_number: 30,
    annual_income: '₹20L–50L',
  },
  {
    full_name: 'Sravani Kapu Mekala', gender: 'female', date_of_birth: '1997-11-15',
    profession: 'Teacher - School', education: 'B.Ed, Andhra University',
    height_cm: 157, religion: 'Hindu', caste: 'Kapu', mother_tongue: 'Telugu',
    native_district: 'West Godavari', native_state: 'Andhra Pradesh', native_region: 'Coastal Andhra',
    current_city: 'Vijayawada', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Non-Vegetarian', star: 'Mrigashira',
    about: 'School teacher at a reputed institution in Vijayawada. From a warm, traditional family in West Godavari. I believe teaching is a noble profession. Love reading, gardening, and cooking.',
    photo_url: f(7), photo_visibility: 'public', status: 'approved', verified: false,
    email: 'sravani.mekala@ntvtest.com', phone: '9876543240',
    pref_age_min: 25, pref_age_max: 31, profile_created_by: 'parent',
    last_login_at: daysAgo(3), created_at: daysAgo(11), member_number: 31,
    annual_income: '₹3L–6L',
  },
  {
    full_name: 'Pavani Reddy Chintala', gender: 'female', date_of_birth: '1995-05-22',
    profession: 'Software Engineer', education: 'B.Tech - CSE, VIT Vellore',
    height_cm: 164, religion: 'Hindu', caste: 'Reddy', mother_tongue: 'Telugu',
    native_district: 'Kadapa', native_state: 'Andhra Pradesh', native_region: 'Rayalaseema',
    current_city: 'Hyderabad', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Rohini',
    about: 'Software engineer at Wipro Hyderabad. VIT graduate from Kadapa. I enjoy trekking, photography, and volunteering at local NGOs. Looking for a partner who is compassionate and growth-oriented.',
    photo_url: f(8), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'pavani.chintala@ntvtest.com', phone: '9876543241',
    pref_age_min: 26, pref_age_max: 31, profile_created_by: 'self',
    last_login_at: daysAgo(1), created_at: daysAgo(7), member_number: 32,
    annual_income: '₹6L–10L',
  },

  // ══════════════ KARNATAKA BRIDES (3) ══════════════
  {
    full_name: 'Sneha Gowda Krishnamurthy', gender: 'female', date_of_birth: '1996-04-18',
    profession: 'Software Engineer', education: 'B.E. - CSE, BMS College Bangalore',
    height_cm: 162, religion: 'Hindu', caste: 'Vokkaliga', mother_tongue: 'Kannada',
    native_district: 'Bengaluru Urban', native_state: 'Karnataka', native_region: '',
    current_city: 'Bangalore', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Vegetarian', star: 'Chitra',
    about: 'Product engineer at Razorpay Bangalore. Born and raised in Bangalore. Love filter coffee, classical Carnatic music, and trekking. Looking for an ambitious partner who values family.',
    photo_url: f(9), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'sneha.krishnamurthy@ntvtest.com', phone: '9876543242',
    pref_age_min: 25, pref_age_max: 31, profile_created_by: 'self',
    last_login_at: daysAgo(0), created_at: daysAgo(3), member_number: 33,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Kavitha Lingayat Basavaraj', gender: 'female', date_of_birth: '1995-10-06',
    profession: 'Pharmacist', education: 'Pharm.D, Rajiv Gandhi University',
    height_cm: 158, religion: 'Hindu', caste: 'Lingayat', mother_tongue: 'Kannada',
    native_district: 'Hubli-Dharwad', native_state: 'Karnataka', native_region: '',
    current_city: 'Bangalore', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Non-Vegetarian', star: 'Hasta',
    about: 'Pharmacist working at Manipal Hospital Bangalore. From a traditional Lingayat family in Dharwad. I enjoy cooking, Yakshagana folk art, and visiting ancient temples in North Karnataka.',
    photo_url: f(0), photo_visibility: 'public', status: 'approved', verified: false,
    email: 'kavitha.basavaraj@ntvtest.com', phone: '9876543243',
    pref_age_min: 26, pref_age_max: 32, profile_created_by: 'parent',
    last_login_at: daysAgo(5), created_at: daysAgo(18), member_number: 34,
    annual_income: '₹3L–6L',
  },
  {
    full_name: 'Pooja Brahmin Raghavendra', gender: 'female', date_of_birth: '1997-07-24',
    profession: 'Research Scientist', education: 'M.Sc - Biotechnology, IISc Bangalore',
    height_cm: 163, religion: 'Hindu', caste: 'Brahmin', mother_tongue: 'Kannada',
    native_district: 'Mysuru', native_state: 'Karnataka', native_region: '',
    current_city: 'Bangalore', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Vegetarian', star: 'Uttara',
    about: 'Research scientist at IISc Bangalore working on cancer therapeutics. IISc graduate from a scholarly Brahmin family in Mysore. Love Hindustani music, literature, and long evening walks.',
    photo_url: f(1), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'pooja.raghavendra@ntvtest.com', phone: '9876543244',
    pref_age_min: 26, pref_age_max: 32, profile_created_by: 'self',
    last_login_at: daysAgo(2), created_at: daysAgo(8), member_number: 35,
    annual_income: '₹6L–10L',
  },

  // ══════════════ TAMIL NADU BRIDES (3) ══════════════
  {
    full_name: 'Preethi Iyengar Venkataraman', gender: 'female', date_of_birth: '1996-01-14',
    profession: 'Chartered Accountant', education: 'CA Final, ICAI',
    height_cm: 160, religion: 'Hindu', caste: 'Brahmin', mother_tongue: 'Tamil',
    native_district: 'Chennai', native_state: 'Tamil Nadu', native_region: '',
    current_city: 'Chennai', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Vegetarian', star: 'Pushyami',
    about: 'CA working with Ernst & Young Chennai. From a traditional Iyengar family. I enjoy veena, Bharatanatyam, and cooking elaborate South Indian meals on weekends.',
    photo_url: f(2), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'preethi.venkataraman@ntvtest.com', phone: '9876543245',
    pref_age_min: 27, pref_age_max: 33, profile_created_by: 'parent',
    last_login_at: daysAgo(1), created_at: daysAgo(6), member_number: 36,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Nithya Pillai Ramasamy', gender: 'female', date_of_birth: '1997-05-30',
    profession: 'Software Engineer', education: 'B.Tech - IT, College of Engineering Chennai',
    height_cm: 156, religion: 'Hindu', caste: 'Brahmin', mother_tongue: 'Tamil',
    native_district: 'Coimbatore', native_state: 'Tamil Nadu', native_region: '',
    current_city: 'Hyderabad', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Bharani',
    about: 'Software engineer at Infosys Hyderabad. Coimbatore-born, now living in Hyderabad. Bridging Tamil and Telugu cultures! Love jallikattu festivals, trekking, and Tamil cinema.',
    photo_url: f(3), photo_visibility: 'public', status: 'approved', verified: false,
    email: 'nithya.ramasamy@ntvtest.com', phone: '9876543246',
    pref_age_min: 25, pref_age_max: 30, profile_created_by: 'self',
    last_login_at: daysAgo(0), created_at: daysAgo(2), member_number: 37,
    annual_income: '₹6L–10L',
  },
  {
    full_name: 'Revathi Mudaliar Sundaram', gender: 'female', date_of_birth: '1995-09-18',
    profession: 'Nutritionist', education: 'M.Sc - Nutrition, SNDT University',
    height_cm: 159, religion: 'Hindu', caste: 'Mudaliar', mother_tongue: 'Tamil',
    native_district: 'Madurai', native_state: 'Tamil Nadu', native_region: '',
    current_city: 'Chennai', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Non-Vegetarian', star: 'Mrigashira',
    about: 'Clinical nutritionist at Apollo Hospitals Chennai. Passionate about food as medicine. From an orthodox Mudaliar family in Madurai. I cook, practice yoga daily, and love temple architecture.',
    photo_url: f(4), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'revathi.sundaram@ntvtest.com', phone: '9876543247',
    pref_age_min: 27, pref_age_max: 32, profile_created_by: 'parent',
    last_login_at: daysAgo(3), created_at: daysAgo(12), member_number: 38,
    annual_income: '₹6L–10L',
  },

  // ══════════════ MAHARASHTRA BRIDES (3) ══════════════
  {
    full_name: 'Riya Desai Kulkarni', gender: 'female', date_of_birth: '1996-12-05',
    profession: 'HR Manager', education: 'MBA - HR, Symbiosis Pune',
    height_cm: 163, religion: 'Hindu', caste: 'Brahmin', mother_tongue: 'Marathi',
    native_district: 'Pune', native_state: 'Maharashtra', native_region: '',
    current_city: 'Pune', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Rohini',
    about: 'HR manager at a Pune IT company. Symbiosis MBA graduate. Love Lavani dance, monsoon treks, and Pune\'s rich culture. Looking for a kind, grounded partner who values family and career equally.',
    photo_url: f(5), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'riya.kulkarni@ntvtest.com', phone: '9876543248',
    pref_age_min: 26, pref_age_max: 31, profile_created_by: 'self',
    last_login_at: daysAgo(1), created_at: daysAgo(5), member_number: 39,
    annual_income: '₹6L–10L',
  },
  {
    full_name: 'Shruti Maratha Bhosale', gender: 'female', date_of_birth: '1997-03-22',
    profession: 'Architect', education: 'B.Arch, Mumbai School of Architecture',
    height_cm: 165, religion: 'Hindu', caste: 'Maratha', mother_tongue: 'Marathi',
    native_district: 'Mumbai City', native_state: 'Maharashtra', native_region: '',
    current_city: 'Mumbai', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Hasta',
    about: 'Architect at a leading design firm in Mumbai. Passionate about sustainable architecture and urban design. Love Mumbai\'s spirit, street food, and art galleries. Looking for a creative, open-minded partner.',
    photo_url: f(6), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'shruti.bhosale@ntvtest.com', phone: '9876543249',
    pref_age_min: 25, pref_age_max: 31, profile_created_by: 'self',
    last_login_at: daysAgo(0), created_at: daysAgo(3), member_number: 40,
    annual_income: '₹6L–10L',
  },
  {
    full_name: 'Aarti Jain Shah', gender: 'female', date_of_birth: '1995-06-08',
    profession: 'Fashion Designer', education: 'B.Des, NIFT Mumbai',
    height_cm: 161, religion: 'Jain', caste: 'Jain', mother_tongue: 'Hindi',
    native_district: 'Nagpur', native_state: 'Maharashtra', native_region: '',
    current_city: 'Mumbai', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Vegetarian', star: 'Ashwini',
    about: 'Fashion designer running my own sustainable clothing label in Mumbai. NIFT Mumbai graduate from a business family in Nagpur. Strictly vegetarian Jain. Love art, travel, and sustainability.',
    photo_url: f(7), photo_visibility: 'public', status: 'approved', verified: false,
    email: 'aarti.shah@ntvtest.com', phone: '9876543250',
    pref_age_min: 27, pref_age_max: 33, profile_created_by: 'self',
    last_login_at: daysAgo(2), created_at: daysAgo(10), member_number: 41,
    annual_income: '₹6L–10L',
  },

  // ══════════════ DELHI / NORTH INDIA BRIDES (3) ══════════════
  {
    full_name: 'Neha Sharma Verma', gender: 'female', date_of_birth: '1996-08-14',
    profession: 'Software Engineer', education: 'B.Tech - CS, NIT Delhi',
    height_cm: 162, religion: 'Hindu', caste: 'Brahmin', mother_tongue: 'Hindi',
    native_district: 'New Delhi', native_state: 'Delhi', native_region: '',
    current_city: 'Gurgaon', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Chitra',
    about: 'Software engineer at Amazon Gurgaon. Delhi girl who loves North Indian food, travel, and Bollywood. Open to cross-cultural matches. Looking for someone who is fun, smart, and family-oriented.',
    photo_url: f(8), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'neha.verma@ntvtest.com', phone: '9876543251',
    pref_age_min: 25, pref_age_max: 30, profile_created_by: 'self',
    last_login_at: daysAgo(0), created_at: daysAgo(2), member_number: 42,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Pooja Agarwal Mittal', gender: 'female', date_of_birth: '1995-02-28',
    profession: 'Banker', education: 'MBA Finance, IIM Lucknow',
    height_cm: 160, religion: 'Hindu', caste: 'Agarwal', mother_tongue: 'Hindi',
    native_district: 'Lucknow', native_state: 'Uttar Pradesh', native_region: '',
    current_city: 'Mumbai', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Vegetarian', star: 'Swati',
    about: 'Senior banker at ICICI Mumbai. IIM Lucknow MBA from a business family in Lucknow. I enjoy Hindustani classical music, reading Urdu poetry, and cooking elaborate Awadhi dishes.',
    photo_url: f(9), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'pooja.mittal@ntvtest.com', phone: '9876543252',
    pref_age_min: 27, pref_age_max: 33, profile_created_by: 'parent',
    last_login_at: daysAgo(1), created_at: daysAgo(4), member_number: 43,
    annual_income: '₹20L–50L',
  },
  {
    full_name: 'Ritika Singh Rajput', gender: 'female', date_of_birth: '1997-10-10',
    profession: 'Content Creator', education: 'B.A. - Mass Communication, Delhi University',
    height_cm: 165, religion: 'Hindu', caste: 'Rajput', mother_tongue: 'Hindi',
    native_district: 'Agra', native_state: 'Uttar Pradesh', native_region: '',
    current_city: 'Delhi', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Jyeshtha',
    about: 'Content creator and social media strategist in Delhi. Delhi University graduate. Love travel blogging, photography, and historical sites (living near Taj Mahal helps!). Looking for someone adventurous and kind.',
    photo_url: f(0), photo_visibility: 'public', status: 'approved', verified: false,
    email: 'ritika.rajput@ntvtest.com', phone: '9876543253',
    pref_age_min: 25, pref_age_max: 30, profile_created_by: 'self',
    last_login_at: daysAgo(3), created_at: daysAgo(9), member_number: 44,
    annual_income: '₹6L–10L',
  },

  // ══════════════ GUJARAT / OTHER BRIDES (4) ══════════════
  {
    full_name: 'Hiral Patel Desai', gender: 'female', date_of_birth: '1996-11-20',
    profession: 'Doctor - Dentist', education: 'BDS, Gujarat Adani Institute',
    height_cm: 157, religion: 'Hindu', caste: 'Patel', mother_tongue: 'Gujarati',
    native_district: 'Ahmedabad', native_state: 'Gujarat', native_region: '',
    current_city: 'Ahmedabad', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Vegetarian', star: 'Punarvasu',
    about: 'Dentist with my own clinic in Ahmedabad. From a respected Patel family. I enjoy garba, cooking Gujarati thali, and family gatherings. Seeking a well-settled, caring partner.',
    photo_url: f(1), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'hiral.desai@ntvtest.com', phone: '9876543254',
    pref_age_min: 26, pref_age_max: 31, profile_created_by: 'parent',
    last_login_at: daysAgo(2), created_at: daysAgo(7), member_number: 45,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Dimple Jain Sheth', gender: 'female', date_of_birth: '1997-07-16',
    profession: 'Fashion Buyer', education: 'B.Des, Pearl Academy Mumbai',
    height_cm: 163, religion: 'Jain', caste: 'Jain', mother_tongue: 'Gujarati',
    native_district: 'Surat', native_state: 'Gujarat', native_region: '',
    current_city: 'Mumbai', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Vegetarian', star: 'Rohini',
    about: 'Fashion buyer for a luxury retail brand in Mumbai. Surat-born, Mumbai-based. Strictly Jain. Love fashion shows, art exhibitions, and sustainable living. Seeking a Jain partner who is ambitious and modern.',
    photo_url: f(2), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'dimple.sheth@ntvtest.com', phone: '9876543255',
    pref_age_min: 25, pref_age_max: 31, profile_created_by: 'self',
    last_login_at: daysAgo(1), created_at: daysAgo(5), member_number: 46,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Ankita Punjabi Bhatia', gender: 'female', date_of_birth: '1994-04-02',
    profession: 'Marketing Manager', education: 'MBA Marketing, MDI Gurgaon',
    height_cm: 166, religion: 'Hindu', caste: 'Punjabi', mother_tongue: 'Punjabi',
    native_district: 'Amritsar', native_state: 'Punjab', native_region: '',
    current_city: 'Delhi', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Bharani',
    about: 'Marketing manager at FMCG brand in Delhi. MDI Gurgaon grad from Amritsar. Love bhangra, Punjabi food, and family celebrations. Looking for a confident, grounded partner who loves life.',
    photo_url: f(3), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'ankita.bhatia@ntvtest.com', phone: '9876543256',
    pref_age_min: 27, pref_age_max: 33, profile_created_by: 'self',
    last_login_at: daysAgo(0), created_at: daysAgo(1), member_number: 47,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Sunita Reddy Borra', gender: 'female', date_of_birth: '1993-12-18',
    profession: 'Senior Software Engineer', education: 'M.Tech - CS, IIIT Hyderabad',
    height_cm: 162, religion: 'Hindu', caste: 'Reddy', mother_tongue: 'Telugu',
    native_district: 'Hyderabad', native_state: 'Telangana', native_region: 'Telangana',
    current_city: 'San Jose, USA', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Ashwini',
    about: 'Senior engineer at Google San Jose. IIIT Hyderabad alumna. Looking to settle down — open to relocating to India or staying in the US. Love hiking, reading, and cooking Telugu food.',
    photo_url: f(4), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'sunita.borra@ntvtest.com', phone: '9876543257',
    pref_age_min: 28, pref_age_max: 35, profile_created_by: 'self',
    last_login_at: daysAgo(0), created_at: daysAgo(1), member_number: 48,
    annual_income: '₹50L+',
    visa_status: 'H-1B',
  },
  {
    full_name: 'Meera Brahmin Iyer', gender: 'female', date_of_birth: '1996-06-14',
    profession: 'Data Scientist', education: 'M.Sc - Statistics, IIT Bombay',
    height_cm: 159, religion: 'Hindu', caste: 'Brahmin', mother_tongue: 'Tamil',
    native_district: 'Tirunelveli', native_state: 'Tamil Nadu', native_region: '',
    current_city: 'Hyderabad', marital_status: 'Never Married', family_type: 'Joint',
    diet: 'Vegetarian', star: 'Hasta',
    about: 'Data scientist at a Hyderabad AI startup. IIT Bombay grad from Tirunelveli. I bridge the data and human worlds — love both equations and poetry. Looking for a thoughtful, kind partner.',
    photo_url: f(5), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'meera.iyer@ntvtest.com', phone: '9876543258',
    pref_age_min: 26, pref_age_max: 32, profile_created_by: 'self',
    last_login_at: daysAgo(2), created_at: daysAgo(6), member_number: 49,
    annual_income: '₹10L–20L',
  },
  {
    full_name: 'Kavya Nair Menon', gender: 'female', date_of_birth: '1997-01-28',
    profession: 'Physiotherapist', education: 'BPT, Amrita Institute Kochi',
    height_cm: 160, religion: 'Hindu', caste: 'Nair', mother_tongue: 'Malayalam',
    native_district: 'Ernakulam', native_state: 'Kerala', native_region: '',
    current_city: 'Bangalore', marital_status: 'Never Married', family_type: 'Nuclear',
    diet: 'Non-Vegetarian', star: 'Punarvasu',
    about: 'Physiotherapist at a sports medicine clinic in Bangalore. Keralite at heart, Bangalorean by choice. Love Kathakali, spicy Kerala cuisine, and weekend backpacking. Looking for someone open-minded and family-oriented.',
    photo_url: f(6), photo_visibility: 'public', status: 'approved', verified: true,
    email: 'kavya.menon@ntvtest.com', phone: '9876543259',
    pref_age_min: 26, pref_age_max: 32, profile_created_by: 'self',
    last_login_at: daysAgo(1), created_at: daysAgo(4), member_number: 50,
    annual_income: '₹3L–6L',
  },
]

console.log('\n👤 Inserting profiles…')
const { data: inserted, error: insertErr } = await supabase.from('profiles').insert(profiles).select('id, full_name, gender')
if (insertErr) { console.error('Insert error:', insertErr); process.exit(1) }
console.log(`  ✓ Inserted ${inserted.length} profiles`)

// ── 3. Create interests & matches ──────────────────────────────
const grooms = inserted.filter(p => p.gender === 'male')
const brides  = inserted.filter(p => p.gender === 'female')

const interestPairs = [
  { from: grooms[0], to: brides[0],  status: 'accepted' }, // Arjun → Priya (mutual)
  { from: brides[0], to: grooms[0],  status: 'accepted' }, // Priya → Arjun
  { from: grooms[1], to: brides[4],  status: 'accepted' }, // Sai Teja → Ananya (mutual)
  { from: brides[4], to: grooms[1],  status: 'accepted' }, // Ananya → Sai Teja
  { from: grooms[2], to: brides[1],  status: 'accepted' }, // Rahul → Keerthi (mutual)
  { from: brides[1], to: grooms[2],  status: 'accepted' },
  { from: grooms[3], to: brides[2],  status: 'pending'  }, // Varun → Swathi
  { from: grooms[4], to: brides[3],  status: 'pending'  }, // Aditya → Manasa
  { from: grooms[5], to: brides[5],  status: 'pending'  }, // Karthik → Divya
  { from: grooms[6], to: brides[6],  status: 'pending'  }, // Rohit → Sravani
  { from: brides[7], to: grooms[7],  status: 'pending'  }, // Pavani → Vikram
  { from: brides[8], to: grooms[8],  status: 'pending'  }, // Sneha → Suresh
  { from: grooms[9], to: brides[9],  status: 'accepted' }, // Nikhil → Kavitha (mutual)
  { from: brides[9], to: grooms[9],  status: 'accepted' },
  { from: grooms[10], to: brides[10], status: 'pending'  }, // Ravi → Pooja
  { from: grooms[11], to: brides[11], status: 'pending'  }, // Deepak → Preethi
  { from: brides[12], to: grooms[12], status: 'pending'  }, // Nithya → Arun
  { from: grooms[13], to: brides[13], status: 'pending'  }, // Vijay → Revathi
  { from: grooms[14], to: brides[14], status: 'accepted' }, // Kiran → Riya (mutual)
  { from: brides[14], to: grooms[14], status: 'accepted' },
  { from: grooms[15], to: brides[15], status: 'pending'  }, // Akash → Shruti
  { from: brides[16], to: grooms[15], status: 'pending'  }, // Aarti → Akash
  { from: grooms[16], to: brides[17], status: 'pending'  }, // Rohan → Neha
  { from: grooms[17], to: brides[18], status: 'accepted' }, // Siddharth → Pooja (mutual)
  { from: brides[18], to: grooms[17], status: 'accepted' },
  { from: grooms[18], to: brides[19], status: 'pending'  }, // Rajat → Ritika
  { from: grooms[19], to: brides[20], status: 'pending'  }, // Manish → Hiral
  { from: brides[21], to: grooms[20], status: 'pending'  }, // Dimple → Anurag
  { from: grooms[21], to: brides[22], status: 'pending'  }, // Darshan → Ankita
  { from: grooms[22], to: brides[23], status: 'pending'  }, // Harsh → Sunita
]

const interestsToInsert = interestPairs
  .filter(p => p.from && p.to)
  .map(p => ({
    from_user: p.from.id,
    to_user: p.to.id,
    status: p.status,
    note: p.status === 'accepted' ? 'Loved your profile!' : 'Would love to connect with you!',
  }))

const { error: intErr } = await supabase.from('interests').insert(interestsToInsert)
if (intErr) console.error('Interest error:', intErr.message)
else console.log(`  ✓ Created ${interestsToInsert.length} interests`)

// ── 4. Matches for accepted pairs ──────────────────────────────
const matchPairs = [
  [grooms[0].id, brides[0].id],   // Arjun & Priya
  [grooms[1].id, brides[4].id],   // Sai Teja & Ananya
  [grooms[2].id, brides[1].id],   // Rahul & Keerthi
  [grooms[9].id, brides[9].id],   // Nikhil & Kavitha
  [grooms[14].id, brides[14].id], // Kiran & Riya
  [grooms[17].id, brides[18].id], // Siddharth & Pooja
].filter(pair => pair[0] && pair[1])

const { data: matches, error: matchErr } = await supabase.from('matches').insert(matchPairs.map(([u1,u2]) => ({ user1: u1, user2: u2 }))).select('id,user1,user2')
if (matchErr) console.error('Match error:', matchErr.message)
else console.log(`  ✓ Created ${matches.length} matches`)

// ── 5. Chat messages ────────────────────────────────────────────
if (matches?.length) {
  const msgs = []
  const [m1, m2, m3] = matches

  if (m1) {
    msgs.push(
      { match_id: m1.id, from_profile_id: m1.user1, content: 'Hi Priya! I came across your profile and was really impressed. Would love to connect!', created_at: new Date(Date.now() - 3*24*60*60*1000).toISOString() },
      { match_id: m1.id, from_profile_id: m1.user2, content: 'Hi Arjun! Thank you, your profile is lovely too 😊 Which part of Hyderabad are you from?', created_at: new Date(Date.now() - 3*24*60*60*1000 + 30*60*1000).toISOString() },
      { match_id: m1.id, from_profile_id: m1.user1, content: 'I am from Banjara Hills. I saw you work at Microsoft — that is amazing! What team are you in?', created_at: new Date(Date.now() - 3*24*60*60*1000 + 60*60*1000).toISOString() },
      { match_id: m1.id, from_profile_id: m1.user2, content: 'Azure cloud team! And you are in software too right? Would be great to catch up over coffee sometime.', created_at: new Date(Date.now() - 2*24*60*60*1000).toISOString() },
      { match_id: m1.id, from_profile_id: m1.user1, content: 'That sounds wonderful! Are you free this weekend? There is a nice place in Jubilee Hills.', created_at: new Date(Date.now() - 1*24*60*60*1000).toISOString() },
      { match_id: m1.id, from_profile_id: m1.user2, content: 'Saturday works perfectly for me! 😊', created_at: new Date(Date.now() - 2*60*60*1000).toISOString() },
    )
  }
  if (m2) {
    msgs.push(
      { match_id: m2.id, from_profile_id: m2.user1, content: 'Namaste! Fellow data person here. Really liked your profile and research work.', created_at: new Date(Date.now() - 2*24*60*60*1000).toISOString() },
      { match_id: m2.id, from_profile_id: m2.user2, content: 'Thank you! IIT Hyderabad and IIT Bombay — what a combination 😄 Where are you based currently?', created_at: new Date(Date.now() - 2*24*60*60*1000 + 45*60*1000).toISOString() },
      { match_id: m2.id, from_profile_id: m2.user1, content: 'Based in Pune for now, but Hyderabad is home. Are you open to Hyderabad long term?', created_at: new Date(Date.now() - 1*24*60*60*1000).toISOString() },
      { match_id: m2.id, from_profile_id: m2.user2, content: 'Absolutely! My family is in Vizag anyway. A call sometime this week?', created_at: new Date(Date.now() - 3*60*60*1000).toISOString() },
    )
  }
  if (m3) {
    msgs.push(
      { match_id: m3.id, from_profile_id: m3.user1, content: 'Hi Keerthi! Product Manager meets Lawyer — interesting combination! I admire your work.', created_at: new Date(Date.now() - 5*24*60*60*1000).toISOString() },
      { match_id: m3.id, from_profile_id: m3.user2, content: 'Ha! Yes we can debate anything 😄 Tell me more about what you work on at your startup.', created_at: new Date(Date.now() - 4*24*60*60*1000).toISOString() },
    )
  }

  if (msgs.length) {
    const { error: msgErr } = await supabase.from('messages').insert(msgs)
    if (msgErr) console.error('Messages error:', msgErr.message)
    else console.log(`  ✓ Created ${msgs.length} chat messages`)
  }
}

// ── 6. Profile views ────────────────────────────────────────────
const viewPairs = []
for (let i = 0; i < Math.min(grooms.length, 10); i++) {
  for (let j = 0; j < 3; j++) {
    const bride = brides[(i + j) % brides.length]
    if (bride) viewPairs.push({ viewer_id: grooms[i].id, viewed_id: bride.id })
  }
}
for (let i = 0; i < Math.min(brides.length, 8); i++) {
  for (let j = 0; j < 2; j++) {
    const groom = grooms[(i + j) % grooms.length]
    if (groom) viewPairs.push({ viewer_id: brides[i].id, viewed_id: groom.id })
  }
}
const { error: viewErr } = await supabase.from('profile_views').insert(viewPairs)
if (viewErr) console.error('Views error:', viewErr.message)
else console.log(`  ✓ Created ${viewPairs.length} profile views`)

// ── 7. Shortlists ───────────────────────────────────────────────
const slPairs = []
for (let i = 0; i < Math.min(grooms.length, 8); i++) {
  const bride = brides[(i * 2) % brides.length]
  if (bride) slPairs.push({ by_profile_id: grooms[i].id, profile_id: bride.id })
}
for (let i = 0; i < Math.min(brides.length, 6); i++) {
  const groom = grooms[(i * 2) % grooms.length]
  if (groom) slPairs.push({ by_profile_id: brides[i].id, profile_id: groom.id })
}
const { error: slErr } = await supabase.from('shortlists').insert(slPairs)
if (slErr) console.error('Shortlist error:', slErr.message)
else console.log(`  ✓ Created ${slPairs.length} shortlists`)

console.log(`\n✅ Reseed complete! ${profiles.length} profiles, ${interestsToInsert.length} interests, ${matchPairs.length} matches seeded.\n`)
