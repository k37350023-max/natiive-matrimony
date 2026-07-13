/* Single source of truth for India states → districts, shared by the register
   form, the programmatic-SEO native-place landing pages, and the sitemap.
   Districts double as "native places" — the core axis the whole product is
   organised around. */

export const INDIA_STATES: Record<string, string[]> = {
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

// States whose districts are NOT meaningful "native place" SEO pages.
const EXCLUDED_STATES = new Set(['Other / Abroad'])

export type NativePlace = { name: string; state: string; slug: string }

/** URL-safe slug: "East Godavari" → "east-godavari", "J&K" districts keep it simple. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\([^)]*\)/g, '')   // drop parentheticals like "(Shillong)"
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

let _all: NativePlace[] | null = null

/** Every district as a native place (excludes the Other/Abroad bucket). */
export function allNativePlaces(): NativePlace[] {
  if (_all) return _all
  const seen = new Set<string>()
  const out: NativePlace[] = []
  for (const [state, districts] of Object.entries(INDIA_STATES)) {
    if (EXCLUDED_STATES.has(state)) continue
    for (const name of districts) {
      const slug = slugify(name)
      if (!slug || seen.has(slug)) continue
      seen.add(slug)
      out.push({ name, state, slug })
    }
  }
  _all = out
  return out
}

/** Resolve a slug back to its native place, or null. */
export function findPlaceBySlug(slug: string): NativePlace | null {
  const s = slug.toLowerCase()
  return allNativePlaces().find(p => p.slug === s) ?? null
}
