-- ============================================================================
-- NativeMatrimony — RLS Phase 1: deny all anonymous WRITES (safe, no app breakage)
-- ============================================================================
-- Run this in Supabase Studio → SQL Editor.
--
-- Why this is safe to run now:
--   * Every write in the app now goes through server /api routes using the
--     service_role key, which BYPASSES RLS entirely. So server writes keep working.
--   * The browser only ever READS via the anon key. We keep SELECT open, so the
--     app does not break.
--   * With RLS enabled and NO insert/update/delete policy, the anon (and logged-in
--     anon) role can no longer INSERT / UPDATE / DELETE anything. This closes the
--     biggest hole: today anyone with the public anon key can forge/modify/delete
--     any row. After this, they cannot.
--
-- What this does NOT do yet (Phase 2, needs read migration first):
--   * It still allows anon to SELECT rows, including phone/email on `profiles`.
--     Contact PII is already gated in the app's server read routes, but a raw
--     anon query could still read it. Phase 2 locks reads down once all client
--     reads are server-side (or via column revokes / a public view).
-- ============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','interests','matches','messages','notifications',
    'profile_views','profile_photos','shortlists','field_requests',
    'reports','ai_picks'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    -- Allow reads (keeps the current app working). Drop/replace if it exists.
    execute format('drop policy if exists nm_anon_select on public.%I;', t);
    execute format('create policy nm_anon_select on public.%I for select using (true);', t);
    -- NOTE: intentionally NO insert/update/delete policy → those are denied for
    -- anon/authenticated. service_role bypasses RLS, so server routes still write.
  end loop;
end $$;

-- Verify: this should show rowsecurity = true for every table above.
--   select relname, relrowsecurity from pg_class
--   where relname in ('profiles','interests','matches','messages','notifications',
--     'profile_views','profile_photos','shortlists','field_requests','reports','ai_picks');
--
-- Rollback (if ever needed):
--   do $$ declare t text; begin foreach t in array array['profiles','interests',
--   'matches','messages','notifications','profile_views','profile_photos','shortlists',
--   'field_requests','reports','ai_picks'] loop
--   execute format('alter table public.%I disable row level security;', t); end loop; end $$;
