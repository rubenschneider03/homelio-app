import type { SupabaseClient } from '@supabase/supabase-js'
import type { NotificationType } from './email-templates'

interface CreateEventParams {
  userId: string
  type: NotificationType
  dedupeKey: string
  matchId?: string | null
  payload?: Record<string, unknown>
}

// Idempotent by design: dedupe_key has a UNIQUE constraint, so re-inserting the
// same logical event (e.g. on every cron run) is always a safe no-op.
// Table-not-yet-migrated (42P01) is swallowed so callers never crash on a
// missing migration 007 — notifications simply stay disabled until it is run.
export async function createNotificationEvent(
  serviceClient: SupabaseClient,
  params: CreateEventParams
): Promise<void> {
  try {
    await serviceClient
      .from('notification_events')
      .upsert(
        {
          user_id: params.userId,
          type: params.type,
          match_id: params.matchId ?? null,
          dedupe_key: params.dedupeKey,
          payload: params.payload ?? {},
        },
        { onConflict: 'dedupe_key', ignoreDuplicates: true }
      )
  } catch {
    // Migration 007 not yet run, or transient error — never block the caller.
  }
}
