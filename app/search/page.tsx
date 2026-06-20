'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import AppHeader from '../components/AppHeader'
import MobileNav from '../components/MobileNav'
import AppFooter from '../components/AppFooter'

/* ─── Types ─────────────────────────────────────────────────── */
interface Profile {
  id: string; full_name: string; gender: string; date_of_birth: string | null
  height_cm: number | null; marital_status: string | null; religion: string | null
  caste: string | null; mother_tongue: string | null; native_district: string | null
  native_region: string | null; native_state: string | null; current_city: string | null
  current_state: string | null; profession: string | null; education: string | null
  photo_url: string | null; photo_visibility: string | null; status: string
  last_login_at: string | null; created_at: string; about: string | null
  profile_created_by: string | null; manglik: string | null; annual_income: string | null
  diet: string | null; smoking: string | null; drinking: string | null
  family_type: string | null; star: string | null; gotra: string | null
  rashi: string | null; visa_status: string | null; native_country: string | null
}

/* ─── Constants ─────────────────────────────────────────────── */
const REGIONS: Record<string, string[]> = {
  'Telangana':      ['Hyderabad','Rangareddy','Medchal','Warangal','Karimnagar','Khammam','Nizamabad','Adilabad','Mahbubnagar','Nalgonda','Siddipet','Yadadri Bhongir','Vikarabad','Sangareddy','Medak','Jagitial','Peddapalli','Rajanna Sircilla','Nirmal','Mancherial','Bhadradri Kothagudem','Suryapet','Mahabubabad','Jangaon','Mulugu'],
  'Coastal Andhra': ['Visakhapatnam','East Godavari','West Godavari','Krishna','Guntur','Prakasam','Nellore','Srikakulam','Vizianagaram','Alluri Sitharama Raju','Anakapalli','Kakinada','Konaseema','Eluru','NTR District','Palnadu','Bapatla'],
  'Rayalaseema':    ['Kurnool','Kadapa','Chittoor','Anantapur','Nandyal','Sri Sathya Sai','Tirupati'],
  'Karnataka':      ['Bengaluru Urban','Bengaluru Rural','Mysuru','Mangaluru','Hubli-Dharwad','Belagavi','Kalaburagi','Tumakuru','Shivamogga','Vijayapura','Davangere','Ballari','Raichur','Hassan','Udupi','Chitradurga','Kodagu','Mandya','Bidar','Yadgir','Haveri','Gadag','Bagalkot','Koppal','Chamarajanagar','Chikkaballapura','Chikkamagaluru','Ramanagara','Kolar','Dharwad'],
  'Tamil Nadu':     ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Tiruppur','Ranipet','Vellore','Erode','Thoothukudi','Dindigul','Thanjavur','Cuddalore','Kancheepuram','Chengalpattu','Nagapattinam','Tiruvannamalai','Virudhunagar','Nilgiris','Ariyalur','Perambalur','Pudukkottai','Ramanathapuram','Sivaganga','Tenkasi','Theni','Tirupattur','Tiruvarur','Villupuram','Krishnagiri','Dharmapuri','Namakkal','Karur'],
  'Maharashtra':    ['Mumbai','Pune','Nagpur','Thane','Nashik','Aurangabad','Solapur','Amravati','Kolhapur','Nanded','Sangli','Malegaon','Jalgaon','Akola','Latur','Dhule','Ahmednagar','Chandrapur','Parbhani','Ichalkaranji','Jalna','Ambernath','New Mumbai','Bhiwandi','Satara','Ratnagiri','Beed','Osmanabad','Nandurbar','Yavatmal','Wardha','Washim','Buldhana','Hingoli','Gondia','Bhandara','Gadchiroli'],
  'Delhi / NCR':    ['New Delhi','North Delhi','South Delhi','East Delhi','West Delhi','Central Delhi','North West Delhi','South West Delhi','North East Delhi','Shahdara','Gurugram','Faridabad','Noida','Ghaziabad','Greater Noida'],
  'Uttar Pradesh':  ['Lucknow','Kanpur','Agra','Varanasi','Allahabad (Prayagraj)','Ghaziabad','Noida','Meerut','Bareilly','Aligarh','Moradabad','Saharanpur','Gorakhpur','Firozabad','Jhansi','Muzaffarnagar','Mathura','Unnao','Etawah','Hapur','Ayodhya','Azamgarh','Sultanpur','Rae Bareli','Sitapur','Hardoi','Shahjahanpur','Rampur','Budaun','Bahraich','Barabanki','Fatehpur','Gonda','Ballia','Bulandshahr','Bijnor'],
  'Gujarat':        ['Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Jamnagar','Junagadh','Gandhinagar','Anand','Navsari','Morbi','Mehsana','Surendranagar','Bharuch','Kheda','Patan','Mahesana','Valsad','Tapi','Narmada','Dang','Porbandar','Amreli','Botad','Arvalli','Chhota Udaipur','Devbhoomi Dwarka','Gir Somnath','Kutch','Sabarkantha'],
  'Rajasthan':      ['Jaipur','Jodhpur','Kota','Bikaner','Ajmer','Udaipur','Bhilwara','Alwar','Bharatpur','Sikar','Pali','Sri Ganganagar','Tonk','Dhaulpur','Barmer','Jhalawar','Banswara','Hanumangarh','Nagaur','Chittorgarh','Dausa','Sawai Madhopur','Baran','Jhunjhunu','Dungarpur','Jalore','Sirohi','Karauli'],
  'West Bengal':    ['Kolkata','Howrah','Asansol','Siliguri','Durgapur','Bardhaman','Malda','Baharampur','Habra','Kharagpur','Shantipur','Dankuni','Dhulian','Ranaghat','Haldia','Raiganj','Krishnanagar','Nabadwip','Medinipur','Jalpaiguri','Darjeeling','Bankura','Purulia','Cooch Behar','Murshidabad','Nadia','South 24 Parganas','North 24 Parganas'],
  'Madhya Pradesh': ['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Dewas','Satna','Ratlam','Rewa','Murwara','Singrauli','Burhanpur','Khandwa','Bhind','Chhindwara','Guna','Shivpuri','Vidisha','Chhatarpur','Damoh','Mandsaur','Khargone','Neemuch','Pithampur','Hoshangabad','Itarsi','Sehore','Betul','Seoni','Datia'],
  'Punjab':         ['Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Hoshiarpur','Batala','Pathankot','Moga','Abohar','Malerkotla','Khanna','Phagwara','Muktsar','Barnala','Rajpura','Firozpur','Kapurthala','Sangrur','Faridkot','Gurdaspur','Ropar','Nawanshahr','Tarn Taran','Fatehgarh Sahib','Mansa','Fazilka'],
  'Haryana':        ['Faridabad','Gurugram','Panipat','Ambala','Yamunanagar','Rohtak','Hisar','Karnal','Sonipat','Panchkula','Bhiwani','Bahadurgarh','Jind','Sirsa','Thanesar','Kaithal','Rewari','Palwal','Fatehabad','Mahendragarh','Nuh','Charkhi Dadri'],
  'Bihar':          ['Patna','Gaya','Bhagalpur','Muzaffarpur','Purnia','Darbhanga','Bihar Sharif','Arrah','Begusarai','Katihar','Munger','Chhapra','Danapur','Bettiah','Saharsa','Sasaram','Hajipur','Dehri','Siwan','Motihari','Nawada','Bagaha','Buxar','Kishanganj','Sitamarhi','Jahanabad','Aurangabad (Bihar)','Supaul'],
  'Odisha':         ['Bhubaneswar','Cuttack','Rourkela','Berhampur','Sambalpur','Puri','Balasore','Bhadrak','Baripada','Jharsuguda','Bargarh','Jeypore','Angul','Dhenkanal','Kendrapara','Jajpur','Rayagada','Koraput','Phulbani','Keonjhar','Bolangir','Sundargarh'],
  'Kerala':         ['Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam','Palakkad','Alappuzha','Kottayam','Kannur','Kasaragod','Idukki','Malappuram','Pathanamthitta','Wayanad'],
  'Assam':          ['Guwahati','Silchar','Dibrugarh','Jorhat','Nagaon','Tinsukia','Tezpur','Bongaigaon','Dhubri','North Lakhimpur','Karimganj','Sivasagar','Goalpara','Barpeta','Lanka','Lumding','Mangaldoi','Sibsagar','Golaghat','Hailakandi'],
  'Jharkhand':      ['Ranchi','Jamshedpur','Dhanbad','Bokaro','Deoghar','Phusro','Hazaribag','Giridih','Ramgarh','Medininagar','Chirkunda','Chakradharpur','Chaibasa'],
  'Himachal Pradesh':['Shimla','Mandi','Solan','Dharamshala','Baddi','Nahan','Paonta Sahib','Sundarnagar','Kullu','Una','Hamirpur','Bilaspur','Chamba','Kangra','Kinnaur','Lahaul and Spiti','Sirmaur','Sirsa'],
  'Uttarakhand':    ['Dehradun','Haridwar','Roorkee','Haldwani','Rudrapur','Kashipur','Rishikesh','Kotdwar','Ramnagar','Manglaur','Mussoorie','Tehri','Almora','Nainital','Pithoragarh','Chamoli','Champawat','Bageshwar','Rudraprayag','Pauri'],
  'Chhattisgarh':   ['Raipur','Bhilai','Korba','Bilaspur','Durg','Rajnandgaon','Jagdalpur','Raigarh','Ambikapur','Mahasamund','Dhamtari','Chirmiri','Bhatapara','Dalli Rajhara'],
  'Goa':            ['Panaji','Margao','Vasco da Gama','Mapusa','Ponda','Bicholim','Curchorem','Canacona','Quepem'],
  'Tripura':        ['Agartala','Dharmanagar','Udaipur','Kailasahar','Belonia','Kamalpur','Ambassa'],
  'Manipur':        ['Imphal','Thoubal','Bishnupur','Churachandpur','Chandel','Ukhrul','Senapati'],
  'Meghalaya':      ['Shillong','Tura','Nongstoin','Williamnagar','Baghmara','Resubelpara','Jowai'],
  'Nagaland':       ['Kohima','Dimapur','Mokokchung','Tuensang','Wokha','Zunheboto','Phek'],
  'Arunachal Pradesh':['Itanagar','Naharlagun','Pasighat','Namsai','Bomdila','Ziro','Along'],
  'Mizoram':        ['Aizawl','Lunglei','Champhai','Kolasib','Mamit','Serchhip','Saiha'],
  'Sikkim':         ['Gangtok','Namchi','Gyalshing','Mangan'],
  'J&K / Ladakh':   ['Srinagar','Jammu','Anantnag','Baramulla','Sopore','Udhampur','Kathua','Leh','Kargil'],
  'Andaman & Nicobar':['Port Blair','Diglipur','Car Nicobar'],
  'Puducherry':     ['Puducherry','Karaikal','Mahe','Yanam'],
}
const HEIGHTS_CM = [147,150,152,155,157,160,163,165,168,170,173,175,178,180,183,185,188,191]
const ftIn = (cm: number) => {
  const totalIn = cm / 2.54; const ft = Math.floor(totalIn / 12); const inc = Math.round(totalIn % 12)
  return `${ft}'${inc}" (${cm}cm)`
}
const CASTES        = ['Reddy','Kamma','Kapu','Brahmin','Velama','Yadav','Naidu','Chettiar','Mudaliar','SC/ST','OBC','Caste No Bar']
const RELIGIONS     = ['Hindu','Muslim','Christian','Sikh','Jain','Buddhist']
const TONGUES       = ['Telugu','Hindi','Tamil','Kannada','Malayalam','Marathi','English','Urdu']
const EDUCATION_LVL = ['10th / SSLC','12th / HSC','Diploma','Graduate','Post Graduate','Doctorate','CA / CS / CMA']
const PROFESSIONS   = ['IT / Software','Business / Self-employed','Government / PSU','Healthcare / Medical','Education / Teaching','Finance / Banking','Law','Engineering (Non-IT)','Arts / Design / Media','Agriculture']
const PROF_KW: Record<string,string[]> = {
  'IT / Software':           ['software','engineer','developer','it ','tech','programmer'],
  'Business / Self-employed':['business','entrepreneur','owner','trader','self'],
  'Government / PSU':        ['government','ias','ips','civil','bank','railway','psu'],
  'Healthcare / Medical':    ['doctor','nurse','physician','medical','pharma','mbbs'],
  'Education / Teaching':    ['teacher','professor','lecturer','faculty','principal'],
  'Finance / Banking':       ['finance','chartered','accountant','ca ','cfa','banker','insurance'],
  'Law':                     ['lawyer','advocate','legal','attorney','judge'],
  'Engineering (Non-IT)':    ['mechanical','civil','electrical','chemical','aerospace'],
  'Arts / Design / Media':   ['artist','actor','media','journalist','designer','architect'],
  'Agriculture':             ['farmer','agriculture','farm'],
}
const MARITAL       = ['Never Married','Divorced','Widowed','Separated']
const MARITAL_VALS: Record<string,string> = { 'Never Married':'never_married','Divorced':'divorced','Widowed':'widowed','Separated':'separated' }
const DIET_OPTS     = ['Vegetarian','Non-Vegetarian','Eggetarian','Vegan','Jain']
const SMOKE_OPTS    = ['Non-Smoker','Smoker','Occasional']
const DRINK_OPTS    = ['Non-Drinker','Social Drinker','Drinker']
const FAMILY_TYPE   = ['Nuclear','Joint','Extended']
const FAMILY_STATUS = ['Middle Class','Upper Middle Class','Rich / Affluent','High Net Worth']
const FAMILY_VALUES = ['Orthodox','Moderate','Liberal']
const INCOME_RANGES = ['Below 3 LPA','3–6 LPA','6–10 LPA','10–15 LPA','15–25 LPA','25–50 LPA','50 LPA+']
const COUNTRIES     = ['India','USA','UK','Canada','Australia','UAE','Singapore','New Zealand','Germany','Other']
const RESIDENCY     = ['Citizen','Permanent Resident','Work Visa / H1B','Student Visa','Visit Visa']
const STARS         = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati']
const RASHIS        = ['Mesha','Vrishabha','Mithuna','Kataka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena']
const MANGLIK_OPTS  = ['Open to All','Only Mangliks','No Mangliks']
const PROFILE_BY    = ['Self','Parent / Guardian','Sibling / Friend']
const PHYSICAL_STS  = ['Normal / Able-bodied','Physically Challenged']

