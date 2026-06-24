import type { SupabaseClient } from '@supabase/supabase-js'
import { createNotificationEvent } from './create-notification-event'

// ISO week bucket (e.g. "2026-W26") — used so dossier reminders can resurface
// at most once per week per user, without ever duplicating within the same week.
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

interface MatchRow {
  id: string
  user_a_id: string
  user_b_id: string
  status_a: 'pending' | 'interested' | 'declined'
  status_b: 'pending' | 'interested' | 'declined'
  is_mutual: boolean
}

// Scans the current state of `matches` and idempotently inserts any
// notification_events that are missing. Safe to call on every processor run —
// dedupe_key uniqueness guarantees no duplicate is ever created or sent.
// Never throws: a missing migration 007 (or 004 for dossier reminders) simply
// means notifications stay quiet, not broken.
export async function scanAndQueueEvents(serviceClient: SupabaseClient): Promise<void> {
  const { data: matches, error } = await serviceClient
    .from('matches')
    .select('id, user_a_id, user_b_id, status_a, status_b, is_mutual')

  if (error || !matches) return

  const rows = matches as MatchRow[]
  const mutualUserIds = new Set<string>()

  for (const m of rows) {
    if (!m.is_mutual && m.status_a === 'pending' && m.status_b === 'pending') {
      await createNotificationEvent(serviceClient, {
        userId: m.user_a_id, type: 'new_recommendation', matchId: m.id,
        dedupeKey: `new_recommendation:${m.user_a_id}:${m.id}`,
      })
      await createNotificationEvent(serviceClient, {
        userId: m.user_b_id, type: 'new_recommendation', matchId: m.id,
        dedupeKey: `new_recommendation:${m.user_b_id}:${m.id}`,
      })
    } else if (!m.is_mutual && m.status_a === 'pending' && m.status_b === 'interested') {
      await createNotificationEvent(serviceClient, {
        userId: m.user_a_id, type: 'other_interested', matchId: m.id,
        dedupeKey: `other_interested:${m.user_a_id}:${m.id}`,
      })
    } else if (!m.is_mutual && m.status_a === 'interested' && m.status_b === 'pending') {
      await createNotificationEvent(serviceClient, {
        userId: m.user_b_id, type: 'other_interested', matchId: m.id,
        dedupeKey: `other_interested:${m.user_b_id}:${m.id}`,
      })
    } else if (m.is_mutual) {
      await createNotificationEvent(serviceClient, {
        userId: m.user_a_id, type: 'mutual_match', matchId: m.id,
        dedupeKey: `mutual_match:${m.user_a_id}:${m.id}`,
      })
      await createNotificationEvent(serviceClient, {
        userId: m.user_b_id, type: 'mutual_match', matchId: m.id,
        dedupeKey: `mutual_match:${m.user_b_id}:${m.id}`,
      })
      mutualUserIds.add(m.user_a_id)
      mutualUserIds.add(m.user_b_id)
    }
  }

  if (mutualUserIds.size === 0) return

  // Dossier reminder: only for users with a mutual match whose dossier isn't
  // marked 'ready'. Gracefully skipped if migration 004 hasn't been run yet.
  try {
    const userIds = Array.from(mutualUserIds)
    const { data: dossiers, error: dossierError } = await serviceClient
      .from('user_application_profiles')
      .select('user_id, status')
      .in('user_id', userIds)

    if (dossierError) return

    const readyUserIds = new Set(
      (dossiers ?? []).filter(d => d.status === 'ready').map(d => d.user_id)
    )
    const week = isoWeekKey(new Date())

    for (const userId of userIds) {
      if (readyUserIds.has(userId)) continue
      await createNotificationEvent(serviceClient, {
        userId, type: 'dossier_reminder', matchId: null,
        dedupeKey: `dossier_reminder:${userId}:${week}`,
      })
    }
  } catch {
    // user_application_profiles not migrated yet — skip reminders silently.
  }
}
