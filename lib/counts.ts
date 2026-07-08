'use client'
import { supabase } from '@/lib/supabase'

/* Shared, deduped count queries. Several components (banner, founder tracker,
   header, mobile nav) used to fire identical HEAD count queries on every page
   load — multiplied by React re-mounts. This module gives them one in-flight
   promise + a short TTL cache, so each count hits Supabase at most once per
   TTL regardless of how many components ask. */

const TTL_MS = 60_000
const cache = new Map<string, { at: number; promise: Promise<number> }>()

function cached(key: string, fetcher: () => Promise<number>): Promise<number> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise
  const promise = fetcher().catch(() => 0)
  cache.set(key, { at: Date.now(), promise })
  return promise
}

/** Total approved profiles (founder tracker, launch banner, live counters). */
export function getApprovedProfileCount(): Promise<number> {
  return cached('profiles-approved', async () => {
    const { count } = await supabase.from('profiles')
      .select('id', { count: 'exact', head: true }).eq('status', 'approved')
    return count ?? 0
  })
}

/** Pending interests + unread messages for the signed-in profile
    (shared by AppHeader and MobileNav so it's queried once, not twice). */
export function getMyBadgeCounts(profileId: string): Promise<{ pendingInterests: number; unreadMessages: number }> {
  const key = `badges-${profileId}`
  const hit = badgeCache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise
  const promise = (async () => {
    const { count: pendingInterests } = await supabase.from('interests')
      .select('id', { count: 'exact', head: true })
      .eq('to_user', profileId).eq('status', 'pending')
    const { data: matchRows } = await supabase.from('matches')
      .select('id').or(`user1.eq.${profileId},user2.eq.${profileId}`)
    let unreadMessages = 0
    if (matchRows?.length) {
      const { count } = await supabase.from('messages')
        .select('id', { count: 'exact', head: true })
        .in('match_id', matchRows.map(m => m.id))
        .neq('from_profile_id', profileId).eq('read', false)
      unreadMessages = count || 0
    }
    return { pendingInterests: pendingInterests || 0, unreadMessages }
  })().catch(() => ({ pendingInterests: 0, unreadMessages: 0 }))
  badgeCache.set(key, { at: Date.now(), promise })
  return promise
}
const badgeCache = new Map<string, { at: number; promise: Promise<{ pendingInterests: number; unreadMessages: number }> }>()