function getAge(dob: string | null): number | null {
  if (!dob) return null
  const d = new Date(dob + 'T00:00:00'); const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--
  return age
}
const lastSeen = (t: string | null) => {
  if (!t) return null
  const diff = (Date.now() - new Date(t).getTime()) / 60000
  if (diff < 60)   return 'Active just now'
  if (diff < 1440) return `Active ${Math.floor(diff/60)}h ago`
  if (diff < 2880) return 'Active yesterday'
  return null
}

/* ─── UI atoms ───────────────────────────────────────────────── */
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 11px', borderRadius: '99px', fontSize: '11.5px', fontWeight: 500,
      cursor: 'pointer', border: '1px solid', transition: 'all 0.12s', whiteSpace: 'nowrap',
      background: active ? '#7F1D1D' : 'white',
      color:      active ? 'white'   : '#444',
      borderColor:active ? '#7F1D1D' : '#DDDDD8',
    }}>
      {label}
    </button>
  )
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: '1px solid #F0F0F0' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 0', background: 'none', border: 'none', cursor: 'pointer',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#777' }}>{title}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="2.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div style={{ paddingBottom: '12px' }}>{children}</div>}
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const colors = ['#7F1D1D','#1D4E7F','#1D7F4E','#7F5A1D','#4E1D7F']
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors[name.charCodeAt(0) % colors.length], color: 'white', fontSize: '22px', fontWeight: 700 }}>
      {initials}
    </div>
  )
}

