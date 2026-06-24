import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createNotificationEvent } from '@/lib/notifications/create-notification-event'

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.user_id
    if (!userId) {
      return NextResponse.json({ received: true })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({ error: 'DB service not configured' }, { status: 500 })
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey
    )

    // Resolve customer/subscription IDs — may be strings or expanded objects
    const customerId     = typeof session.customer === 'string' ? session.customer : null
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

    // Best-effort: stripe_subscription_id requires a column that is not yet
    // part of any migration in this repo. Attempted separately so a missing
    // column never blocks the core premium activation above.
    if (subscriptionId) {
      const { error: subError } = await serviceClient
        .from('profiles')
        .update({ stripe_subscription_id: subscriptionId })
        .eq('id', userId)
      if (subError) {
        console.warn('stripe webhook: could not store stripe_subscription_id (column likely missing)')
      }
    }

    // Queue the premium_success email — idempotent, never blocks the webhook response.
    await createNotificationEvent(serviceClient, {
      userId,
      type: 'premium_success',
      matchId: null,
      dedupeKey: `premium_success:${userId}:${session.id}`,
    })
  }

  return NextResponse.json({ received: true })
}
