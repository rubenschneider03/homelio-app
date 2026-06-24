import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getEmailTemplate, type NotificationType } from '@/lib/notifications/email-templates'
import { scanAndQueueEvents } from '@/lib/notifications/scan-matches'

const MAX_ATTEMPTS = 3
const BATCH_LIMIT = 200

const PREFERENCE_COLUMN: Record<NotificationType, string> = {
  new_recommendation: 'new_recommendations',
  other_interested: 'other_interested',
  mutual_match: 'mutual_matches',
  dossier_reminder: 'dossier_reminders',
  premium_success: 'premium_success',
}

interface NotificationEventRow {
  id: string
  user_id: string
  type: NotificationType
  status: string
  attempts: number
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) return true

  const url = new URL(request.url)
  if (url.searchParams.get('secret') === secret) return true

  return false
}

async function handle(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
  }

  const serviceClient = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  // 1. Scan current match/dossier state and queue any missing events — idempotent.
  await scanAndQueueEvents(serviceClient)

  // 2. Load pending events. A missing migration 007 means this table doesn't
  //    exist yet — treat that as "nothing to do", never crash the cron run.
  const { data: events, error: eventsError } = await serviceClient
    .from('notification_events')
    .select('id, user_id, type, status, attempts')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(BATCH_LIMIT)

  if (eventsError) {
    return NextResponse.json({ ok: true, processed: 0, note: 'notifications not migrated yet' })
  }

  const pending = (events ?? []) as NotificationEventRow[]
  if (pending.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  // 3. Preload preferences for all involved users in one query.
  const userIds = Array.from(new Set(pending.map(e => e.user_id)))
  const { data: prefRows } = await serviceClient
    .from('notification_preferences')
    .select('*')
    .in('user_id', userIds)

  const prefsByUser = new Map<string, Record<string, boolean>>()
  for (const row of prefRows ?? []) {
    prefsByUser.set(row.user_id, row as Record<string, boolean>)
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://homelio.ch'
  const resendKey = process.env.RESEND_API_KEY
  const fromAddress = process.env.RESEND_FROM_EMAIL
  const resend = resendKey ? new Resend(resendKey) : null

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const event of pending) {
    const prefColumn = PREFERENCE_COLUMN[event.type]
    const userPrefs = prefsByUser.get(event.user_id)
    // Missing preference row → default to enabled (matches column defaults).
    const enabled = userPrefs ? userPrefs[prefColumn] !== false : true

    if (!enabled) {
      await serviceClient
        .from('notification_events')
        .update({ status: 'skipped', skipped_at: new Date().toISOString() })
        .eq('id', event.id)
      skipped++
      console.log(`notification ${event.id} ${event.type} -> skipped (preference disabled)`)
      continue
    }

    if (!resend || !fromAddress) {
      // Email sending not configured — leave pending for a future run once configured.
      console.log(`notification ${event.id} ${event.type} -> deferred (resend not configured)`)
      continue
    }

    try {
      const { data: userResult, error: userError } = await serviceClient.auth.admin.getUserById(event.user_id)
      const email = userResult?.user?.email
      if (userError || !email) {
        throw new Error('no_email')
      }

      const template = getEmailTemplate(event.type, siteUrl)
      const { error: sendError } = await resend.emails.send({
        from: fromAddress,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })
      if (sendError) throw new Error('send_failed')

      await serviceClient
        .from('notification_events')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', event.id)
      sent++
      console.log(`notification ${event.id} ${event.type} -> sent`)
    } catch {
      const attempts = event.attempts + 1
      const nextStatus = attempts >= MAX_ATTEMPTS ? 'failed' : 'pending'
      await serviceClient
        .from('notification_events')
        .update({ attempts, status: nextStatus, last_error: 'send_error' })
        .eq('id', event.id)
      failed++
      console.log(`notification ${event.id} ${event.type} -> ${nextStatus} (attempt ${attempts})`)
    }
  }

  return NextResponse.json({ ok: true, processed: pending.length, sent, skipped, failed })
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
