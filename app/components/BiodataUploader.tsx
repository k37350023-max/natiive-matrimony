'use client'
import { useRef, useState } from 'react'

type ParsedData = Record<string, string | number | null>

interface Props {
  onParsed: (data: ParsedData) => void
}

export default function BiodataUploader({ onParsed }: Props) {
  const [state, setState] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    const ext = file.name.toLowerCase()
    const ok = allowed.includes(file.type) ||
      ext.endsWith('.pdf') || ext.endsWith('.docx') ||
      ext.endsWith('.jpg') || ext.endsWith('.jpeg') ||
      ext.endsWith('.png') || ext.endsWith('.webp') || ext.endsWith('.heic')

    if (!ok) {
      setState('error')
      setErrMsg('Please upload a PDF, Word doc (.docx), or image (JPG/PNG)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setState('error')
      setErrMsg('File must be under 10 MB')
      return
    }

    setState('parsing')
    setErrMsg('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/parse-biodata', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Parse failed')
      setState('done')
      onParsed(json.data)
    } catch (e: unknown) {
      setState('error')
      setErrMsg(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#4CC9F0" stroke="none" style={{ flexShrink: 0 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <p className="font-semibold text-gray-800 font-serif-display">Auto-fill from your biodata</p>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Upload an existing biodata (PDF, Word, or photo) — we'll read it and fill your profile in seconds
      </p>

      {state === 'done' ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06D6A0" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <div>
            <p className="text-sm font-semibold text-green-800">Biodata parsed!</p>
            <p className="text-xs text-green-700">Fields filled below — review and save</p>
          </div>
          <button onClick={() => setState('idle')} className="ml-auto text-xs text-green-700 underline">Upload another</button>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => state !== 'parsing' && inputRef.current?.click()}
          className="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all py-6"
          style={{
            borderColor: dragging ? '#0B132B' : '#E8EDF3',
            background: dragging ? '#EAF8FE' : '#F8FAFC',
          }}>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.jpg,.jpeg,.png,.webp,.heic"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          {state === 'parsing' ? (
            <>
              <div className="w-8 h-8 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-gray-600">Reading your biodata…</p>
              <p className="text-xs text-gray-400">Usually takes 5–10 seconds</p>
            </>
          ) : (
            <>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B132B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p className="text-sm font-semibold text-gray-700">Drop your biodata here</p>
              <p className="text-xs text-gray-400">PDF · Word (.docx) · Photo (JPG / PNG)</p>
              <p className="text-xs font-medium px-4 py-1.5 rounded-lg mt-1" style={{ background: '#EAF8FE', color: '#0B132B' }}>
                or tap to choose file
              </p>
            </>
          )}
        </div>
      )}

      {state === 'error' && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {errMsg}
        </p>
      )}
    </div>
  )
}
