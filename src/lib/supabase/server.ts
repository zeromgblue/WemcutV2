import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { fetchWithTimeout, withAuthTimeout } from './timeout'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchWithTimeout },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Signed-in user for the current request. Verifies the session JWT with
// getClaims() (local when the project uses asymmetric signing keys) instead of
// calling the Auth server every time, and is deduped per request by cache().
// If Supabase doesn't answer in time the user is treated as signed out.
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const result = await withAuthTimeout(() => supabase.auth.getClaims())
  const claims = result === 'timeout' ? null : result.data?.claims

  if (!claims?.sub) return { supabase, user: null }

  return {
    supabase,
    user: { id: claims.sub, email: typeof claims.email === 'string' ? claims.email : undefined },
  }
})
