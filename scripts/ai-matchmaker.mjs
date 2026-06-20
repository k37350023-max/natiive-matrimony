/**
 * AI Matchmaker — uses Claude vision to score appearance + biodata + native compatibility
 * between male/female profiles, then sends "better match" notifications to top pairs.
 */
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'

const SUPABASE_URL = 'https://hsympuhzwpiquvovmssc.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzeW1wdWh6d3BpcXV2b3Ztc3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjQ1NDcsImV4cCI6MjA5NzMwMDU0N30.iLXE3vTSDhPqDSKiXP7PYY_nYLI8zQmzGdp-IvF937o'

// Read Anthropic key from .env.local
function getAnthropicKey() {
  const env = readFileSync('/Users/saicharannallapu/Desktop/natiive-matrimony/.env.local', 'utf8')
  const match = env.match(/ANTHROPIC_API_KEY=(.+)/)
  return match?.[1]?.trim()
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
const claude = new Anthropic({ apiKey: getAnthropicKey() })

function getAge(dob) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
}

function formatBiodata(p) {
  return [
    `Name: ${p.full_name}`,
    `Age: ${getAge(p.date_of_birth)} yrs`,
    `Height: ${p.height_cm ? `${p.height_cm}cm` : 'N/A'}`,
    `Education: ${p.education || 'N/A'}`,
    `Profession: ${p.profession || 'N/A'}`,
    `Religion: ${p.religion || 'N/A'}`,
    `Caste: ${p.caste || 'N/A'}`,
    `Mother tongue: ${p.mother_tongue || 'N/A'}`,
    `Native: ${p.native_district}, ${p.native_state}`,
  ].join('\n')
}

