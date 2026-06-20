'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BiodataUploader from '../components/BiodataUploader'

/* ─── India states & districts ───────────────────────────────── */
const INDIA_STATES: Record<string, string[]> = {
  'Andhra Pradesh':     ['Visakhapatnam','East Godavari','West Godavari','Krishna','Guntur','Prakasam','Nellore','Srikakulam','Vizianagaram','Kurnool','Kadapa','Chittoor','Anantapur','Nandyal','Sri Sathya Sai','Tirupati','Alluri Sitharama Raju','Anakapalli','Kakinada','Konaseema','Eluru','NTR District','Palnadu','Bapatla'],
  'Telangana':          ['Hyderabad','Rangareddy','Medchal','Warangal','Karimnagar','Khammam','Nizamabad','Adilabad','Mahbubnagar','Nalgonda','Siddipet','Yadadri Bhongir','Vikarabad','Sangareddy','Medak','Jagitial','Peddapalli','Rajanna Sircilla','Nirmal','Mancherial','Bhadradri Kothagudem','Suryapet','Mahabubabad','Jangaon','Mulugu'],
  'Karnataka':          ['Bengaluru Urban','Bengaluru Rural','Mysuru','Mangaluru','Hubballi-Dharwad','Belagavi','Kalaburagi','Tumakuru','Shivamogga','Vijayapura','Davangere','Ballari','Raichur','Hassan','Udupi','Chitradurga','Kodagu','Mandya','Bidar','Yadgir','Haveri','Gadag','Bagalkot','Koppal','Chamarajanagar','Chikkaballapura','Chikkamagaluru','Ramanagara','Kolar','Dharwad'],
  'Tamil Nadu':         ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Tiruppur','Vellore','Erode','Thoothukudi','Dindigul','Thanjavur','Cuddalore','Kancheepuram','Chengalpattu','Nagapattinam','Tiruvannamalai','Virudhunagar','Nilgiris','Ranipet','Ariyalur','Perambalur','Pudukkottai','Ramanathapuram','Sivaganga','Tenkasi','Theni','Tirupattur','Tiruvarur','Villupuram','Krishnagiri','Dharmapuri','Namakkal','Karur'],
  'Maharashtra':        ['Mumbai','Pune','Nagpur','Thane','Nashik','Aurangabad','Solapur','Amravati','Kolhapur','Nanded','Sangli','Jalgaon','Akola','Latur','Dhule','Ahmednagar','Chandrapur','Parbhani','Satara','Ratnagiri','Beed','Osmanabad','Nandurbar','Yavatmal','Wardha','Washim','Buldhana','Hingoli','Gondia','Bhandara','Gadchiroli'],
  'Delhi':              ['New Delhi','Central Delhi','North Delhi','South Delhi','East Delhi','West Delhi','North West Delhi','South West Delhi','North East Delhi','Shahdara'],
  'Uttar Pradesh':      ['Lucknow','Kanpur','Agra','Varanasi','Prayagraj','Ghaziabad','Noida','Meerut','Bareilly','Aligarh','Moradabad','Saharanpur','Gorakhpur','Firozabad','Jhansi','Muzaffarnagar','Mathura','Unnao','Ayodhya','Azamgarh','Sultanpur','Rae Bareli','Sitapur','Hardoi','Shahjahanpur','Rampur','Budaun','Bahraich','Gonda','Ballia','Bulandshahr','Bijnor'],
  'Gujarat':            ['Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Jamnagar','Junagadh','Gandhinagar','Anand','Navsari','Morbi','Mehsana','Surendranagar','Bharuch','Kheda','Patan','Valsad','Tapi','Narmada','Porbandar','Amreli','Botad','Kutch','Sabarkantha','Dang','Chhota Udaipur','Devbhoomi Dwarka','Gir Somnath'],
  'Rajasthan':          ['Jaipur','Jodhpur','Kota','Bikaner','Ajmer','Udaipur','Bhilwara','Alwar','Bharatpur','Sikar','Pali','Sri Ganganagar','Tonk','Barmer','Jhalawar','Banswara','Hanumangarh','Nagaur','Chittorgarh','Dausa','Sawai Madhopur','Baran','Jhunjhunu','Dungarpur','Jalore','Sirohi','Karauli','Dholpur'],
  'West Bengal':        ['Kolkata','Howrah','Asansol','Siliguri','Durgapur','Bardhaman','Malda','Baharampur','Kharagpur','Raiganj','Krishnanagar','Jalpaiguri','Darjeeling','Bankura','Purulia','Cooch Behar','Murshidabad','Nadia','South 24 Parganas','North 24 Parganas','Hooghly','Paschim Medinipur','Purba Medinipur'],
  'Madhya Pradesh':     ['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Dewas','Satna','Ratlam','Rewa','Singrauli','Burhanpur','Khandwa','Bhind','Chhindwara','Guna','Shivpuri','Vidisha','Chhatarpur','Damoh','Mandsaur','Khargone','Neemuch','Hoshangabad','Itarsi','Sehore','Betul','Seoni','Datia'],
  'Punjab':             ['Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Hoshiarpur','Batala','Pathankot','Moga','Muktsar','Barnala','Rajpura','Firozpur','Kapurthala','Sangrur','Faridkot','Gurdaspur','Ropar','Nawanshahr','Tarn Taran','Fatehgarh Sahib','Mansa','Fazilka'],
  'Haryana':            ['Faridabad','Gurugram','Panipat','Ambala','Yamunanagar','Rohtak','Hisar','Karnal','Sonipat','Panchkula','Bhiwani','Jind','Sirsa','Kaithal','Rewari','Palwal','Fatehabad','Mahendragarh','Nuh','Charkhi Dadri'],
  'Bihar':              ['Patna','Gaya','Bhagalpur','Muzaffarpur','Purnia','Darbhanga','Bihar Sharif','Arrah','Begusarai','Katihar','Munger','Chhapra','Hajipur','Siwan','Motihari','Nawada','Buxar','Kishanganj','Sitamarhi','Aurangabad','Supaul','Saharsa','Sasaram'],
  'Odisha':             ['Bhubaneswar','Cuttack','Rourkela','Berhampur','Sambalpur','Puri','Balasore','Bhadrak','Baripada','Jharsuguda','Bargarh','Jeypore','Angul','Dhenkanal','Kendrapara','Jajpur','Rayagada','Koraput','Phulbani','Keonjhar','Bolangir','Sundargarh'],
  'Kerala':             ['Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam','Palakkad','Alappuzha','Kottayam','Kannur','Kasaragod','Idukki','Malappuram','Pathanamthitta','Wayanad'],
  'Jharkhand':          ['Ranchi','Jamshedpur','Dhanbad','Bokaro','Deoghar','Hazaribag','Giridih','Ramgarh','Chaibasa','Chakradharpur'],
  'Assam':              ['Guwahati','Silchar','Dibrugarh','Jorhat','Nagaon','Tinsukia','Tezpur','Bongaigaon','Dhubri','North Lakhimpur','Karimganj','Sivasagar','Goalpara','Barpeta','Golaghat','Hailakandi'],
  'Uttarakhand':        ['Dehradun','Haridwar','Roorkee','Haldwani','Rudrapur','Kashipur','Rishikesh','Kotdwar','Ramnagar','Tehri','Almora','Nainital','Pithoragarh','Chamoli'],
  'Himachal Pradesh':   ['Shimla','Mandi','Solan','Dharamshala','Baddi','Nahan','Paonta Sahib','Sundarnagar','Kullu','Una','Hamirpur','Bilaspur','Chamba','Kangra'],
  'Chhattisgarh':       ['Raipur','Bhilai','Korba','Bilaspur','Durg','Rajnandgaon','Jagdalpur','Raigarh','Ambikapur','Mahasamund','Dhamtari'],
  'Goa':                ['North Goa','South Goa'],
  'Tripura':            ['Agartala','Dharmanagar','Udaipur','Kailasahar','Belonia'],
  'Manipur':            ['Imphal West','Imphal East','Thoubal','Bishnupur','Churachandpur'],
  'Meghalaya':          ['East Khasi Hills (Shillong)','West Garo Hills (Tura)','Jaintia Hills'],
  'J&K':                ['Srinagar','Jammu','Anantnag','Baramulla','Udhampur','Kathua'],
  'Ladakh':             ['Leh','Kargil'],
  'Puducherry':         ['Puducherry','Karaikal','Mahe','Yanam'],
  'Other / Abroad':     ['USA','UK','Canada','Australia','UAE','Singapore','New Zealand','Germany','Other'],
}

