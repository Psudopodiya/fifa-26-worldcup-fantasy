import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/** Anon client — for public reads (server components) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): any {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/** Service-role client — bypasses RLS, server-side only */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminClient(): any {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
