import { NextResponse } from 'next/server'
import { getSessionProfileId } from '@/lib/session'

/* Lightweight check of the current trusted session. */
export async function GET() {
  const profileId = await getSessionProfileId()
  return NextResponse.json({ profileId })
}
