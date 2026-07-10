import { NextRequest, NextResponse } from 'next/server'
import { getRankedCandidates } from '@/lib/matching/getRankedCandidates'

// Ranked match_scores for a brief, joined with a developer summary.
// Read by both the admin manual-match page and the company-facing shortlist page. §Prompt 14/19.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const candidates = await getRankedCandidates(id)
  return NextResponse.json(candidates)
}
