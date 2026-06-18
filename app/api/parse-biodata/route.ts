import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })

const EXTRACT_PROMPT = `You are parsing a matrimonial biodata document. Extract every field you can find and return ONLY a valid JSON object — no explanation, no markdown fences.

Fields to extract (use null for anything not found):
{
  "full_name": string,
  "gender": "male" | "female" | null,
  "date_of_birth": "YYYY-MM-DD" | null,
  "birth_time": string,        // e.g. "6:45 PM"
  "birth_place": string,       // e.g. "Ramagundam, Karimnagar"
  "height_cm": number | null,  // convert feet/inches if needed
  "religion": string,
  "caste": string,
  "mother_tongue": string,
  "gotra": string,
  "star": string,              // nakshatra
  "rashi": string,             // moon sign
  "manglik": string,           // "Manglik" | "Non-Manglik" | "Anshik Manglik"
  "education": string,
  "profession": string,
  "company": string,
  "annual_income": string,
  "visa_status": string,       // e.g. "H1B", "H1B + i140 processing", "Green Card (PR)"
  "native_district": string,
  "native_state": string,
  "current_city": string,
  "current_state": string,
  "father_name": string,
  "father_occupation": string,
  "mother_name": string,
  "mother_occupation": string,
  "siblings": string,          // free text description
  "siblings_married": string,  // "All married" | "All unmarried" | "Some married, some unmarried" | "No siblings"
  "diet": string,              // "Vegetarian" | "Non-Vegetarian" | "Eggetarian"
  "smoking": string,           // "Never" | "Occasionally" | "Regularly"
  "drinking": string,          // "Never" | "Occasionally" | "Regularly"
  "about": string              // bio / about section, max 400 chars
}

Be liberal in extraction — guess gender from name if not stated. Convert height like "5'8\\"" to cm (172). For date_of_birth parse any format to YYYY-MM-DD.`

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Biodata parsing is not configured yet. Please contact support.' }, { status: 503 })
  }
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mime = file.type
    const name = file.name.toLowerCase()

    let extractedData: Record<string, unknown> = {}

    // --- IMAGE (JPG, PNG, WEBP, HEIC) → Claude vision ---
    if (mime.startsWith('image/') || name.match(/\.(jpg|jpeg|png|webp|heic|heif)$/)) {
      const b64 = buffer.toString('base64')
      const mediaType = (mime.startsWith('image/') ? mime : 'image/jpeg') as
        'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } },
            { type: 'text', text: EXTRACT_PROMPT },
          ],
        }],
      })
      const text = (response.content[0] as { type: string; text: string }).text
      extractedData = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())

    // --- PDF → extract text → Claude text ---
    } else if (mime === 'application/pdf' || name.endsWith('.pdf')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfModule = await import('pdf-parse') as any
      const pdfParse = pdfModule.default ?? pdfModule
      const pdfData = await pdfParse(buffer)
      const text = pdfData.text.slice(0, 8000)

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `${EXTRACT_PROMPT}\n\nBIODATA TEXT:\n${text}`,
        }],
      })
      const raw = (response.content[0] as { type: string; text: string }).text
      extractedData = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())

    // --- DOCX → extract text → Claude text ---
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      const text = result.value.slice(0, 8000)

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `${EXTRACT_PROMPT}\n\nBIODATA TEXT:\n${text}`,
        }],
      })
      const raw = (response.content[0] as { type: string; text: string }).text
      extractedData = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())

    } else {
      return NextResponse.json({ error: 'Unsupported file type. Upload a PDF, image, or Word document.' }, { status: 400 })
    }

    return NextResponse.json({ data: extractedData })
  } catch (err: unknown) {
    console.error('parse-biodata error:', err)
    const msg = (err as { error?: { type?: string } })?.error?.type === 'invalid_request_error' &&
      JSON.stringify(err).includes('credit balance')
      ? 'AI service is temporarily unavailable. Please fill in your details manually.'
      : 'Failed to parse biodata. Please try again.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