const STEPS = [
  { title: 'Basic Info',           subtitle: 'Your identity & credentials' },
  { title: 'Native Place',         subtitle: 'Where are you originally from?' },
  { title: 'Personal Details',     subtitle: 'Religion, lifestyle & appearance' },
  { title: 'Education & Career',   subtitle: 'Your professional background' },
  { title: 'Partner Preferences',  subtitle: 'Who are you looking for?' },
]

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+1',  label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+61', label: '🇦🇺 +61' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+65', label: '🇸🇬 +65' },
  { code: '+60', label: '🇲🇾 +60' },
  { code: '+64', label: '🇳🇿 +64' },
  { code: '+974', label: '🇶🇦 +974' },
]

const HEIGHTS_CM = [145,147,150,152,155,157,160,163,165,168,170,173,175,178,180,183,185,188,191,193,196]
const ftIn = (cm: number) => {
  const t = cm / 2.54; const ft = Math.floor(t / 12); const inc = Math.round(t % 12)
  return `${ft}'${inc}" (${cm}cm)`
}
const CASTES         = ['Reddy','Kamma','Kapu','Brahmin','Velama','Yadav','Naidu','Chettiar','Mudaliar','Lingayat','Vokkaliga','Nair','Pillai','Agarwal','Jat','Rajput','SC/ST','OBC','Don\'t wish to specify','No Caste Preference']
const RELIGIONS      = ['Hindu','Muslim','Christian','Sikh','Jain','Buddhist','No Religion','Other']
const TONGUES        = ['Telugu','Hindi','Tamil','Kannada','Malayalam','Marathi','Punjabi','Gujarati','Bengali','Urdu','English','Other']
const MARITAL        = ['Never Married','Divorced','Widowed','Separated']
const DIET_OPTS      = ['Vegetarian','Non-Vegetarian','Eggetarian','Vegan','Jain']
const FAMILY_TYPES   = ['Nuclear','Joint','Extended']
const FAMILY_STATUS  = ['Middle Class','Upper Middle Class','Rich / Affluent','High Net Worth']
const FAMILY_VALUES  = ['Orthodox','Moderate','Liberal']
const EDU_LEVELS     = ['10th / SSLC','12th / HSC','Diploma','B.Tech / B.E.','B.Sc / B.Com / B.A.','MBBS / BDS','B.Pharm','LLB','CA / CS / CMA','M.Tech / M.E.','MBA / PGDM','M.Sc / M.Com / M.A.','MS (USA/UK)','MD / MS (Medical)','PhD / Doctorate','Other']
const PROFESSIONS    = ['IT / Software Engineer','Software Architect / Manager','Data Scientist / AI/ML','Product Manager','Business Analyst','Doctor (MBBS / MD)','Dentist','Pharmacist','Nurse / Healthcare','Engineer (Non-IT)','Civil / Architect','Mechanical Engineer','CA / CFA / Finance','Banker / Financial Services','Lawyer / Legal','Government / IAS / IPS / PSU','Defence / Armed Forces','Teacher / Professor','Researcher / Scientist','Entrepreneur / Business Owner','Sales / Marketing','Consultant','Media / Journalist / Content','Arts / Design / Architecture','Agriculture / Farming','Other']
const INCOME_RANGES  = ['Below 3 LPA','3–6 LPA','6–10 LPA','10–15 LPA','15–25 LPA','25–50 LPA','50–1 Crore PA','1 Crore+ PA','Not disclosed']
const VISA_STATUS    = ['Indian Citizen (India)','Indian Citizen (Abroad — NRI)','OCI / PIO','Permanent Resident','Work Visa / H1B / L1','Student Visa','Other']
const MANGLIK_OPTS   = ['Yes','No','Anshik (Partial)','Don\'t know']
const STARS          = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati']
const RASHIS         = ['Mesha (Aries)','Vrishabha (Taurus)','Mithuna (Gemini)','Kataka (Cancer)','Simha (Leo)','Kanya (Virgo)','Tula (Libra)','Vrishchika (Scorpio)','Dhanu (Sagittarius)','Makara (Capricorn)','Kumbha (Aquarius)','Meena (Pisces)']

