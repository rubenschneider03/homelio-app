import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Recovery flow: only ever honor this one known-safe internal path —
      // never redirect to an arbitrary attacker-controlled `next` value.
      if (next === '/auth/reset-password') {
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }
      // Normal signup-confirmation flow — unchanged.
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}/anmelden?error=auth`)
}
