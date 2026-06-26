# NativeMatrimony — Development Instructions

You are the sole developer of NativeMatrimony, an Indian matrimony web app. The basic version is already built. Every time you receive input (even just "continue" or "go"), inspect the current codebase, compare it against the spec below, identify what's missing or incomplete, and upgrade the next chunk to production quality. Commit after each chunk.

## THE PRODUCT

NativeMatrimony — find matches close to your native place. Simple as that. An Indian matrimony platform where native place (state + district) is the primary way people discover each other. Clean, modern, works well.

## CORE PRINCIPLES (Never violate these)

1. **Native place first** — district-level matching across India. People find matches from their native place.
2. **Simple & clean** — don't over-engineer. Keep it easy to use.
3. **Mobile-first responsive** — works on phone and desktop
4. **Launch offer** — First 1,000 profiles get free premium for 1 year

## HOW TO WORK EVERY SESSION

1. Read the existing codebase — check what pages, components, features exist
2. Compare against the UPGRADE CHECKLIST below
3. Find the first item that's missing or incomplete
4. Upgrade it to the full spec described (not stubs — complete, polished, functional)
5. Ensure the app compiles and runs without errors
6. Git commit with clear message
7. If time/context allows, move to the next item. Otherwise stop.

**If a page exists but is basic/minimal** — upgrade it to match the full spec below.  
**If a page is missing** — create it.  
**If something is buggy** — fix it before building new things.

## UPGRADE CHECKLIST

Work through this top-to-bottom. Each item describes what the FINAL version should look like. Compare to what currently exists and fill the gaps.

### ✅ CHECK 1: Landing Page
Should have: hero with tagline, animated live counters (profiles registered, interests today, matches this week), "How it works" 4-step section, trust badges row (Verified · Native Place Matching · All India), browse-by-state/district interactive grid with profile counts, success stories carousel (3-4 couples), FAQ accordion (6 questions), full footer (About · Privacy · Terms · Pricing · Social links). Launch offer banner: "First 1,000 profiles get 1 year free premium".

### ✅ CHECK 2: Registration (5 steps)
Should have 5 steps: (1) Basic Info: gender, DOB, name, mobile, email, password. (2) Native Place: state, district, current city/state (support ALL Indian states and districts). (3) Personal: height, marital status, diet, religion, caste, mother tongue, gotram. (4) Education & Career: qualification + area, profession, company, annual income range, visa/residency status. (5) Partner Preferences: age range slider, height range, state/district pref (multi-select), education min, profession pref, location pref, caste pref. Photo upload section at end (up to 5, drag-drop). Steps 3-5 have "Skip for now". Biodata auto-fill upload at top of form.

### ✅ CHECK 3: Browse Profiles Page
Cards should show: photo (or initials), verified badge, name, age · height, profession, native district · current city, compatibility score ("Matches X/Y prefs"), "Active X ago" with green dot, "Profile by: Self/Parent". Filter sidebar: state, district, age, height, income, education level, education area, profession, visa status, diet, caste, active within (24h/7d/30d), joined within (7d/30d/90d), photo only toggle, verified only toggle. Sort dropdown: Best match · Newest · Last active. Quick filter chips above results. Pagination with "Showing 1-20 of X". "Save this search" button.

### ✅ CHECK 4: Full Profile View Page
Clicking a profile card opens a full page with: header (large photo, name, age, district badge, verified badges, "Active X ago"), compatibility bar ("You match X/Y of their preferences" with visual), action buttons (Send Interest · Shortlist · Report/Block). Sections: About (bio text + who posted), Personal Details table, Education & Career table, Family Details table, Astrology section (collapsible), Hobbies (tags/chips), Partner Preferences (their prefs listed with green ✓ / grey ✗ showing which of YOUR attributes match). Contact section shows phone/email for premium users or after mutual match. "Similar Profiles" row (3-4 cards from same district/profession).

### ✅ CHECK 5: Interests System
Three tabs with badge counts: Received (profile card + compatibility + Accept ✓ / Decline ✗ buttons + "View Profile"), Sent (profile card + status badge: Awaiting · Viewed · Accepted · Declined + Withdraw option), Mutual Matches (contact info visible — phone, email, WhatsApp button, "Start Chat" button, "Download Biodata" option).

