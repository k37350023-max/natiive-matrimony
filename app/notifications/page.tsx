'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import AppHeader from '../components/AppHeader'
import MobileNav from '../components/MobileNav'
import AppFooter from '../components/AppFooter'

type Notif = {
  id: string
  type: string
  message: string
  read: boolean
  created_at: string
  from_profile_id: string | null
  link: string | null
}

type FromProfile = {
  id: string
  full_name: string
  photo_url: string | null
  photo_visibility: string | null
  profession: string | null
  native_district: string | null
}

const TAB_FILTERS: Record<string, string[]> = {
  All:       [],
  Interests: ['interest_received','interest_accepted','interest_declined','interest_withdrawn'],
  Views:     ['profile_view'],
  Matches:   ['interest_accepted'],
  System:    ['system','field_request','field_request_approved'],
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1)    return 'Just now'
  if (m < 60)   return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  if (m < 2880) return 'Yesterday'
  if (m < 10080)return `${Math.floor(m / 1440)}d ago`
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function typeLabel(type: string) {
  if (type === 'interest_received')        return { label: 'Interest Received', color: '#7F1D1D', bg: '#FEF2F2' }
  if (type === 'interest_accepted')        return { label: 'Match!', color: '#065F46', bg: '#ECFDF5' }
  if (type === 'interest_declined')        return { label: 'Declined', color: '#6B7280', bg: '#F3F4F6' }
  if (type === 'interest_withdrawn')       return { label: 'Withdrawn', color: '#6B7280', bg: '#F3F4F6' }
  if (type === 'profile_view')             return { label: 'Profile View', color: '#1E40AF', bg: '#EFF6FF' }
  if (type === 'field_request')            return { label: 'Contact Request', color: '#7C3AED', bg: '#F5F3FF' }
  if (type === 'field_request_approved')   return { label: 'Contact Shared', color: '#065F46', bg: '#ECFDF5' }
  return { label: 'Notification', color: '#6B7280', bg: '#F3F4F6' }
}

function notifIcon(type: string) {
  if (type === 'interest_received')        return '💌'
  if (type === 'interest_accepted')        return '🎉'
  if (type === 'interest_declined')        return '✕'
  if (type === 'interest_withdrawn')       return '↩'
  if (type === 'profile_view')             return '👁'
  if (type === 'field_request')            return '🔓'
  if (type === 'field_request_approved')   return '✅'
  return '🔔'
}

function notifAction(type: string, fromProfileId: string | null): { label: string; href: string } | null {
  if (type === 'interest_received')  return { label: 'Review interest →', href: '/interests?tab=received' }
  if (type === 'interest_accepted')  return { label: 'Open chat →', href: '/matches' }
  if (type === 'profile_view' && fromProfileId) return { label: 'View their profile →', href: `/profile/${fromProfileId}` }
  if (type === 'field_request' && fromProfileId) return { label: 'View profile →', href: `/profile/${fromProfileId}` }
  if (type === 'field_request_approved') return { label: 'Go to matches →', href: '/interests?tab=matched' }
  return null
}