/* ─── Result Card ─────────────────────────────────────────────── */
function ResultCard({ p, interestStatus, onView }: { p: Profile; interestStatus?: string; onView: () => void }) {
  const age = getAge(p.date_of_birth)
  const seenLabel = lastSeen(p.last_login_at)
  const showPhoto = !!(p.photo_url && p.photo_visibility === 'public')
  const heightStr = p.height_cm ? (() => { const t = p.height_cm / 2.54; return `${Math.floor(t/12)}'${Math.round(t%12)}"` })() : null

  const tags = [p.religion, p.caste, p.mother_tongue, p.profession, p.education, p.diet].filter(Boolean)
  const locationTags = [p.native_district, p.current_city, p.current_state].filter(Boolean)

  return (
    <div style={{ display: 'flex', gap: '16px', background: 'white', borderRadius: '12px', border: '1px solid #E8E8E8', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}>

      <div onClick={onView} style={{ width: '92px', height: '92px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, cursor: 'pointer', background: '#F5F3F0' }}>
        {showPhoto
          ? <img loading="lazy" src={p.photo_url!} alt={p.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          : <Avatar name={p.full_name} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
          <button onClick={onView} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: 0 }}>{p.full_name}</p>
          </button>
          {seenLabel && (
            <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#059669', flexShrink: 0, background: '#ECFDF5', padding: '2px 8px', borderRadius: '99px' }}>{seenLabel}</span>
          )}
        </div>
        <p style={{ fontSize: '12.5px', color: '#777', margin: '0 0 8px' }}>
          {[age ? `${age} yrs` : null, heightStr, p.marital_status?.replace(/_/g,' ') ?? 'Never married'].filter(Boolean).join(' · ')}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
          {tags.map(v => (
            <span key={v} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#F5F3F0', color: '#555' }}>{v}</span>
          ))}
          {locationTags.length > 0 && (
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#FEF2F2', color: '#7F1D1D', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {locationTags[0]}
            </span>
          )}
          {p.annual_income && (
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#F0FDF4', color: '#166534' }}>{p.annual_income}</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={onView} className="btn-primary" style={{ padding: '7px 16px', fontSize: '12.5px', borderRadius: '8px' }}>View Profile</button>
          {interestStatus === 'matched' && (
            <span style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '8px', background: '#ECFDF5', color: '#059669', fontWeight: 600 }}>Matched ✓</span>
          )}
          {interestStatus === 'pending' && (
            <span style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '8px', background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>Interest Sent</span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function SearchPage() {
  const router = useRouter()
  const [myProfileId, setMyProfileId] = useState<string | null>(null)
  const [myGender,    setMyGender]    = useState<string | null>(null)
  const [profiles,    setProfiles]    = useState<Profile[]>([])
  const [loading,     setLoading]     = useState(false)
  const [searched,    setSearched]    = useState(false)
  const [interestMap, setInterestMap] = useState<Record<string,string>>({})
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // ── Filters ──────────────────────────────────────────────────
  const [ageMin,        setAgeMin]        = useState('18')
  const [ageMax,        setAgeMax]        = useState('35')
  const [heightMin,     setHeightMin]     = useState(152)
  const [heightMax,     setHeightMax]     = useState(183)
  const [marital,       setMarital]       = useState<string[]>([])
  const [religion,      setReligion]      = useState<string[]>([])
  const [tongues,       setTongues]       = useState<string[]>([])
  const [castes,        setCastes]        = useState<string[]>([])
  const [region,        setRegion]        = useState('')
  const [district,      setDistrict]      = useState('')
  const [country,       setCountry]       = useState<string[]>([])
  const [residency,     setResidency]     = useState<string[]>([])
  const [education,     setEducation]     = useState<string[]>([])
  const [profession,    setProfession]    = useState<string[]>([])
  const [incomeRange,   setIncomeRange]   = useState<string[]>([])
  const [diet,          setDiet]          = useState<string[]>([])
  const [smoking,       setSmoking]       = useState<string[]>([])
  const [drinking,      setDrinking]      = useState<string[]>([])
  const [familyType,    setFamilyType]    = useState<string[]>([])
  const [familyStatus,  setFamilyStatus]  = useState<string[]>([])
  const [familyValues,  setFamilyValues]  = useState<string[]>([])
  const [star,          setStar]          = useState<string[]>([])
  const [rashi,         setRashi]         = useState<string[]>([])
  const [manglik,       setManglik]       = useState('Open to All')
  const [profileBy,     setProfileBy]     = useState<string[]>([])
  const [physicalSts,   setPhysicalSts]   = useState<string[]>([])
  const [photoOnly,     setPhotoOnly]     = useState(false)
  const [hideViewed,    setHideViewed]    = useState(false)
  const [recentOnly,    setRecentOnly]    = useState(false)
  const [viewedIds,     setViewedIds]     = useState<Set<string>>(new Set())

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    if (!id) { router.replace('/login'); return }
    setMyProfileId(id)
    const saved = localStorage.getItem('nm_recent_searches')
    if (saved) try { setRecentSearches(JSON.parse(saved)) } catch {}

    supabase.from('profiles').select('gender').eq('id', id).maybeSingle()
      .then(({ data }) => setMyGender(data?.gender ?? null))

    supabase.from('interests').select('to_user,status').eq('from_user', id)
      .then(({ data }) => {
        const map: Record<string,string> = {}
        data?.forEach(i => { map[i.to_user] = i.status })
        setInterestMap(map)
      })

    supabase.from('profile_views').select('viewed_id').eq('viewer_id', id)
      .then(({ data }) => setViewedIds(new Set((data||[]).map(v=>v.viewed_id))))
  }, [])

  function tog<T>(arr: T[], val: T, set: (v: T[]) => void) {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  function buildLabel() {
    const parts: string[] = []
    if (religion.length)  parts.push(religion.join('/'))
    if (castes.length)    parts.push(castes.join('/'))
    if (tongues.length)   parts.push(tongues.join('+'))
    parts.push(`${ageMin}–${ageMax}yrs`)
    if (region)           parts.push(region)
    if (country.length)   parts.push(country.join('/'))
    if (incomeRange.length) parts.push(incomeRange[0])
    return parts.join(', ')
  }

  async function doSearch() {
    if (!myProfileId) return
    setLoading(true); setSearched(true)

    const label = buildLabel()
    const updated = [label, ...recentSearches.filter(s => s !== label)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('nm_recent_searches', JSON.stringify(updated))

    const opp = myGender === 'male' ? 'female' : myGender === 'female' ? 'male' : null
    let q = supabase.from('profiles').select('*').eq('status','approved')
    if (opp)      q = q.eq('gender', opp)
    if (region)   q = q.eq('native_region', region)
    if (district) q = q.eq('native_district', district)

    let { data } = await q.order('last_login_at', { ascending: false, nullsFirst: false })
    let r = (data || []).filter(p => p.id !== myProfileId)

    // Age
    const mn = parseInt(ageMin)||18; const mx = parseInt(ageMax)||60
    r = r.filter(p => { const a = getAge(p.date_of_birth); return a !== null && a >= mn && a <= mx })
    // Height
    r = r.filter(p => !p.height_cm || (p.height_cm >= heightMin && p.height_cm <= heightMax))
    // Marital
    if (marital.length) r = r.filter(p => marital.includes(MARITAL_VALS[p.marital_status?.replace(/_/g,' ')?? ''] ?? p.marital_status ?? 'never_married'))
    // Religion
    if (religion.length)  r = r.filter(p => religion.some(v => p.religion?.toLowerCase() === v.toLowerCase()))
    // Mother tongue
    if (tongues.length)   r = r.filter(p => p.mother_tongue && tongues.includes(p.mother_tongue))
    // Caste
    if (castes.length)    r = r.filter(p => castes.includes('Caste No Bar') || castes.some(c => p.caste?.toLowerCase().includes(c.toLowerCase())))
    // Country
    if (country.length)   r = r.filter(p => country.some(c => (p.native_country || 'India')?.toLowerCase().includes(c.toLowerCase())))
    // Residency
    if (residency.length) r = r.filter(p => residency.some(v => p.visa_status?.toLowerCase().includes(v.toLowerCase())))
    // Education
    if (education.length) r = r.filter(p => education.some(e => p.education?.toLowerCase().includes(e.toLowerCase())))
    // Profession
    if (profession.length) r = r.filter(p => profession.some(pr => { const kws = PROF_KW[pr]||[]; return kws.some(k => p.profession?.toLowerCase().includes(k)) }))
    // Income — rough keyword match
    if (incomeRange.length) r = r.filter(p => incomeRange.some(ir => p.annual_income?.includes(ir.split(' ')[0]) || !p.annual_income))
    // Diet
    if (diet.length)      r = r.filter(p => diet.some(d => p.diet?.toLowerCase() === d.toLowerCase()))
    // Smoking
    if (smoking.length)   r = r.filter(p => smoking.some(s => p.smoking?.toLowerCase().includes(s.toLowerCase())))
    // Drinking
    if (drinking.length)  r = r.filter(p => drinking.some(d => p.drinking?.toLowerCase().includes(d.toLowerCase())))
    // Family
    if (familyType.length)   r = r.filter(p => familyType.some(f => p.family_type?.toLowerCase() === f.toLowerCase()))
    if (familyStatus.length) r = r.filter(p => familyStatus.some(f => p.annual_income?.toLowerCase().includes(f.split(' ')[0].toLowerCase())))
    // Star / Rashi
    if (star.length)  r = r.filter(p => star.some(s => p.star?.toLowerCase().includes(s.toLowerCase())))
    if (rashi.length) r = r.filter(p => rashi.some(s => p.rashi?.toLowerCase().includes(s.toLowerCase())))
    // Manglik
    if (manglik === 'Only Mangliks') r = r.filter(p => p.manglik?.toLowerCase() === 'yes')
    if (manglik === 'No Mangliks')   r = r.filter(p => !p.manglik || p.manglik?.toLowerCase() === 'no')
    // Profile by
    if (profileBy.length) r = r.filter(p => profileBy.some(pb => p.profile_created_by?.toLowerCase().includes(pb.split('/')[0].trim().toLowerCase())))
    // Photo
    if (photoOnly)    r = r.filter(p => p.photo_url && p.photo_visibility === 'public')
    // Hide viewed
    if (hideViewed && viewedIds.size > 0) r = r.filter(p => !viewedIds.has(p.id))
    // Recent
    if (recentOnly) { const t = new Date(Date.now()-30*24*60*60*1000); r = r.filter(p => new Date(p.created_at)>=t) }

    setProfiles(r); setLoading(false)
  }

  function resetAll() {
    setAgeMin('18'); setAgeMax('35'); setHeightMin(152); setHeightMax(183)
    setMarital([]); setReligion([]); setTongues([]); setCastes([])
    setRegion(''); setDistrict(''); setCountry([]); setResidency([])
    setEducation([]); setProfession([]); setIncomeRange([])
    setDiet([]); setSmoking([]); setDrinking([])
    setFamilyType([]); setFamilyStatus([]); setFamilyValues([])
    setStar([]); setRashi([]); setManglik('Open to All')
    setProfileBy([]); setPhysicalSts([])
    setPhotoOnly(false); setHideViewed(false); setRecentOnly(false)
    setProfiles([]); setSearched(false)
  }

  const districtList = region ? REGIONS[region] || [] : []

  const activeCount = [
    marital, religion, tongues, castes, country, residency,
    education, profession, incomeRange, diet, smoking, drinking,
    familyType, familyStatus, familyValues, star, rashi, profileBy, physicalSts,
  ].reduce((acc, a) => acc + a.length, 0)
    + (region?1:0) + (district?1:0)
    + (manglik !== 'Open to All' ? 1 : 0)
    + (photoOnly?1:0) + (hideViewed?1:0) + (recentOnly?1:0)

  // ── Sidebar filter panel ──────────────────────────────────────
  const Sidebar = (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E8E8E8', overflow: 'hidden' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E8E8E8' }}>
        {['Basic Search', 'Profile ID'].map((t, i) => (
          <button key={t} style={{ flex: 1, padding: '11px 8px', fontSize: '12px', fontWeight: 600, background: i===0?'#7F1D1D':'white', color: i===0?'white':'#777', border: 'none', cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 14px', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <div style={{ borderBottom: '1px solid #F0F0F0', padding: '10px 0' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#AAA', margin: '0 0 7px' }}>Recent Searches</p>
            {recentSearches.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', color: '#7F1D1D', fontWeight: 500, flex: 1, padding: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s}
                </button>
                <button onClick={() => { const u = recentSearches.filter((_,j)=>j!==i); setRecentSearches(u); localStorage.setItem('nm_recent_searches', JSON.stringify(u)) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CCC', padding: 0, fontSize: '11px', flexShrink: 0 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Age */}
        <Section title="Age">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input type="number" min="18" max="70" value={ageMin} onChange={e=>setAgeMin(e.target.value)}
              style={{ width: '52px', border: '1.5px solid #DDDDD8', borderRadius: '6px', padding: '6px 6px', fontSize: '13px', textAlign: 'center', outline: 'none' }} />
            <span style={{ color: '#AAA', fontSize: '12px' }}>to</span>
            <input type="number" min="18" max="70" value={ageMax} onChange={e=>setAgeMax(e.target.value)}
              style={{ width: '52px', border: '1.5px solid #DDDDD8', borderRadius: '6px', padding: '6px 6px', fontSize: '13px', textAlign: 'center', outline: 'none' }} />
            <span style={{ fontSize: '12px', color: '#AAA' }}>yrs</span>
          </div>
        </Section>

        {/* Height */}
        <Section title="Height">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select value={heightMin} onChange={e=>setHeightMin(Number(e.target.value))}
              style={{ flex: 1, border: '1.5px solid #DDDDD8', borderRadius: '6px', padding: '5px 4px', fontSize: '10.5px', outline: 'none' }}>
              {HEIGHTS_CM.map(h=><option key={h} value={h}>{ftIn(h)}</option>)}
            </select>
            <span style={{ color: '#AAA', fontSize: '11px', flexShrink: 0 }}>to</span>
            <select value={heightMax} onChange={e=>setHeightMax(Number(e.target.value))}
              style={{ flex: 1, border: '1.5px solid #DDDDD8', borderRadius: '6px', padding: '5px 4px', fontSize: '10.5px', outline: 'none' }}>
              {HEIGHTS_CM.map(h=><option key={h} value={h}>{ftIn(h)}</option>)}
            </select>
          </div>
        </Section>

        {/* Marital Status */}
        <Section title="Marital Status">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {MARITAL.map(m=><Chip key={m} label={m} active={marital.includes(MARITAL_VALS[m])} onClick={()=>tog(marital,MARITAL_VALS[m],setMarital)} />)}
          </div>
        </Section>

        {/* Religion */}
        <Section title="Religion">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {RELIGIONS.map(r=><Chip key={r} label={r} active={religion.includes(r)} onClick={()=>tog(religion,r,setReligion)} />)}
          </div>
        </Section>

        {/* Mother Tongue */}
        <Section title="Mother Tongue">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {TONGUES.map(t=><Chip key={t} label={t} active={tongues.includes(t)} onClick={()=>tog(tongues,t,setTongues)} />)}
          </div>
        </Section>

        {/* Caste */}
        <Section title="Community / Caste">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {CASTES.map(c=><Chip key={c} label={c} active={castes.includes(c)} onClick={()=>tog(castes,c,setCastes)} />)}
          </div>
        </Section>

        {/* Manglik */}
        <Section title="Manglik / Chevvai Dosham">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {MANGLIK_OPTS.map(m=><Chip key={m} label={m} active={manglik===m} onClick={()=>setManglik(m)} />)}
          </div>
        </Section>

        {/* Star & Rashi */}
        <Section title="Star / Nakshatra" defaultOpen={false}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {STARS.map(s=><Chip key={s} label={s} active={star.includes(s)} onClick={()=>tog(star,s,setStar)} />)}
          </div>
        </Section>

        <Section title="Rashi / Moon Sign" defaultOpen={false}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {RASHIS.map(r=><Chip key={r} label={r} active={rashi.includes(r)} onClick={()=>tog(rashi,r,setRashi)} />)}
          </div>
        </Section>

        {/* Location */}
        <Section title="Native State / Region">
          <select value={region} onChange={e=>{ setRegion(e.target.value); setDistrict('') }}
            style={{ width: '100%', border: '1.5px solid #DDDDD8', borderRadius: '6px', padding: '7px 8px', fontSize: '12px', outline: 'none', marginBottom: '7px' }}>
            <option value="">Any State / Region</option>
            {Object.keys(REGIONS).map(r=><option key={r} value={r}>{r}</option>)}
          </select>
          {region && districtList.length > 0 && (
            <select value={district} onChange={e=>setDistrict(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #DDDDD8', borderRadius: '6px', padding: '7px 8px', fontSize: '12px', outline: 'none' }}>
              <option value="">All districts in {region}</option>
              {districtList.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </Section>

        <Section title="Country Living In">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {COUNTRIES.map(c=><Chip key={c} label={c} active={country.includes(c)} onClick={()=>tog(country,c,setCountry)} />)}
          </div>
        </Section>

        <Section title="Residency Status" defaultOpen={false}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {RESIDENCY.map(r=><Chip key={r} label={r} active={residency.includes(r)} onClick={()=>tog(residency,r,setResidency)} />)}
          </div>
        </Section>

        {/* Career */}
        <Section title="Education">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {EDUCATION_LVL.map(e=><Chip key={e} label={e} active={education.includes(e)} onClick={()=>tog(education,e,setEducation)} />)}
          </div>
        </Section>

        <Section title="Profession">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {PROFESSIONS.map(p=><Chip key={p} label={p} active={profession.includes(p)} onClick={()=>tog(profession,p,setProfession)} />)}
          </div>
        </Section>

        <Section title="Annual Income">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {INCOME_RANGES.map(i=><Chip key={i} label={i} active={incomeRange.includes(i)} onClick={()=>tog(incomeRange,i,setIncomeRange)} />)}
          </div>
        </Section>

        {/* Lifestyle */}
        <Section title="Diet">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {DIET_OPTS.map(d=><Chip key={d} label={d} active={diet.includes(d)} onClick={()=>tog(diet,d,setDiet)} />)}
          </div>
        </Section>

        <Section title="Smoking" defaultOpen={false}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {SMOKE_OPTS.map(s=><Chip key={s} label={s} active={smoking.includes(s)} onClick={()=>tog(smoking,s,setSmoking)} />)}
          </div>
        </Section>

        <Section title="Drinking" defaultOpen={false}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {DRINK_OPTS.map(d=><Chip key={d} label={d} active={drinking.includes(d)} onClick={()=>tog(drinking,d,setDrinking)} />)}
          </div>
        </Section>

        {/* Family */}
        <Section title="Family Type">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {FAMILY_TYPE.map(f=><Chip key={f} label={f} active={familyType.includes(f)} onClick={()=>tog(familyType,f,setFamilyType)} />)}
          </div>
        </Section>

        <Section title="Family Status" defaultOpen={false}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {FAMILY_STATUS.map(f=><Chip key={f} label={f} active={familyStatus.includes(f)} onClick={()=>tog(familyStatus,f,setFamilyStatus)} />)}
          </div>
        </Section>

        <Section title="Family Values" defaultOpen={false}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {FAMILY_VALUES.map(f=><Chip key={f} label={f} active={familyValues.includes(f)} onClick={()=>tog(familyValues,f,setFamilyValues)} />)}
          </div>
        </Section>

        {/* Profile settings */}
        <Section title="Profile Managed By" defaultOpen={false}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {PROFILE_BY.map(p=><Chip key={p} label={p} active={profileBy.includes(p)} onClick={()=>tog(profileBy,p,setProfileBy)} />)}
          </div>
        </Section>

        <Section title="Physical Status" defaultOpen={false}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {PHYSICAL_STS.map(p=><Chip key={p} label={p} active={physicalSts.includes(p)} onClick={()=>tog(physicalSts,p,setPhysicalSts)} />)}
          </div>
        </Section>

        {/* Do not show */}
        <Section title="Photo &amp; Visibility" defaultOpen={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {([
              [photoOnly, setPhotoOnly, 'With photo only'],
            ] as [boolean, (v:boolean)=>void, string][]).map(([v,s,l]) => (
              <label key={l} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={v} onChange={e=>s(e.target.checked)} style={{ accentColor: '#7F1D1D', width: '13px', height: '13px' }} />
                <span style={{ fontSize: '12px', color: '#555' }}>{l}</span>
              </label>
            ))}
          </div>
        </Section>

        <Section title="Do Not Show" defaultOpen={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {([
              [hideViewed, setHideViewed, 'Profiles I have already Viewed'],
              [recentOnly, setRecentOnly, 'Joined last 30 days only'],
            ] as [boolean, (v:boolean)=>void, string][]).map(([v,s,l]) => (
              <label key={l} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={v} onChange={e=>s(e.target.checked)} style={{ accentColor: '#7F1D1D', width: '13px', height: '13px' }} />
                <span style={{ fontSize: '12px', color: '#555' }}>{l}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Actions */}
        <div style={{ padding: '14px 0 16px', display: 'flex', gap: '8px' }}>
          <button onClick={doSearch} className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '13.5px' }}>
            Search{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
          <button onClick={resetAll} style={{ padding: '10px 14px', border: '1.5px solid #DDDDD8', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '12px', color: '#777', fontWeight: 600 }}>
            Reset
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0', paddingBottom: '80px' }}>
      <AppHeader />

      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '20px 16px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* Desktop sidebar */}
        <aside style={{ width: '276px', flexShrink: 0, position: 'sticky', top: '76px' }} className="hidden sm:block">
          {Sidebar}
        </aside>

        {/* Right — results */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Mobile filter panel */}
          <div className="sm:hidden mb-4">{Sidebar}</div>

          {/* Results header */}
          {searched && !loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#333', margin: 0 }}>
                {profiles.length} profile{profiles.length !== 1 ? 's' : ''} found
              </p>
              <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Sorted by recent activity</p>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E8E8E8', padding: '16px', display: 'flex', gap: '16px' }}>
                  <div style={{ width: '92px', height: '92px', borderRadius: '10px', background: '#F0EDEA', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '16px', background: '#F0EDEA', borderRadius: '6px', width: '45%', marginBottom: '8px' }} />
                    <div style={{ height: '12px', background: '#F0EDEA', borderRadius: '6px', width: '65%', marginBottom: '12px' }} />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1,2,3,4].map(j => <div key={j} style={{ height: '20px', width: '55px', background: '#F0EDEA', borderRadius: '99px' }} />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty — not searched */}
          {!loading && !searched && (
            <div style={{ textAlign: 'center', padding: '72px 20px' }}>
              <div style={{ width: '68px', height: '68px', borderRadius: '18px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#7F1D1D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111', margin: '0 0 8px' }}>Find your match</h2>
              <p style={{ fontSize: '14px', color: '#999', maxWidth: '300px', margin: '0 auto 24px', lineHeight: 1.65 }}>
                Set your preferences and click Search to see matching profiles.
              </p>
              <button onClick={doSearch} className="btn-primary" style={{ padding: '12px 28px', fontSize: '14px' }}>
                Search with default filters
              </button>
            </div>
          )}

          {/* No results */}
          {!loading && searched && profiles.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#333', margin: '0 0 8px' }}>No profiles match your filters</p>
              <p style={{ fontSize: '13.5px', color: '#999', margin: '0 0 16px' }}>Try relaxing a few filters — fewer criteria means more results.</p>
              <button onClick={resetAll} style={{ padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #DDDDD8', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#555' }}>
                Reset all filters
              </button>
            </div>
          )}

          {/* Results */}
          {!loading && profiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {profiles.map(p => (
                <ResultCard key={p.id} p={p} interestStatus={interestMap[p.id]} onView={() => router.push(`/profile/${p.id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
      <AppFooter />
      <MobileNav />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
}