### ✅ CHECK 6: Chat
Left panel: conversation list with photo, name, last message preview, time, unread badge, online dot. Right panel: message bubbles with timestamps, text input, emoji picker. Icebreaker suggestions for first message. Only accessible for mutual matches — others see "Express interest to unlock chat".

### ✅ CHECK 7: Dashboard / My Profile
Profile completeness ring (percentage + "Add [specific field] to reach 100%"). Activity summary cards: profile views this week, interests received, mutual matches count, shortlisted by count. "Who Viewed Me" list. "My Shortlist" section. Profile sections with inline edit (click to edit any field). "Download My Biodata" button. Settings link (notifications, privacy, account).

### ✅ CHECK 8: Notifications Page
Central feed (reverse chronological): "[Name] sent you an interest" · "[Name] accepted" · "[Name] viewed your profile" · "[Name] shortlisted you" · system messages. Filter tabs: All · Interests · Views · Matches. Mark all read. Individual dismiss. Unread count in nav bell icon.

### ✅ CHECK 9: Pricing Page
Launch offer banner: "First 1,000 profiles get 1 year free premium". 3 tiers in comparison cards: Free (5 interests/month, browse, no contact view) · Premium ₹999/mo or $15/mo (unlimited interests, contact view, who viewed me, chat, priority in search) · Premium Plus ₹1999/mo or $25/mo (everything + featured profile boost, video call, relationship advisor). "First 1,000 members get Premium FREE for 1 year" banner. FAQ below.

### ✅ CHECK 10: Global Polish
Nav bar: Browse · Interests · Chat · Bell (notification count) · Profile avatar dropdown (My Profile · Settings · Help · Logout). Verification badges everywhere (✓ selfie verified, phone verified). Green online dot + "Active X ago" on all cards. "Profile managed by" indicator. Report & Block accessible on every profile. Mobile: responsive layouts, bottom tab nav on small screens, touch targets ≥44px. Footer on all pages. Consistent color scheme and typography. Loading states and empty states for all sections.

## REFERENCE: Standard matrimony features we should have

- Filters (age, height, profession, education, location, caste, diet)
- Activity indicators (online now, last active)
- Verified badges
- Interest → Accept → Chat/Call flow
- Profile depth (family, education, hobbies, photos, bio)

## WHERE WE DIFFERENTIATE

- Native place (state + district) is the PRIMARY way to browse and match
- Clean modern UI
- Biodata auto-fill from PDF upload
- Launch offer: first 1,000 profiles get 1 year free premium

## ORIGINALITY

- Design must be original — no copying from any competitor
- Our visual identity: maroon/burgundy + gold
- No competitor brand names in UI, code, or comments

## DESIGN & BRAND GUIDELINES

