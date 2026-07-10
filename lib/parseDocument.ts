import Anthropic from '@anthropic-ai/sdk'
import type { ParsedBriefFields } from '@/types/database'

const EXTRACTION_PROMPT = `Extract structured hiring requirements from the job description below. Respond with ONLY a JSON object (no markdown fences, no prose) with these keys:
- role_type: one of "Full-Stack", "Cloud", "DevOps", "Both"
- tech_stack: array of technology/skill name strings
- duration_weeks: number (estimate if a duration like "3 months" is given)
- budget_min: number or null (monthly INR)
- budget_max: number or null (monthly INR)
- experience_level_required: one of "Junior", "Mid", "Senior", "Any"
- confidence: "high", "medium", or "low" — your overall confidence in this extraction
- low_confidence_fields: array of field names you are unsure about (e.g. if budget wasn't stated)`

function isConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

function sandboxFallback(): ParsedBriefFields {
  return {
    confidence: 'low',
    low_confidence_fields: ['role_type', 'tech_stack', 'duration_weeks', 'budget_min', 'budget_max', 'experience_level_required'],
  }
}

function extractJsonBlock(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) return text
  return text.slice(start, end + 1)
}

function parseResponseText(text: string): ParsedBriefFields {
  try {
    return JSON.parse(extractJsonBlock(text)) as ParsedBriefFields
  } catch {
    return sandboxFallback()
  }
}

// Extracts structured brief fields from either free text (pasted JD, forwarded email body)
// or an uploaded PDF (via Claude's native document support). Sandbox-safe: with no
// ANTHROPIC_API_KEY, returns an empty/low-confidence result rather than failing the request —
// the company reviews and fills fields in manually. §Prompt 18.
export async function parseBriefDocument(input: { text?: string; fileUrl?: string; fileType?: string }): Promise<ParsedBriefFields> {
  if (!isConfigured()) return sandboxFallback()

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  if (input.fileUrl && input.fileType === 'pdf') {
    const res = await fetch(input.fileUrl)
    if (!res.ok) return sandboxFallback()
    const buffer = Buffer.from(await res.arrayBuffer())
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') } },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      }],
    })
    const block = message.content[0]
    return block.type === 'text' ? parseResponseText(block.text) : sandboxFallback()
  }

  if (input.text) {
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: `${EXTRACTION_PROMPT}\n\n---\n\n${input.text}` }],
    })
    const block = message.content[0]
    return block.type === 'text' ? parseResponseText(block.text) : sandboxFallback()
  }

  return sandboxFallback()
}
