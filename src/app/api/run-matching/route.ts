import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST() {
  // Authenticate the caller — only real logged-in users may trigger matching.
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Service role key lives only in server-side env — never sent to the browser.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'Matching service not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local.' },
      { status: 500 }
    )
  }

  // Service role client bypasses RLS — runs run_matching() as the postgres role.
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  )

  const { error } = await serviceClient.rpc('run_matching')
  if (error) {
    return NextResponse.json({ error: 'Matching failed.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