function Avatar({ profile, size = 44 }: { profile: FromProfile | null; size?: number }) {
  const showPhoto = !!(profile?.photo_url && profile.photo_visibility === 'public')
  const colors = ['#7F1D1D','#1D4E7F','#1D7F4E','#7F5A1D']
  const bg = colors[(profile?.full_name?.charCodeAt(0) || 0) % colors.length]
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {showPhoto
        ? <img src={profile!.photo_url!} alt={profile!.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.35, fontWeight: 700, color: 'white' }}>{initials}</span>}
    </div>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const [userId,    setUserId]    = useState<string | null>(null)
  const [notifs,    setNotifs]    = useState<Notif[]>([])
  const [profiles,  setProfiles]  = useState<Record<string, FromProfile>>({})
  const [tab,       setTab]       = useState('All')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const uid = localStorage.getItem('my_user_id')
    if (!uid) { router.replace('/login'); return }
    setUserId(uid)
    load(uid)

    const ch = supabase.channel('notif_page_' + uid)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        ({ new: n }) => setNotifs(prev => [n as Notif, ...prev]))
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  async function load(uid: string) {
    setLoading(true)
    const { data } = await supabase.from('notifications')
      .select('*').eq('user_id', uid)
      .order('created_at', { ascending: false }).limit(100)

    const notifList = data || []
    setNotifs(notifList)

    // Load from-profiles for avatar display
    const profileIds = [...new Set(notifList.map(n => n.from_profile_id).filter(Boolean))] as string[]
    if (profileIds.length > 0) {
      const { data: pData } = await supabase.from('profiles')
        .select('id, full_name, photo_url, photo_visibility, profession, native_district')
        .in('id', profileIds)
      const map: Record<string, FromProfile> = {}
      pData?.forEach(p => { map[p.id] = p })
      setProfiles(map)
    }
    setLoading(false)

    // Mark all as read
    await supabase.from('notifications').update({ read: true }).eq('user_id', uid).eq('read', false)
  }

  async function markAllRead() {
    if (!userId) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId)
    setNotifs(p => p.map(n => ({ ...n, read: true })))
  }

  async function dismissNotif(id: string) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifs(p => p.filter(n => n.id !== id))
  }

  const tabs = Object.keys(TAB_FILTERS)
  const unread = notifs.filter(n => !n.read).length

  const filtered = tab === 'All'
    ? notifs
    : notifs.filter(n => TAB_FILTERS[tab].includes(n.type))

  // Group by date
  const grouped: { date: string; items: Notif[] }[] = []
  filtered.forEach(n => {
    const d = new Date(n.created_at)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
    const label = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
    const last = grouped[grouped.length - 1]
    if (last && last.date === label) last.items.push(n)
    else grouped.push({ date: label, items: [n] })
  })

  const tabCounts: Record<string, number> = {}
  Object.entries(TAB_FILTERS).forEach(([t, types]) => {
    tabCounts[t] = t === 'All' ? notifs.length : notifs.filter(n => types.includes(n.type)).length
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0', paddingBottom: '80px' }}>
      <AppHeader />

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F0F0F', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
              Notifications
              {unread > 0 && (
                <span style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '20px', height: '20px', borderRadius: '99px', background: '#7F1D1D', color: 'white', fontSize: '11px', fontWeight: 700, padding: '0 5px', verticalAlign: 'middle' }}>
                  {unread}
                </span>
              )}
            </h1>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>Activity on your profile</p>
          </div>
          {notifs.some(n => !n.read) && (
            <button onClick={markAllRead} style={{ fontSize: '12.5px', fontWeight: 600, color: '#7F1D1D', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer' }}>
              Mark all read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', background: 'white', borderRadius: '10px', border: '1px solid #E8E8E8', padding: '4px', marginBottom: '16px', overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, minWidth: 'max-content', padding: '7px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, transition: 'all 0.15s', whiteSpace: 'nowrap',
              background: tab === t ? '#7F1D1D' : 'transparent',
              color: tab === t ? 'white' : '#777',
            }}>
              {t}
              {tabCounts[t] > 0 && (
                <span style={{ marginLeft: '5px', fontSize: '10px', fontWeight: 700, opacity: tab === t ? 0.8 : 0.5 }}>
                  {tabCounts[t]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E8E8E8', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F0EDEA', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 13, background: '#F0EDEA', borderRadius: '6px', width: '60%', marginBottom: '8px' }} />
                  <div style={{ height: 11, background: '#F0EDEA', borderRadius: '6px', width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px solid #E8E8E8' }}>
            <div style={{ fontSize: '44px', marginBottom: '16px' }}>🔔</div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
              {tab === 'All' ? 'No notifications yet' : `No ${tab.toLowerCase()} notifications`}
            </p>
            <p style={{ fontSize: '13.5px', color: '#9CA3AF', maxWidth: '280px', margin: '0 auto', lineHeight: 1.6 }}>
              {tab === 'All'
                ? 'When someone shows interest or views your profile, you\'ll see it here.'
                : 'Nothing in this category yet.'}
            </p>
          </div>
        )}

        {/* Notification groups */}
        {!loading && grouped.map(group => (
          <div key={group.date} style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#AAAAAA', marginBottom: '8px', paddingLeft: '4px' }}>
              {group.date}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {group.items.map(n => {
                const from = n.from_profile_id ? profiles[n.from_profile_id] : null
                const action = notifAction(n.type, n.from_profile_id)
                const badge = typeLabel(n.type)

                return (
                  <div key={n.id} style={{
                    background: n.read ? 'white' : '#FFFBFB',
                    borderRadius: '12px',
                    border: `1px solid ${n.read ? '#E8E8E8' : '#FECACA'}`,
                    padding: '14px 16px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    position: 'relative',
                    transition: 'box-shadow 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

                    {/* Unread dot */}
                    {!n.read && (
                      <div style={{ position: 'absolute', top: '16px', right: '16px', width: '7px', height: '7px', borderRadius: '50%', background: '#7F1D1D' }} />
                    )}

                    {/* Avatar or icon */}
                    {from
                      ? <Avatar profile={from} />
                      : <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                          {notifIcon(n.type)}
                        </div>}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{timeAgo(n.created_at)}</span>
                      </div>

                      <p style={{ fontSize: '13.5px', color: '#1F2937', margin: '0 0 4px', lineHeight: 1.5 }}>
                        {n.message}
                      </p>

                      {from && (
                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 8px' }}>
                          {[from.profession, from.native_district].filter(Boolean).join(' · ')}
                        </p>
                      )}

                      {action && (
                        <button onClick={() => router.push(action.href)}
                          style={{ fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '7px', background: '#7F1D1D', color: 'white', border: 'none', cursor: 'pointer' }}>
                          {action.label}
                        </button>
                      )}
                    </div>

                    {/* Dismiss */}
                    <button onClick={() => dismissNotif(n.id)}
                      style={{ position: 'absolute', bottom: '12px', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#CCC', fontSize: '11px', padding: '2px 6px' }}
                      title="Dismiss">
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

      </div>
      <AppFooter />
      <MobileNav />
    </div>
  )
}
