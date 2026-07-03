import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://nativematrimony.com'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, priority: 1.0, changeFrequency: 'daily' },
    { url: `${base}/browse`, priority: 0.9, changeFrequency: 'hourly' },
    { url: `${base}/register`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${base}/login`, priority: 0.5, changeFrequency: 'monthly' },
    { url: `${base}/pricing`, priority: 0.6, changeFrequency: 'monthly' },
    { url: `${base}/privacy`, priority: 0.3, changeFrequency: 'yearly' },
    { url: `${base}/terms`, priority: 0.3, changeFrequency: 'yearly' },
  ]

  const { data } = await supabase
    .from('profiles')
    .select('id, updated_at')
    .eq('status', 'approved')

  const profileRoutes: MetadataRoute.Sitemap = (data || []).map(p => ({
    url: `${base}/profile/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    priority: 0.7,
    changeFrequency: 'weekly' as const,
  }))

  return [...staticRoutes, ...profileRoutes]
}
