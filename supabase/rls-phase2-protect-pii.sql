-- ============================================================================
-- NativeMatrimony — RLS Phase 2: hide phone/email from the public API key
-- ============================================================================
-- Run AFTER phase 1, in Supabase Studio → SQL Editor.
--
-- What it does: the browser (anon/authenticated key) can no longer read the
-- `phone`, `email`, `birth_time`, or `birth_place` columns on profiles — at the
-- database level. Contact is only reachable through the server routes
-- (/api/profiles/contact, /api/profiles/[id]), which use the service_role key
-- and enforce owner/acceptance checks.
--
-- Safe to run now because every client read of profiles uses an explicit
-- column list (no select('*') outside server routes as of commit 1178c87+).
-- ============================================================================

-- 1) Drop the blanket table grant, re-grant only safe columns.
revoke select on public.profiles from anon, authenticated;

grant select (
  id, user_id, full_name, gender, date_of_birth, profession, education,
  annual_income, about, native_district, native_state, native_region,
  native_country, current_city, current_state, height_cm, religion, caste,
  mother_tongue, family_type, verified, phone_verified, status, created_at,
  photo_url, photo_visibility, last_login_at, marital_status,
  profile_created_by, member_number, hidden_fields, premium_expires_at,
  company, diet, smoking, drinking, star, rashi, manglik, gotra,
  siblings, siblings_married, father_name, father_occupation,
  mother_name, mother_occupation, pref_age_min, pref_age_max
) on public.profiles to anon, authenticated;
-- NOTE: phone, email, birth_time, birth_place are intentionally NOT granted.

-- 2) Verify: run as anon via the REST API —
--    a) explicit safe columns still work:
--       curl '.../rest/v1/profiles?select=id,full_name&limit=1' -H "apikey: <anon>"
--    b) PII is denied:
--       curl '.../rest/v1/profiles?select=phone&limit=1' -H "apikey: <anon>"
--       → "permission denied for table profiles"
--
-- Rollback: grant select on public.profiles to anon, authenticated;
