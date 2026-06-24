import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(_req: NextRequest) {
  // Authenticate caller
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://homelio.ch'

  if (!stripeKey) {
    return NextResponse.json(
      { error: 'setup_incomplete', message: 'Abo-Verwaltung ist noch nicht fertig eingerichtet.' },
      { status: 503 }
    )
  }

  // RLS already restricts this to the caller's own row (owner-select policy).
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'no_customer', message: 'Kein Stripe-Kundenkonto gefunden.' },
      { status: 404 }
    )
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2026-05-27.dahlia' })

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl}/profil/sucheinstellungen`,
  })

  if (!session.url) {
    return NextResponse.json({ error: 'Portal session creation failed' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
