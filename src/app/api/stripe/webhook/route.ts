import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServiceClient } from '@supabase/supabase-js'

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

    // Resolve customer ID — may be a string or expanded object
    const customerId = typeof session.customer === 'string' ? session.customer : null

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
  }

  return NextResponse.json({ received: true })
}
