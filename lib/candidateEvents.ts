import { createAdminClient } from '@/lib/supabase/admin'
import type { ActorTypeValue } from '@/types/database'

// Append-only event log powering the admin analytics needs-attention queue and
// per-candidate timeline. §Prompt 15.
export async function logCandidateEvent(
  developerId: string,
  eventType: string,
  actorType: ActorTypeValue,
  metadata: Record<string, unknown> = {},
  actorId?: string
): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('candidate_events').insert({
    developer_id: developerId,
    event_type: eventType,
    actor_type: actorType,
    actor_id: actorId ?? null,
    metadata,
  })
}
