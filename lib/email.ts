/* Server-side email sending via Resend. Env-gated: if RESEND_API_KEY is not
   set, sends are skipped gracefully (so nothing breaks in dev / before the key
   is added). Callers should treat `skipped` as "not delivered". */

const FROM = process.env.EMAIL_FROM || 'NativeMatrimony <noreply@nativematrimony.com>'

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export async function sendEmail(
  { to, subject, html, text }: { to: string; subject: string; html: string; text?: string },
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, skipped: true }
  if (!to || !to.includes('@')) return { ok: false, error: 'Invalid recipient' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html, ...(text ? { text } : {}) }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { ok: false, error: (data as { message?: string }).message || `Resend ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Email send failed' }
  }
}

/* Minimal branded wrapper so every email looks consistent and professional. */
export function emailLayout(heading: string, bodyHtml: string, cta?: { label: string; url: string }): string {
  const btn = cta
    ? `<tr><td style="padding:8px 0 4px"><a href="${cta.url}" style="display:inline-block;background:#1B5E20;color:#EAF3EA;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:10px">${cta.label}</a></td></tr>`
    : ''
  return `<!doctype html><html><body style="margin:0;background:#FBFAF5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#14241C">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBFAF5;padding:28px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border:1px solid #E7E3D8;border-radius:16px;padding:28px 26px">
        <tr><td style="font-size:18px;font-weight:800;color:#1B5E20;padding-bottom:14px;letter-spacing:0.02em">Native<span style="color:#4E7D34;font-weight:700"> Matrimony</span></td></tr>
        <tr><td style="font-size:20px;font-weight:700;color:#14241C;padding-bottom:10px;line-height:1.3">${heading}</td></tr>
        <tr><td style="font-size:15px;line-height:1.6;color:#3B4A40;padding-bottom:16px">${bodyHtml}</td></tr>
        ${btn}
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">
        <tr><td style="font-size:12px;color:#8A968E;padding:14px 6px 0;text-align:center">
          NativeMatrimony · Marriage profiles by native place.<br/>You're receiving this because you have an account or a saved alert.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`
}
