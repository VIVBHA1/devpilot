import { createClient } from '@supabase/supabase-js'

// Admin client uses service role key and bypasses RLS.
// No generic type — API routes use explicit casts where needed.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
