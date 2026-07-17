import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const PHOTO_BUCKET = 'apartment-photos'

/**
 * Permanently deletes the calling user's account and all associated data.
 *
 * Deletion order matters: matches and match_events reference profiles/apartments
 * WITHOUT ON DELETE CASCADE, so they must be removed first or the auth-user
 * deletion fails with a foreign-key violation. Everything else (profile,
 * apartment, search_preferences, apartment_photos rows, notification_*) cascades
 * automatically from auth.users. Storage photo FILES are not covered by DB
 * cascade and are removed explicitly.
 */
export async function POST() {
  // Authenticate the caller — a user may only ever delete their own account.
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = user.id

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'Account deletion not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local.' },
      { status: 500 }
    )
  }

  // Service role client bypasses RLS — required to remove match rows the user
  // has no direct DELETE grant on, to delete the auth user, and to clear storage.
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  )

  // Any failure returns the failing step so the exact cause is visible instead
  // of a generic message; full detail is also logged server-side.
  const fail = (step: string, detail: unknown) => {
    console.error(`[account/delete] step=${step}`, detail)
    const message = detail instanceof Error ? detail.message
      : (detail as { message?: string })?.message ?? String(detail)
    return NextResponse.json({ error: 'Deletion failed.', step, detail: message }, { status: 500 })
  }

  // 1. Find every match involving this user (either side).
  const { data: userMatches, error: matchSelErr } = await service
    .from('matches')
    .select('id')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
  if (matchSelErr) return fail('matches_select', matchSelErr)
  const matchIds = (userMatches ?? []).map(m => m.id)

  // 2. Delete audit events for those matches (FK: match_events → matches, no cascade).
  if (matchIds.length > 0) {
    const { error } = await service.from('match_events').delete().in('match_id', matchIds)
    if (error) return fail('match_events_delete', error)
  }

  // 3. Delete the matches themselves (FK: matches → profiles/apartments, no cascade).
  const { error: matchDelErr } = await service
    .from('matches')
    .delete()
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
  if (matchDelErr) return fail('matches_delete', matchDelErr)

  // 4. Remove photo files from storage (DB rows cascade, the files do not).
  const { data: photos } = await service
    .from('apartment_photos')
    .select('storage_path')
    .eq('user_id', userId)
  const paths = (photos ?? []).map(p => p.storage_path).filter(Boolean)
  if (paths.length > 0) {
    // Best-effort: a storage hiccup must not block account deletion.
    await service.storage.from(PHOTO_BUCKET).remove(paths)
  }

  // 5. Delete the auth user — cascades profile, apartment, search_preferences,
  //    apartment_photos rows and notification_* tables.
  const { error: delErr } = await service.auth.admin.deleteUser(userId)
  if (delErr) return fail('auth_delete', delErr)

  return NextResponse.json({ ok: true })
}
