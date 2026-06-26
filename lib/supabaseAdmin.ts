import { createClient } from '@supabase/supabase-js'

/* Server-only Supabase client using the SECRET service_role key.
   - NEVER import this from a Client Component or anything that ships to the browser.
     The runtime guard below throws if this module is ever evaluated in a browser.
   - This client bypasses RLS, so it must only be reachable through trusted
     API routes / server actions that do their own authorization checks.
   - Required env: SUPABASE_SERVICE_ROLE_KEY (Supabase dashboard → Settings → API).
     Keep it in .env.local only — it is gitignored and must never be committed
     or exposed with a NEXT_PUBLIC_ prefix. */

if (typeof window !== 'undefined') {
  throw new Error('supabaseAdmin must never be imported in the browser')
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceKey) {
  // Surfaced at request time on the server, not at module eval, so the app
  // still boots; routes that use it will return a clear 500 until the key is set.
  console.warn('[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY is not set — secured API routes will fail until it is added to .env.local')
}

export const supabaseAdmin = createClient(
  url || 'https://placeholder.supabase.co',
  serviceKey || 'placeholder',
  { auth: { autoRefreshToken: false, persistSession: false } },
)

export function assertAdminConfigured() {
  if (!serviceKey) {
    throw new Error('Server not configured: SUPABASE_SERVICE_ROLE_KEY missing')
  }
}
