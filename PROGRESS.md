# NativeMatrimony — Autonomous Hardening Log

Working without further input. I make sensible defaults, fix what I can, and
flag anything that needs you under **⚠️ NEEDS YOU** below.

---

## ⚠️ NEEDS YOU (do these when you're back — everything else is handled)
- [ ] **Set env vars in your HOST dashboard (Vercel/Netlify)** — `.env.local` is gitignored (correct),
      so the live site needs these set or login/connect/chat will break in prod:
      `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
      `SESSION_SECRET`, `OTP_SECRET` (optional now), `FAST2SMS_API_KEY` (for real SMS).
- [ ] **Before inviting REAL users:** finish the RLS migration (DB is still open until then —
      fine for the current seed/test data, NOT for real people's data).
- [ ] **Rotate the `service_role` key** (it was pasted in chat → treat as compromised). Supabase → Settings → API → roll `service_role`, then paste the new value into `.env.local` `SUPABASE_SERVICE_ROLE_KEY=`.
- [ ] **Add an SMS provider key** when ready for real OTP. I'll wire the code and gate it behind `OTP_DEV_MODE`; you just add the provider key + flip the flag. (placeholder env documented when built)
- [ ] **Payment provider** (if charging at launch) — premium is currently auto-granted.
- [ ] Replace Unsplash/randomuser **seed photos** with real/licensed images before public launch (deceptive + licensing risk).

---

## Real-user issue inventory (no code knowledge lens)
Ranked by what a normal visitor/member would actually hit.

### Fix without input (doing these)
1. **Junk/test data visible** — "Test Groom Reddy" profile, leftover "Connected"/match
   rows on seed profiles, a test chat message. A real user sees fake/broken states. → clean it.
2. **"Connected" on profiles you never matched** — leftover from the old auto-match bug. → cleaned with #1.
3. **Repeated network calls** — header/banner fire the same count queries many times per page
   (perf + Supabase load). → dedupe.
4. **Security: data open to anyone** (the real #1, invisible to users but critical) —
   migrate all DB access server-side behind a trusted httpOnly session, then enable RLS.
5. **Verified badge is meaningless** (random seed) — make it reflect a real flag; honest copy.
6. Any functional/UX bug found while testing as a user.

---

## Done (verified)
- **Test/junk data cleaned** — removed "Test Groom Reddy" + 4 matches, 5 messages,
  8 interests, 2 profile_views (dry-run-checked first). No more stray "Connected".
- **Real OTP wired into signup** — register now calls `/api/send-otp` + `/api/verify-otp`
  (these already existed with Fast2SMS + dev fallback). Removed the dummy `123456`.
  Verified end-to-end: server generated a real code, server-verified it, advanced to step 3.
  Dev mode shows the code on-screen; production sends SMS once `FAST2SMS_API_KEY` is set.
- **Session groundwork** — generated `SESSION_SECRET` (48 random bytes) + `OTP_DEV_MODE`
  in `.env.local` for the upcoming trusted httpOnly cookie.

## Decisions / assumptions
- OTP provider is **Fast2SMS** (already coded). Until `FAST2SMS_API_KEY` is added, dev mode
  returns the code in the API response so signup is testable. No behaviour change needed from you.
- Kept localStorage auth working in parallel; it will be replaced by the signed cookie during
  the security migration (no breakage between steps).

## Trusted session — BUILT & VERIFIED ✅
- `lib/session.ts` — HMAC-signed httpOnly cookie (`nm_session`) carrying the verified
  profile_id; `getSessionProfileId()` for routes, `setSession()`/`clearSession()`.
- `/api/auth/login` — verifies email/password server-side → sets cookie.
- `/api/auth/register` — re-verifies OTP server-side → creates user+profile (admin) → sets cookie.
- `/api/auth/logout`, `/api/auth/me`.
- Login + register pages wired to these (localStorage kept in parallel until migration ends).
- Verified end-to-end: registered a QA user → `/api/auth/me` returned the same id from the
  httpOnly cookie (not JS-readable = correct); bad creds → 401; no cookie → null. QA profile cleaned up.

## Secured writes (cookie-authorized) — BUILT & VERIFIED ✅
- `/api/interests/send` (sender = session, idempotent, notifies recipient) + browse wired.
- `/api/shortlists/toggle` (owner = session, optimistic UI w/ revert) + browse wired.
- Verified: both return **401 with no session**; with a real session they created exactly
  1 interest + 1 shortlist row (then cleaned up). Clients can no longer forge writes as others.

## More secured routes — BUILT & VERIFIED ✅
- `/api/profiles/[id]` GET — **redacts phone/email to non-owners** (closes the 2nd big PII leak);
  profile page wired. Verified: non-owner → phone/email null, rest intact; owner → own phone shown.
- `/api/interests/respond` — only the recipient (session) can accept/decline; creates match server-side.
  Wired interests page. Verified: bad/foreign interest → 404/403.
- `/api/chat/send` — sender = session, must be a participant in the match. Wired chat. Verified: bad match → 404.
- Extra warm-color leftovers (#FFFBF5 etc.) converted to the cool palette (18 files).

## Secured profile edit — BUILT & VERIFIED ✅
- `/api/profiles/update` — updates ONLY the session owner's profile, with a server-side field
  allowlist. Verified: 401 w/o session; owner edit applies; tampering with verified/status/
  premium is ignored. Edit page wired.

## One-click TEST sign-in + 2 real test accounts — BUILT & VERIFIED ✅
- `/api/auth/dev-login` (role: groom|bride) — creates/uses 2 real, presentable test accounts
  (`test-groom@native.test`, `test-bride@native.test`) and sets the session. **Auto-disabled in
  production** (NODE_ENV check; override with DEV_LOGIN_ENABLED=true). Buttons on /login (dev-only).
- Why: seed profiles are one-sided (user_id null, no login) so they can never *accept* → that's why
  "Connect" looked like it did nothing. The two real test accounts can connect↔accept↔chat.
- Verified end-to-end through the real secured routes: Groom connect → Bride accept (match) →
  Groom chat message delivered. (Test accounts kept; the interaction rows were cleaned.)
- Also fixed login/register headers to the lowercase `nativematrimony.` wordmark.

## FIX-ALL audit + RLS finish plan (in progress)
Audit: build green; lint 120 (mostly noise: set-state-in-effect, no-img-element). Real backend
risk = direct client DB access still bypassing the secured API → blocks RLS.

Remaining client WRITES to migrate to cookie-authorized /api (then enable RLS):
- [x] notifications: markAllRead / markRead / dismiss → `/api/notifications` (NotificationBell + notifications page)
- [ ] profile_views insert + view notification (profile/[id]:255,268) → `/api/profiles/view`
- [ ] field_requests update + notifications (profile/[id]:371,381,393,402) → `/api/field-requests/respond`
- [ ] reports insert (profile/[id]:1282) → `/api/reports`
- [ ] matches accept (matches/page:67) → reuse `/api/interests/respond`
- [ ] chat messages mark-read (chat/[id]:140) → `/api/chat/read`
- [ ] profiles.update last_login_at (browse:677, profile/[id]:722) → drop or `/api/profiles/touch`
- [ ] profile/edit phone_verified update (367/1067) + profile_photos insert/delete (330/340) → `/api/profiles/photo` + verify
- [ ] interests withdraw delete (interests:306) → reuse `/api/matches/unmatch`
- [ ] admin writes (internal-only) → lower priority
Then: enable RLS (deny anon) on all tables + remove anon fallbacks + full verify.
P1 frontend: native-place input value loss on state-select; stale header stat counters.
P2: eslint --fix; <img>→next/image on hot paths.

## Native-place spec pass 1 (deep-green theme + contact/chat) — DONE ✅
- **Retheme to deep-green / navy / cream** (mockup): tokens in globals.css, app-wide hex remap
  (40 files), green CTAs with white text, cream canvas, wordmark "matrimony" now green.
- **Matched → Go to Chat** now a real link (modal + card use matchIdMap → /chat/[id]).
- **Fixed:** pending requests no longer mislabeled "Go to Chat" (a request opens a match row,
  but status is 'matched' only when the interest is accepted).
- **Contact button** added left of Connect on cards: auto-sends the request and opens a popup
  with **WhatsApp + View number** — revealed only after acceptance (respects "contact shared
  only after acceptance"); shows "unlocks once they accept" while pending. New `/api/profiles/contact`.
  Verified: locked before accept, unlocked w/ number after.

## Native-place spec — STILL TO DO (next, from the uploaded mockup/spec)
- Homepage = native-place **search-first** hero (popular places chips, "Find someone who shares your roots")
- Search results: field-limited **blurred public cards** + **"No profiles from X yet → Notify Me"** waitlist
  (new `native_place_waitlist` table)
- Signup **Step 1 "Profile For"** (Myself/Son/Daughter/…) + map existing fields to native_place schema
- **Biodata PDF** download on accepted profile
- Tables from spec: `native_place_waitlist`, align `profiles` columns (native_place etc.)

## Emoji → professional SVG icons — DONE ✅
- Replaced all emoji (✅🎉🔔📍💼👨‍👩‍👧✨⚡💬👤💌👁🔒 + dashboard/notification icons) with clean
  line/solid SVG icons across LaunchBanner, NotificationBell, notifications, interests, browse
  QuickView, dashboard, chat, biodata, profile/edit, landing. Verified: build green, 0 emoji left,
  QuickView + banners render with crisp icons.

## Interest → chat "request" model — BUILT & VERIFIED ✅
- Connect now opens a thread with the **initial message delivered**, but the thread is
  **locked** (409 on further sends) until the recipient accepts. Recipient sees Accept/Decline
  in the chat; sender sees "Request sent — waiting" + **Withdraw**. **Unmatch** in header.
- Decline removes the thread for both. New routes: chat/state, matches/unmatch; send creates
  thread+message; chat/send blocks while pending; respond cleans up on decline.
- Verified 10/10 via the real routes (lock 409, state flags, accept→unlock, unmatch & decline
  remove thread, initial message created) + UI screenshot of the locked sender view.

## Secured surface so far (cookie-authorized, anon can't forge)
browse read (PII-stripped) · profile read (phone/email redacted) · interest send · interest
respond · shortlist toggle · chat send · profile edit. All verified.

## Status
- done: cleanup; real OTP; trusted session; secured interest send/respond, shortlist, chat send,
  profile read redaction, **profile edit (owner-only + allowlist)**
- verifying: —
- next: 1. move remaining READS server-side so RLS won't break them (edit-page own-profile load,
  dashboard, search, interests/matches lists, chat thread load, notifications) 2. chat "mark read"
  + edit-page phone_verified writes 3. remove anon fallbacks 4. ENABLE RLS (deny anon) on all
  tables 5. final full-app verification with RLS on.
- NOTE: RLS can only flip ON after ALL reads+writes are server-side; until then the app still
  uses the anon key for the not-yet-migrated reads (works fine, just not yet locked).
