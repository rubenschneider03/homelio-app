import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(_req: NextRequest) {
  // Authenticate caller
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate required env vars before touching Stripe
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const priceId   = process.env.STRIPE_PREMIUM_PRICE_ID
  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://homelio.ch'

  if (!stripeKey || !priceId) {
    return NextResponse.json(
      { error: 'setup_incomplete', message: 'Premium-Zahlung ist noch nicht fertig eingerichtet.' },
      { status: 503 }
    )
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2026-05-27.dahlia' })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/profil/sucheinstellungen?premium=success`,
    cancel_url:  `${siteUrl}/profil/sucheinstellungen?premium=cancelled`,
    customer_email: user.email ?? undefined,
    metadata: {
      user_id: user.id,
      product: 'homelio_premium_pilot',
    },
  })

  if (!session.url) {
    return NextResponse.json({ error: 'Checkout session creation failed' }, { status: 500 })
  }

  // Set profile to pending using service role (bypasses RLS — safe server-only)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey
    )
    await serviceClient
      .from('profiles')
      .update({
        premium_status: 'pending',
        stripe_checkout_session_id: session.id,
      })
      .eq('id', user.id)
  }

  return NextResponse.json({ url: session.url })
}