// Step 1: Score a single profile photo independently (presentation, grooming, confidence)
async function scoreProfilePhoto(profile) {
  try {
    const res = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 120,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are a matrimonial profile reviewer. Look at this profile photo and rate it on three dimensions:
- Grooming & presentation (0-4): neatness, dress sense, cleanliness
- Confidence & expression (0-3): warm smile, approachable, eye contact
- Photo quality & setting (0-3): clear, well-lit, appropriate background

Respond ONLY with JSON, no other text: {"grooming":3,"confidence":2,"photo":3,"total":8}`
          },
          { type: 'image', source: { type: 'url', url: profile.photo_url } }
        ]
      }],
    })
    const clean = res.content[0].text.trim().replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(clean)
    return parsed.total ?? (parsed.grooming + parsed.confidence + parsed.photo)
  } catch {
    return 5 // neutral fallback
  }
}

// Step 2: Appearance compatibility = how close their individual scores are (similar levels match best)
function appearanceCompatibility(scoreA, scoreB) {
  // Max 30 pts: both high = 30, both medium = 22, big gap = penalised
  const avg = (scoreA + scoreB) / 2
  const gap = Math.abs(scoreA - scoreB)
  const base = Math.round((avg / 10) * 25) // scale avg to 25
  const penalty = gap > 3 ? 8 : gap > 1 ? 3 : 0
  return Math.max(0, Math.min(30, base - penalty))
}

async function scoreMatchWithClaude(male, female, mPhotoScore, fPhotoScore) {
  const appearance = appearanceCompatibility(mPhotoScore, fPhotoScore)

  const prompt = `You are a professional matrimonial compatibility analyst for a Telugu matrimony app.

Score this potential match on TWO factors only. Respond ONLY in JSON.

1. **Lifestyle & career compatibility** (0-40 pts): Education levels, profession alignment, age gap (ideal: groom 1-5 yrs older), height difference.

2. **Family & values compatibility** (0-30 pts): Religion, caste, mother tongue, family background signals.

GROOM:
${formatBiodata(male)}

BRIDE:
${formatBiodata(female)}

Respond ONLY with this JSON (no markdown, no other text):
{"lifestyle":35,"family":28,"reason":"One sentence why they are a strong match."}`

  try {
    const res = await claude.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    })
    const clean = res.content[0].text.trim().replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(clean)

    // Native score computed directly (no AI needed)
    let native = 5
    if (male.native_district === female.native_district) native = 25
    else if (male.native_state === female.native_state) native = 18
    else if (
      ['Telangana','Andhra Pradesh'].includes(male.native_state) &&
      ['Telangana','Andhra Pradesh'].includes(female.native_state)
    ) native = 12

    const total = appearance + parsed.lifestyle + parsed.family + native
    return { appearance, lifestyle: parsed.lifestyle, family: parsed.family, native, total, reason: parsed.reason }
  } catch (e) {
    console.error(`  ⚠ Claude error for ${male.full_name} × ${female.full_name}:`, e.message)
    return null
  }
}

async function main() {
  console.log('🤖 AI Matchmaker starting...\n')

  // Fetch all profiles that have photos
  const { data: profiles, error } = await sb
    .from('profiles')
    .select('id,full_name,gender,photo_url,date_of_birth,profession,native_district,native_state,religion,caste,height_cm,education,mother_tongue,user_id')
    .not('photo_url', 'is', null)
    .order('created_at', { ascending: false })
    .in('id', process.env.MATCHMAKER_IDS ? process.env.MATCHMAKER_IDS.split(',') : [])

  if (error) throw error

  const males = profiles.filter(p => p.gender === 'male')
  const females = profiles.filter(p => p.gender === 'female')

  console.log(`Found ${males.length} grooms and ${females.length} brides with photos\n`)

  if (males.length === 0 || females.length === 0) {
    console.log('❌ Need at least one male and one female profile with photos.')
    return
  }

  // Score all pairs (cap at 6 males × 6 females to stay within API limits)
  const mSample = males.slice(0, 6)
  const fSample = females.slice(0, 6)

  // Step 1: Score each profile photo independently
  console.log('📸 Scoring profile photos...')
  const photoScores = {}
  for (const p of [...mSample, ...fSample]) {
    process.stdout.write(`  ${p.full_name}... `)
    photoScores[p.id] = await scoreProfilePhoto(p)
    console.log(`${photoScores[p.id]}/10`)
    await new Promise(r => setTimeout(r, 400))
  }

  // Step 2: Score all pairs
  console.log('\n🔍 Scoring pairs...')
  const results = []
  for (const m of mSample) {
    for (const f of fSample) {
      process.stdout.write(`  ${m.full_name} × ${f.full_name}... `)
      const score = await scoreMatchWithClaude(m, f, photoScores[m.id], photoScores[f.id])
      if (score) {
        results.push({ male: m, female: f, ...score })
        console.log(`${score.total}/100 (appearance:${score.appearance} lifestyle:${score.lifestyle} family:${score.family} native:${score.native})`)
      }
      await new Promise(r => setTimeout(r, 600))
    }
  }

  // Sort by total score descending, pick top 8 pairs
  results.sort((a, b) => b.total - a.total)
  const topPairs = results.slice(0, 8)

  console.log(`\n✨ Top ${topPairs.length} matches:\n`)
  topPairs.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.male.full_name} × ${p.female.full_name} — ${p.total}/100`)
    console.log(`     ${p.reason}\n`)
  })

  // Write to ai_picks table (keyed by profile_id, works regardless of user_id)
  const picks = []
  for (const pair of topPairs) {
    const { male: m, female: f } = pair
    // Groom gets a pick pointing to bride
    picks.push({
      for_profile_id: m.id,
      suggested_profile_id: f.id,
      score: pair.total,
      appearance: pair.appearance,
      lifestyle: pair.lifestyle,
      family: pair.family,
      native: pair.native,
      reason: pair.reason,
    })
    // Bride gets a pick pointing to groom
    picks.push({
      for_profile_id: f.id,
      suggested_profile_id: m.id,
      score: pair.total,
      appearance: pair.appearance,
      lifestyle: pair.lifestyle,
      family: pair.family,
      native: pair.native,
      reason: pair.reason,
    })
  }

  // Upsert so re-running updates scores
  const { error: picksError } = await sb.from('ai_picks').upsert(picks, { onConflict: 'for_profile_id,suggested_profile_id' })
  if (picksError) {
    console.error('❌ Error saving ai_picks:', picksError.message)
  } else {
    console.log(`✅ Saved ${picks.length} AI picks to database!`)
  }

  // Also send notifications to users who have user_id set
  const notifications = []
  for (const pair of topPairs) {
    const { male: m, female: f } = pair
    if (m.user_id) {
      notifications.push({
        user_id: m.user_id,
        type: 'ai_match_suggestion',
        message: `✨ Top Pick: ${f.full_name} scored ${pair.total}/100 compatibility with you — ${pair.reason}`,
        from_profile_id: f.id,
        link: `/profile/${f.id}`,
        read: false,
      })
    }
    if (f.user_id) {
      notifications.push({
        user_id: f.user_id,
        type: 'ai_match_suggestion',
        message: `✨ Top Pick: ${m.full_name} scored ${pair.total}/100 compatibility with you — ${pair.reason}`,
        from_profile_id: m.id,
        link: `/profile/${m.id}`,
        read: false,
      })
    }
  }
  if (notifications.length > 0) {
    const { error: notifError } = await sb.from('notifications').insert(notifications)
    if (notifError) console.error('❌ Notification error:', notifError.message)
    else console.log(`✅ Sent ${notifications.length} in-app notifications!`)
  }

  // Always save results to a JSON file for review
  const output = {
    generated_at: new Date().toISOString(),
    top_pairs: topPairs.map(p => ({
      groom: p.male.full_name,
      bride: p.female.full_name,
      score: p.total,
      breakdown: { appearance: p.appearance, lifestyle: p.lifestyle, family: p.family, native: p.native },
      reason: p.reason,
      groom_profile: `/profile/${p.male.id}`,
      bride_profile: `/profile/${p.female.id}`,
    }))
  }
  const fs = await import('fs')
  fs.writeFileSync('/Users/saicharannallapu/Desktop/natiive-matrimony/scripts/ai-match-results.json', JSON.stringify(output, null, 2))
  console.log('\n📄 Full results saved to scripts/ai-match-results.json')
}

main().catch(console.error)
