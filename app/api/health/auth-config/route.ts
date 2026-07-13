import { NextResponse } from 'next/server'
import { firebaseAdminConfigured } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    sessionSecret: Boolean(process.env.SESSION_SECRET),
    firebaseClient: Boolean(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
        process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    ),
    firebaseAdmin: firebaseAdminConfigured(),
    firebaseAdminJson: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
    firebaseAdminBase64: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64),
  })
}
