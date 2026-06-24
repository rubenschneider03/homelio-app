import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import { createNotificationEvent } from '@/lib/notifications/create-notification-event'

const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
  'invoice.payment_succeeded',
])

// Maps a Stripe subscription status to our profiles.premium_status enum.
// Enum already supports all values used here (free, active, expired, cancelled, pending, failed).
function mapSubscriptionStatus(status: Stripe.Subscription.Status): { is_premium: boolean; premium_status: string } {
  switch (status) {
    case 'active':
    case 'trialing':
      return { is_premium: true, premium_status: 'active' }
    case 'past_due':
    case 'unpaid':
      return { is_premium: false, premium_status: 'failed' }
    case 'canceled':
      return { is_premium: false, premium_status: 'cancelled' }
    case 'incomplete':
      return { is_premium: false, premium_status: 'pending' }
    case 'incomplete_expired':
    case 'paused':
    default:
      return { is_premium: false, premium_status: 'expired' }
  }
}

// Subscriptions/invoices don't carry our own user id — resolve via the
// stripe_customer_id we stored on the profile during checkout.session.completed.
async function resolveUserIdByCustomer(
  serviceClient: SupabaseClient,
  customerId: string | null
): Promise<string | null> {
  if (!customerId) return null
  const { data } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.id ?? null
}

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) return null
  return typeof customer === 'string' ? customer : customer.id
}

export async function POST(request: NextRequest) {
  // Read raw body before any parsing — required for Stripe signature verification
  const rawBody  = await request.text()
  const signature = request.headers.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeKey     = process.env.STRIPE_SECRET_KEY

  if (!webhookSecret || !stripeKey || !signature) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2026-05-27.dahlia' })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'DB service not configured' }, { status: 500 })
  }
  const serviceClient = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  // ── checkout.session.completed — initial activation ──────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.user_id
    if (!userId) {
      return NextResponse.json({ received: true })
    }

    const customerId     = getCustomerId(session.customer)
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null

    await serviceClient
      .from('profiles')
      .update({
        is_premium: true,
        premium_status: 'active',
        premium_purchased_at: new Date().toISOString(),
        stripe_customer_id: customerId,
        stripe_checkout_session_id: session.id,
      })
      .eq('id', userId)

    // Best-effort: stripe_subscription_id requires a column added in migration 006.
    if (subscriptionId) {
      const { error: subError } = await serviceClient
        .from('profiles')
        .update({ stripe_subscription_id: subscriptionId })
        .eq('id', userId)
      if (subError) {
        console.warn('stripe webhook: could not store stripe_subscription_id (column likely missing)')
      }
    }

    await createNotificationEvent(serviceClient, {
      userId,
      type: 'premium_success',
      matchId: null,
      dedupeKey: `premium_success:${userId}:${session.id}`,
    })

    console.log(`stripe webhook: checkout.session.completed user=${userId} status=active`)
  }

  // ── customer.subscription.updated — renewals, plan/status changes ────────────
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = getCustomerId(subscription.customer)
    const userId = await resolveUserIdByCustomer(serviceClient, customerId)

    if (userId) {
      const mapped = mapSubscriptionStatus(subscription.status)
      await serviceClient
        .from('profiles')
        .update({
          is_premium: mapped.is_premium,
          premium_status: mapped.premium_status,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
        })
        .eq('id', userId)
      console.log(`stripe webhook: subscription.updated user=${userId} status=${subscription.status}`)
    }
  }

  // ── customer.subscription.deleted — cancellation, end of life ────────────────
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = getCustomerId(subscription.customer)
    const userId = await resolveUserIdByCustomer(serviceClient, customerId)

    if (userId) {
      await serviceClient
        .from('profiles')
        .update({ is_premium: false, premium_status: 'cancelled' })
        .eq('id', userId)
      console.log(`stripe webhook: subscription.deleted user=${userId} status=cancelled`)
    }
  }

  // ── invoice.payment_failed ────────────────────────────────────────────────────
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = getCustomerId(invoice.customer)
    const userId = await resolveUserIdByCustomer(serviceClient, customerId)

    if (userId) {
      const subDetails = invoice.parent?.subscription_details ?? null
      const subscriptionId = subDetails
        ? (typeof subDetails.subscription === 'string' ? subDetails.subscription : subDetails.subscription.id)
        : null

      // Confirm current subscription status before deciding is_premium — a
      // failed payment doesn't always mean the subscription itself is dead yet
      // (Stripe Smart Retries may keep it active for a grace period).
      let stillActive = false
      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          stillActive = sub.status === 'active' || sub.status === 'trialing'
        } catch {
          // Could not confirm — safer to treat premium as inactive than leave stale access.
        }
      }

      await serviceClient
        .from('profiles')
        .update({ premium_status: 'failed', is_premium: stillActive })
        .eq('id', userId)
      console.log(`stripe webhook: invoice.payment_failed user=${userId} is_premium=${stillActive}`)
    }
  }

  // ── invoice.payment_succeeded ──────────────────────────────────────────────────
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = getCustomerId(invoice.customer)
    const userId = await resolveUserIdByCustomer(serviceClient, customerId)

    if (userId) {
      await serviceClient
        .from('profiles')
        .update({ is_premium: true, premium_status: 'active' })
        .eq('id', userId)
      console.log(`stripe webhook: invoice.payment_succeeded user=${userId} status=active`)
    }
  }

  return NextResponse.json({ received: true })
}