/* ─── Chip selector ──────────────────────────────────────────── */
function ChipSelect({ options, value, onChange, multi = false }: { options: string[]; value: string | string[]; onChange: (v: string | string[]) => void; multi?: boolean }) {
  const active = multi ? (value as string[]) : [value as string]
  function toggle(opt: string) {
    if (multi) {
      const arr = value as string[]
      onChange(arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt])
    } else {
      onChange(opt === value ? '' : opt)
    }
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => toggle(opt)} style={{
          padding: '6px 13px', borderRadius: '99px', fontSize: '12.5px', fontWeight: 500,
          cursor: 'pointer', border: '1.5px solid', transition: 'all 0.12s',
          background: active.includes(opt) ? '#7F1D1D' : 'white',
          color:      active.includes(opt) ? 'white'   : '#555',
          borderColor:active.includes(opt) ? '#7F1D1D' : '#DDDDD8',
        }}>
          {opt}
        </button>
      ))}
    </div>
  )
}

/* ─── Label ──────────────────────────────────────────────────── */
function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>
      {children} {optional && <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span>}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid #E5E7EB', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box',
  background: 'white', color: '#111', transition: 'border-color 0.15s',
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function RegisterPage() {
  const router = useRouter()
  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [phoneCode, setPhoneCode] = useState('+91')
  const [photo, setPhoto]     = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [biodataParsed, setBiodataParsed] = useState(false)

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    if (id) router.replace(`/profile/${id}`)
  }, [])

  const [form, setForm] = useState({
    // Step 1
    profile_by: 'self', gender: '', date_of_birth: '', full_name: '', phone: '', email: '', password: '', confirmPassword: '',
    // Step 2
    native_state: '', native_district: '', current_city: '', current_state: '', current_country: 'India',
    // Step 3
    marital_status: 'Never Married', height_cm: '', religion: 'Hindu', caste: '', mother_tongue: 'Telugu',
    gotram: '', diet: '', manglik: '', star: '', rashi: '', complexion: '',
    family_type: '', family_status: '', family_values: '',
    // Step 4
    education: '', profession: '', company: '', annual_income: '', visa_status: 'Indian Citizen (India)', about: '',
    // Step 5 (partner prefs — stored as JSON strings)
    pref_age_min: '22', pref_age_max: '32', pref_height_min: '152', pref_height_max: '183',
    pref_states: '[]', pref_castes: '[]', pref_education: '', pref_professions: '[]', pref_income: '',
  })

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const districts = form.native_state ? (INDIA_STATES[form.native_state] || []) : []

  function validateStep(s: number): string {
    if (s === 1) {
      if (!form.full_name.trim())   return 'Full name is required'
      if (!form.gender)              return 'Please select gender'
      if (!form.date_of_birth)       return 'Date of birth is required'
      if (!form.email.trim())        return 'Email is required'
      if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters'
      if (form.password !== form.confirmPassword)     return 'Passwords do not match'
    }
    if (s === 2) {
      if (!form.native_state)    return 'Please select your native state'
      if (!form.native_district) return 'Please select your native district'
      if (!form.current_city.trim()) return 'Current city is required'
    }
    if (s === 3) { /* optional fields — no hard requirement */ }
    if (s === 4) {
      if (!form.profession.trim()) return 'Profession is required'
    }
    return ''
  }

  async function handleSubmit() {
    setLoading(true); setError('')
    localStorage.removeItem('my_profile_id')
    localStorage.removeItem('my_user_id')
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password })
      if (authError) throw authError
      const userId = authData.user?.id
      if (!userId) throw new Error('Signup failed — no user ID returned')

      let photoUrl = ''
      if (photo) {
        const ext = photo.name.split('.').pop()
        const { error: uploadError } = await supabase.storage.from('profile-photos').upload(`${userId}/main.${ext}`, photo)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(`${userId}/main.${ext}`)
          photoUrl = urlData.publicUrl
        }
      }

      const { data: profileData, error: profileError } = await supabase.from('profiles').insert({
        user_id: userId,
        full_name: form.full_name, gender: form.gender, date_of_birth: form.date_of_birth,
        phone: form.phone ? `${phoneCode} ${form.phone.trim()}` : '',
        email: form.email,
        profile_created_by: form.profile_by,
        native_state: form.native_state, native_district: form.native_district,
        native_region: form.native_state, // use state as region for backwards compat
        current_city: form.current_city, current_state: form.current_state,
        height_cm: form.height_cm ? parseInt(form.height_cm) : null,
        marital_status: form.marital_status?.toLowerCase().replace(/ /g,'_') ?? 'never_married',
        religion: form.religion, caste: form.caste, mother_tongue: form.mother_tongue,
        gotra: form.gotram, diet: form.diet, manglik: form.manglik,
        star: form.star, rashi: form.rashi,
        family_type: form.family_type, annual_income: form.annual_income,
        visa_status: form.visa_status,
        education: form.education, profession: form.profession, company: form.company,
        about: form.about,
        photo_url: photoUrl, photo_visibility: 'private',
        status: 'approved', verified: false,
        premium_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }).select('id').maybeSingle()
      if (profileError) throw profileError

      localStorage.setItem('my_user_id', userId)
      if (profileData?.id) localStorage.setItem('my_profile_id', profileData.id)
      router.push('/browse?new=1')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const prefStates: string[]     = JSON.parse(form.pref_states     || '[]')
  const prefCastes: string[]     = JSON.parse(form.pref_castes     || '[]')
  const prefProfessions: string[] = JSON.parse(form.pref_professions || '[]')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F3F0' }}>

      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.04em', color: '#111' }}>
              Native<span style={{ color: '#7F1D1D' }}>Matrimony</span>
            </span>
          </Link>
          <Link href="/login" style={{ fontSize: '13px', color: '#9CA3AF', textDecoration: 'none' }}>Sign in instead</Link>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '28px 16px 60px' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>

          {/* Step bar */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '14px' }}>
              {STEPS.map((s, i) => (
                <div key={s.title} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, transition: 'all 0.2s',
                    background: i + 1 < step ? '#7F1D1D' : i + 1 === step ? '#7F1D1D' : '#E5E7EB',
                    color: i + 1 <= step ? 'white' : '#9CA3AF',
                    border: i + 1 === step ? '3px solid #FCA5A5' : '3px solid transparent',
                    boxSizing: 'border-box',
                  }}>
                    {i + 1 < step
                      ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: '2px', margin: '0 4px', borderRadius: '99px', background: i + 1 < step ? '#7F1D1D' : '#E5E7EB', transition: 'background 0.3s' }} />
                  )}
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7F1D1D', margin: '0 0 2px' }}>
                Step {step} of {STEPS.length}
              </p>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F0F0F', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                {STEPS[step - 1].title}
              </h2>
              <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>{STEPS[step - 1].subtitle}</p>
            </div>
          </div>

          {/* Card */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E8E8', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', padding: '24px' }}>

            {error && (
              <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', fontSize: '13.5px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
                {error}
              </div>
            )}

            {/* ── STEP 1: Basic Info ────────────────────────────── */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div>
                  <Label>Profile registered by</Label>
                  <ChipSelect options={['Myself','Parent / Guardian','Sibling / Friend']}
                    value={form.profile_by === 'self' ? 'Myself' : form.profile_by === 'parent' ? 'Parent / Guardian' : 'Sibling / Friend'}
                    onChange={v => set('profile_by', v === 'Myself' ? 'self' : v === 'Parent / Guardian' ? 'parent' : 'sibling')} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Label>Gender</Label>
                    <select style={inputStyle} value={form.gender} onChange={e => set('gender', e.target.value)}>
                      <option value="">Select</option>
                      <option value="male">Male (Groom)</option>
                      <option value="female">Female (Bride)</option>
                    </select>
                  </div>
                  <div>
                    <Label>Date of birth</Label>
                    <input style={inputStyle} type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label>Full name</Label>
                  <input style={inputStyle} placeholder="e.g. Ravi Kumar Reddy" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                </div>

                <div>
                  <Label optional>Mobile number</Label>
                  <div style={{ display: 'flex', border: '1.5px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                    <select value={phoneCode} onChange={e => setPhoneCode(e.target.value)}
                      style={{ background: '#F9FAFB', fontSize: '13px', fontWeight: 600, padding: '9px 8px', border: 'none', outline: 'none', borderRight: '1px solid #E5E7EB', flexShrink: 0 }}>
                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                    <input style={{ flex: 1, padding: '9px 12px', fontSize: '13.5px', border: 'none', outline: 'none', background: 'white' }}
                      type="tel" placeholder="Mobile number"
                      value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g,''))} />
                  </div>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>Private — used only for verification, never shown to members</p>
                </div>

                <div>
                  <Label>Email address</Label>
                  <input style={inputStyle} type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>

                <div>
                  <Label>Password</Label>
                  <input style={inputStyle} type="password" placeholder="Minimum 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
                </div>

                <div>
                  <Label>Confirm password</Label>
                  <input style={inputStyle} type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
                </div>

                {/* Biodata uploader */}
                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#7F1D1D', marginBottom: '8px' }}>
                    Have a biodata PDF? Auto-fill this form →
                  </p>
                  <BiodataUploader onParsed={data => {
                    setForm(f => ({
                      ...f,
                      ...(data.full_name      ? { full_name:      String(data.full_name) }      : {}),
                      ...(data.gender         ? { gender:         String(data.gender) }          : {}),
                      ...(data.date_of_birth  ? { date_of_birth:  String(data.date_of_birth) }  : {}),
                      ...(data.religion       ? { religion:       String(data.religion) }        : {}),
                      ...(data.caste          ? { caste:          String(data.caste) }           : {}),
                      ...(data.mother_tongue  ? { mother_tongue:  String(data.mother_tongue) }  : {}),
                      ...(data.education      ? { education:      String(data.education) }       : {}),
                      ...(data.profession     ? { profession:     String(data.profession) }      : {}),
                      ...(data.height_cm      ? { height_cm:      String(data.height_cm) }      : {}),
                      ...(data.native_district? { native_district:String(data.native_district) }: {}),
                      ...(data.current_city   ? { current_city:   String(data.current_city) }   : {}),
                      ...(data.current_state  ? { current_state:  String(data.current_state) }  : {}),
                      ...(data.about          ? { about:          String(data.about).slice(0,600)}: {}),
                    }))
                    setBiodataParsed(true)
                  }} />
                  {biodataParsed && <p style={{ fontSize: '11.5px', color: '#059669', marginTop: '6px', textAlign: 'center' }}>✓ Fields filled from biodata</p>}
                </div>
              </div>
            )}

            {/* ── STEP 2: Native Place ──────────────────────────── */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Label>Native state</Label>
                  <select style={inputStyle} value={form.native_state} onChange={e => { set('native_state', e.target.value); set('native_district', '') }}>
                    <option value="">Select state / region</option>
                    {Object.keys(INDIA_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Native district / city</Label>
                  {districts.length > 0 ? (
                    <select style={inputStyle} value={form.native_district} onChange={e => set('native_district', e.target.value)} disabled={!form.native_state}>
                      <option value="">Select district</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  ) : (
                    <input style={inputStyle} placeholder="Type your district / city" value={form.native_district} onChange={e => set('native_district', e.target.value)} />
                  )}
                </div>
                <div style={{ background: '#FEF2F2', borderRadius: '10px', padding: '12px 14px', border: '1px solid #FECACA' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#7F1D1D', margin: '0 0 4px' }}>Why we ask this</p>
                  <p style={{ fontSize: '11.5px', color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
                    Native place is how people discover you — members search by district first.
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Label>Currently living in city</Label>
                    <input style={inputStyle} placeholder="e.g. Hyderabad" value={form.current_city} onChange={e => set('current_city', e.target.value)} />
                  </div>
                  <div>
                    <Label>Current state</Label>
                    <input style={inputStyle} placeholder="e.g. Telangana" value={form.current_state} onChange={e => set('current_state', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Country of residence</Label>
                  <ChipSelect options={['India','USA','UK','Canada','Australia','UAE','Singapore','New Zealand','Germany','Other']}
                    value={form.current_country}
                    onChange={v => set('current_country', v as string)} />
                </div>
              </div>
            )}

            {/* ── STEP 3: Personal Details ──────────────────────── */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Label>Marital status</Label>
                  <ChipSelect options={MARITAL} value={form.marital_status} onChange={v => set('marital_status', v as string)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Label optional>Height</Label>
                    <select style={inputStyle} value={form.height_cm} onChange={e => set('height_cm', e.target.value)}>
                      <option value="">Select</option>
                      {HEIGHTS_CM.map(h => <option key={h} value={String(h)}>{ftIn(h)}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label optional>Mother tongue</Label>
                    <select style={inputStyle} value={form.mother_tongue} onChange={e => set('mother_tongue', e.target.value)}>
                      {TONGUES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Religion</Label>
                  <ChipSelect options={RELIGIONS} value={form.religion} onChange={v => set('religion', v as string)} />
                </div>
                <div>
                  <Label optional>Caste / Community</Label>
                  <select style={inputStyle} value={form.caste} onChange={e => set('caste', e.target.value)}>
                    <option value="">Select or type below</option>
                    {CASTES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input style={{ ...inputStyle, marginTop: '6px' }} placeholder="Or type caste / sub-caste" value={CASTES.includes(form.caste) ? '' : form.caste} onChange={e => set('caste', e.target.value)} />
                </div>
                <div>
                  <Label optional>Gotram</Label>
                  <input style={inputStyle} placeholder="e.g. Kashyapa, Bharadwaja" value={form.gotram} onChange={e => set('gotram', e.target.value)} />
                </div>
                <div>
                  <Label optional>Diet</Label>
                  <ChipSelect options={DIET_OPTS} value={form.diet} onChange={v => set('diet', v as string)} />
                </div>
                <div>
                  <Label optional>Manglik / Chevvai Dosham</Label>
                  <ChipSelect options={MANGLIK_OPTS} value={form.manglik} onChange={v => set('manglik', v as string)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Label optional>Star / Nakshatra</Label>
                    <select style={inputStyle} value={form.star} onChange={e => set('star', e.target.value)}>
                      <option value="">Select</option>
                      {STARS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label optional>Rashi / Moon sign</Label>
                    <select style={inputStyle} value={form.rashi} onChange={e => set('rashi', e.target.value)}>
                      <option value="">Select</option>
                      {RASHIS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <Label optional>Family type</Label>
                  <ChipSelect options={FAMILY_TYPES} value={form.family_type} onChange={v => set('family_type', v as string)} />
                </div>
                <div>
                  <Label optional>Family status</Label>
                  <ChipSelect options={FAMILY_STATUS} value={form.family_status} onChange={v => set('family_status', v as string)} />
                </div>
                <div>
                  <Label optional>Family values</Label>
                  <ChipSelect options={FAMILY_VALUES} value={form.family_values} onChange={v => set('family_values', v as string)} />
                </div>
              </div>
            )}

            {/* ── STEP 4: Education & Career ────────────────────── */}
            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Label>Highest education</Label>
                  <select style={inputStyle} value={form.education} onChange={e => set('education', e.target.value)}>
                    <option value="">Select qualification</option>
                    {EDU_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Profession / Occupation</Label>
                  <select style={inputStyle} value={form.profession} onChange={e => set('profession', e.target.value)}>
                    <option value="">Select profession</option>
                    {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input style={{ ...inputStyle, marginTop: '6px' }} placeholder="Or type your exact role (e.g. Senior Software Engineer at TCS)"
                    value={PROFESSIONS.includes(form.profession) ? '' : form.profession}
                    onChange={e => set('profession', e.target.value)} />
                </div>
                <div>
                  <Label optional>Company / Organisation</Label>
                  <input style={inputStyle} placeholder="e.g. Infosys, AIIMS, Government" value={form.company} onChange={e => set('company', e.target.value)} />
                </div>
                <div>
                  <Label optional>Annual income</Label>
                  <select style={inputStyle} value={form.annual_income} onChange={e => set('annual_income', e.target.value)}>
                    <option value="">Prefer not to say</option>
                    {INCOME_RANGES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <Label optional>Visa / Residency status</Label>
                  <select style={inputStyle} value={form.visa_status} onChange={e => set('visa_status', e.target.value)}>
                    {VISA_STATUS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <Label optional>About yourself</Label>
                  <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={4}
                    placeholder="Write a short note about yourself, your family, and what you're looking for in a partner..."
                    value={form.about} onChange={e => set('about', e.target.value)} />
                  <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px', textAlign: 'right' }}>{form.about.length}/600</p>
                </div>
                <div>
                  <Label optional>Profile photo</Label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', borderRadius: '10px', border: `2px dashed ${photo ? '#7F1D1D' : '#E5E7EB'}`,
                    cursor: 'pointer', transition: 'border-color 0.15s', background: photo ? '#FEF2F2' : '#FAFAFA',
                  }}>
                    {photoPreview
                      ? <img src={photoPreview} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F0EDEA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.75">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                        </div>}
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: 0 }}>
                        {photo ? photo.name : 'Upload your photo'}
                      </p>
                      <p style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '2px' }}>
                        Visible only after a mutual match • JPG or PNG
                      </p>
                    </div>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)) }
                    }} />
                  </label>
                </div>
              </div>
            )}

            {/* ── STEP 5: Partner Preferences ───────────────────── */}
            {step === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '12.5px', color: '#9CA3AF', margin: '0 0 4px', lineHeight: 1.5 }}>
                  Optional — you can always update these later. They help us surface better matches for you.
                </p>
                <div>
                  <Label optional>Preferred age range</Label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input style={{ ...inputStyle, width: '80px', textAlign: 'center' }} type="number" min="18" max="70"
                      value={form.pref_age_min} onChange={e => set('pref_age_min', e.target.value)} />
                    <span style={{ color: '#9CA3AF' }}>to</span>
                    <input style={{ ...inputStyle, width: '80px', textAlign: 'center' }} type="number" min="18" max="70"
                      value={form.pref_age_max} onChange={e => set('pref_age_max', e.target.value)} />
                    <span style={{ color: '#9CA3AF', fontSize: '13px' }}>years</span>
                  </div>
                </div>
                <div>
                  <Label optional>Preferred height range</Label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <select style={{ ...inputStyle, flex: 1 }} value={form.pref_height_min} onChange={e => set('pref_height_min', e.target.value)}>
                      {HEIGHTS_CM.map(h => <option key={h} value={String(h)}>{ftIn(h)}</option>)}
                    </select>
                    <span style={{ color: '#9CA3AF', flexShrink: 0 }}>to</span>
                    <select style={{ ...inputStyle, flex: 1 }} value={form.pref_height_max} onChange={e => set('pref_height_max', e.target.value)}>
                      {HEIGHTS_CM.map(h => <option key={h} value={String(h)}>{ftIn(h)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <Label optional>Preferred native state(s)</Label>
                  <ChipSelect options={Object.keys(INDIA_STATES).slice(0,12)} value={prefStates} onChange={v => set('pref_states', JSON.stringify(v))} multi />
                  <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>Leave empty to show all states</p>
                </div>
                <div>
                  <Label optional>Preferred caste(s)</Label>
                  <ChipSelect options={['No Preference', ...CASTES.slice(0,10)]} value={prefCastes} onChange={v => set('pref_castes', JSON.stringify(v))} multi />
                </div>
                <div>
                  <Label optional>Minimum education</Label>
                  <select style={inputStyle} value={form.pref_education} onChange={e => set('pref_education', e.target.value)}>
                    <option value="">No preference</option>
                    {EDU_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <Label optional>Preferred professions</Label>
                  <ChipSelect options={PROFESSIONS.slice(0,10)} value={prefProfessions} onChange={v => set('pref_professions', JSON.stringify(v))} multi />
                </div>
                <div>
                  <Label optional>Expected annual income</Label>
                  <select style={inputStyle} value={form.pref_income} onChange={e => set('pref_income', e.target.value)}>
                    <option value="">No preference</option>
                    {INCOME_RANGES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div style={{ background: '#ECFDF5', borderRadius: '10px', padding: '12px 14px', border: '1px solid #A7F3D0', marginTop: '4px' }}>
                  <p style={{ fontSize: '12.5px', fontWeight: 600, color: '#065F46', margin: '0 0 4px' }}>
                    🎉 You&apos;re almost done!
                  </p>
                  <p style={{ fontSize: '11.5px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                    Click &ldquo;Create profile&rdquo; to go live. You can add more details and a photo from your profile page.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Nav buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', alignItems: 'center' }}>
            {step > 1 ? (
              <button onClick={() => { setError(''); setStep(s => s - 1) }}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #DDDDD8', background: 'white', cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, color: '#555' }}>
                ← Back
              </button>
            ) : <div />}
            {step >= 3 && step < 5 && (
              <button onClick={() => { setError(''); setStep(s => s + 1) }}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1.5px solid #DDDDD8', background: 'white', cursor: 'pointer', fontSize: '12.5px', color: '#9CA3AF' }}>
                Skip for now →
              </button>
            )}
            {step < 5 ? (
              <button onClick={() => {
                const err = validateStep(step)
                if (err) { setError(err); return }
                setError(''); setStep(s => s + 1)
              }} className="btn-primary" style={{ padding: '11px 28px', fontSize: '14px' }}>
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ padding: '11px 28px', fontSize: '14px' }}>
                {loading ? 'Creating profile…' : 'Create profile →'}
              </button>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#9CA3AF', marginTop: '20px' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ fontWeight: 600, color: '#7F1D1D', textDecoration: 'none' }}>Sign in</Link>
          </p>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#C4C4C4', marginTop: '8px' }}>
            Free access to all features until 30 September 2026<br />
            By registering you agree to our{' '}
            <Link href="/terms" style={{ textDecoration: 'underline', color: 'inherit' }}>Terms</Link>
            {' '}&amp;{' '}
            <Link href="/privacy" style={{ textDecoration: 'underline', color: 'inherit' }}>Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
