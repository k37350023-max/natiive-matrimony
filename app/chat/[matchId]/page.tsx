'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Message = {
  id: string
  match_id: string
  from_profile_id: string
  content: string
  created_at: string
  read: boolean
}

type OtherProfile = {
  id: string
  full_name: string
  photo_url: string | null
  photo_visibility: string | null
  last_login_at: string | null
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function lastSeenLabel(ts: string | null): string {
  if (!ts) return 'Offline'
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (mins < 5) return 'Online now'
  if (mins < 60) return `Active ${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Active ${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days <= 7) return `Active ${days}d ago`
  return 'Offline'
}

function formatTime(ts: string) {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPage() {
  const params = useParams()
  const matchId = params.matchId as string
  const [myProfileId, setMyProfileId] = useState<string | null>(null)
  const [other, setOther] = useState<OtherProfile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sendError, setSendError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    setMyProfileId(id)
    if (id && matchId) init(id)
  }, [matchId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function init(myId: string) {
    // Load match to find the other person
    const { data: match } = await supabase
      .from('matches').select('*').eq('id', matchId).maybeSingle()
    if (!match) { setError('Match not found'); setLoading(false); return }

    const otherId = match.user1 === myId ? match.user2 : match.user1
    const { data: profile } = await supabase
      .from('profiles').select('id, full_name, photo_url, photo_visibility, last_login_at')
      .eq('id', otherId).maybeSingle()
    setOther(profile)

    // Load messages
    await loadMessages()
    // Mark received messages as read
    supabase.from('messages')
      .update({ read: true })
      .eq('match_id', matchId)
      .neq('from_profile_id', myId)
      .then(() => {})

    setLoading(false)

    // Real-time subscription
    const channel = supabase.channel(`chat-${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
        if ((payload.new as Message).from_profile_id !== myId) {
          supabase.from('messages').update({ read: true }).eq('id', payload.new.id).then(() => {})
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('messages').select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function send() {
    if (!text.trim() || !myProfileId || sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    // Optimistically show message immediately
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      match_id: matchId,
      from_profile_id: myProfileId,
      content,
      created_at: new Date().toISOString(),
      read: false,
    }
    setMessages(prev => [...prev, tempMsg])
    const { data: inserted, error: err } = await supabase.from('messages').insert({
      match_id: matchId,
      from_profile_id: myProfileId,
      content,
    }).select().single()
    if (err) {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      setSendError('Failed to send. Tap to retry.')
      setText(content)
      setTimeout(() => setSendError(''), 4000)
    } else if (inserted) {
      // Replace temp with real message (has correct id)
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? inserted : m))
    }
    setSending(false)
    inputRef.current?.focus()
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFFBF5' }}>
      <div className="text-center">
        <p className="text-gray-600 mb-4">{error}</p>
        <Link href="/matches" className="btn-primary px-6 py-2.5">Back to Matches</Link>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen" style={{ background: '#FFFBF5' }}>
      {/* Header */}
      <header className="bg-white border-b shrink-0 z-10" style={{ borderColor: '#EDE8E0' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/matches" className="text-gray-400 hover:text-gray-700 p-1 -ml-1 rounded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          {other ? (
            <>
              {other.photo_url && other.photo_visibility !== 'hidden' ? (
                <img loading="lazy" src={other.photo_url} alt={other.full_name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 text-white"
                  style={{ background: '#9B1C1C' }}>
                  {initials(other.full_name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${other.id}`} className="font-bold text-gray-900 text-sm hover:text-amber-700 block truncate">
                  {other.full_name}
                </Link>
                <p className="text-xs text-gray-400">{lastSeenLabel(other.last_login_at)}</p>
              </div>
            </>
          ) : (
            <div className="h-9 w-40 bg-gray-100 rounded animate-pulse" />
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400 text-sm">Loading messages...</p>
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 text-2xl"
              style={{ background: '#FEF2F2' }}>💬</div>
            <p className="font-semibold text-gray-700">Start the conversation</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">
              You and {other?.full_name || 'your match'} are connected. Say hello!
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {[
                'Hi, I came across your profile and would love to connect.',
                `Your background caught my attention — would love to chat.`,
                'Hello! Looking forward to getting to know you.',
              ].map(starter => (
                <button key={starter}
                  onClick={() => setText(starter)}
                  className="text-xs px-4 py-2.5 rounded-xl border text-left transition-colors hover:bg-red-50"
                  style={{ borderColor: '#FECACA', color: '#7F1D1D', background: '#FEF2F2' }}>
                  "{starter}"
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          {messages.map((m, idx) => {
            const isMe = m.from_profile_id === myProfileId
            const prevMsg = idx > 0 ? messages[idx - 1] : null
            const showDate = !prevMsg ||
              new Date(m.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString()
            return (
              <div key={m.id}>
                {showDate && (
                  <div className="text-center my-4">
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      {new Date(m.created_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-xs sm:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={isMe
                      ? { background: '#9B1C1C', color: 'white', borderBottomRightRadius: '4px' }
                      : { background: 'white', color: '#111827', border: '1px solid #EDE8E0', borderBottomLeftRadius: '4px' }}>
                    {m.content}
                    <span className="block text-right mt-1 opacity-60" style={{ fontSize: '10px' }}>
                      {formatTime(m.created_at)}
                      {isMe && (m.read ? ' ✓✓' : ' ✓')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Send error toast */}
      {sendError && (
        <div className="shrink-0 px-4 py-2 text-center text-xs font-medium" style={{ background: '#FEF2F2', color: '#9B1C1C' }}>
          {sendError}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 bg-white border-t px-4 py-3" style={{ borderColor: '#EDE8E0' }}>
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
            placeholder={`Say something to ${other?.full_name?.split(' ')[0] || 'them'}…`}
            rows={1}
            style={{ resize: 'none', maxHeight: '120px', overflowY: 'auto' }}
            className="flex-1 input py-2.5 text-sm"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{ background: text.trim() ? '#9B1C1C' : '#E7E5E4' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={text.trim() ? 'white' : '#9CA3AF'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