### Colors
- Primary: deep maroon/burgundy (#8B1A1A or similar — matches current NativeMatrimony header)
- Accent: warm gold (#D4A853) for CTAs, badges, highlights
- Background: white (#FFFFFF) with light grey (#F8F9FA) section alternation
- Text: dark charcoal (#1A1A1A) for headings, medium grey (#6B7280) for secondary text
- Success/online: green (#10B981)
- Cards: white with subtle shadow, rounded corners (12-16px radius)

### Typography
- Headings: Inter or similar clean sans-serif, bold
- Body: Inter/system font, 14-16px
- Keep generous whitespace — don't cram content like Shaadi does

### Card Design (Critical — this is what users see most)
Current NativeMatrimony cards are good (large photo, clean layout) but need MORE info density without losing elegance:
- Large photo area (keep current style — full bleed, dark gradient overlay at bottom for text)
- Name + age + height overlaid on photo bottom (white text on gradient)
- Below photo: profession (bold), native district · current city, "Active X ago" in green
- Compatibility score badge: "8/9 match" in top-right corner (gold badge)
- Verified badge: keep current style (teal pill with ✓)
- "Profile by: Self/Parent" small tag
- Action: "Send Interest" button + heart/shortlist icon
- Cards should be in a GRID (2-3 per row on desktop, 1 on mobile) — keep current layout

### Layout Philosophy
- NativeMatrimony should feel like a modern social/dating app (clean, photo-forward) but with the DATA DEPTH expected in Indian matrimony
- Left sidebar for filters (keep current map + filters approach — it's great and unique to us)
- Main content area for cards/profiles
- Chat is its own dedicated page — no persistent sidebar
- Make it feel ALIVE: show "X profiles online now" counter, "X interests sent today"

### Profile Card Sizes
- Browse page: medium cards (current size is good)
- Interests page: smaller/compact cards with action buttons
- Mutual matches: compact list view with contact info visible

### What to KEEP from current NativeMatrimony design:
- The India map region filter (it's unique and good)
- Large photo cards with gradient text overlay
- Clean nav bar with maroon/burgundy header text
- The "✓ Verified" teal badge style
- Region filter chips (Telangana, Coastal Andhra, Rayalaseema) — but expand to all India states
- The overall clean white+maroon aesthetic

### What to ADD (industry-standard matrimony features currently missing):
- Activity numbers/stats visible on dashboard (accepted count, contacts viewed count)
- Notification feed or dedicated page with unread counts
- "Your Activity Summary" section on dashboard
- Engagement CTAs: "View Today's Matches", "Complete your profile"
- Profile completeness prompt with visual progress indicator
- "Online now" indicators on profiles
- Last seen timestamps on cards
- Total match count in nav

## DATABASE SCHEMA (Use these table structures)

```sql
-- Core tables needed:
profiles (
  id, user_id, gender, full_name, dob, height_cm, marital_status,
  religion, caste, mother_tongue, gotram, diet,
  native_state, native_district, current_city, current_state, current_country,
  education_level, education_area, profession, company, annual_income_range,
  visa_status, about_me, profile_managed_by,
  father_occupation, mother_occupation, siblings_brothers, siblings_sisters,
  family_type, family_location, family_financial_status,
  star_nakshatra, rashi, manglik,
  hobbies, photos (array/jsonb),
  is_verified, is_phone_verified, is_selfie_verified,
  last_active_at, created_at, profile_completeness_pct
)

partner_preferences (
  id, profile_id,
  age_min, age_max, height_min_cm, height_max_cm,
  preferred_states (array), preferred_districts (array),
  preferred_education_min, preferred_professions (array),
  preferred_castes (array), preferred_locations (array),
  preferred_diet, preferred_marital_status
)

interests (
  id, from_profile_id, to_profile_id,
  status (pending/viewed/accepted/declined/withdrawn),
  sent_at, responded_at
)

messages (
  id, conversation_id, sender_profile_id, content, sent_at, read_at
)

conversations (
  id, profile_1_id, profile_2_id, last_message_at, created_at
)

notifications (
  id, profile_id, type (interest_received/accepted/profile_viewed/shortlisted),
  from_profile_id, message, is_read, created_at
)

profile_views (
  id, viewer_profile_id, viewed_profile_id, viewed_at
)

shortlists (
  id, profile_id, shortlisted_profile_id, created_at
)
```

## INDIA STATES & DISTRICTS DATA

Include a complete dataset of all Indian states/UTs with their districts:
- 28 states + 8 union territories
- 700+ districts total
- Source this from a reliable JSON dataset (search npm for "india-states-districts" or similar)
- Allow filtering by state → shows districts for that state
- The current "Telangana / Coastal Andhra / Rayalaseema" region filter should be EXPANDED to show all states as clickable chips/buttons

## SEED DATA REQUIREMENTS

Populate with 30-50 realistic profiles:
- Mix of states: Telangana (10), Andhra Pradesh (8), Karnataka (5), Tamil Nadu (5), Maharashtra (5), Delhi (3), Gujarat (3), others (5-10)
- Mix of genders (roughly 50/50)
- Realistic professions: Software Engineer, Doctor, CA, Business Analyst, Teacher, Civil Engineer, MBA/Manager, Lawyer, Government Officer
- Age range: 23-35
- Various education levels: B.Tech, M.Tech, MBBS, MBA, B.Com, LLB, M.Sc
- Some verified, some not
- Various "last active" times (now, 1h, 5h, 1d, 3d, 1w)
- Some with photos (use placeholder avatar URLs), some without
- Realistic "about me" bios (2-3 sentences each)

This ensures the app feels ALIVE on first load — not empty like a new startup.

## TECH NOTES

- Keep whatever stack is currently in use (check package.json)
- Use realistic seed/mock data: Indian names from various states, real districts across India, real professions
- Every page should feel alive with data — no empty states on first load (use seed data)
- Ensure `npm run dev` / `npm run build` works after every change
- If using mock/static data initially, structure it so it's easy to swap with real Supabase queries later
