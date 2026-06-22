import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Local row types — no generated DB types in this project.
interface MatchRow {
  user_a_id:      string
  user_b_id:      string
  apartment_a_id: string
  apartment_b_id: string
  status_a:       string
  status_b:       string
}

interface PhotoRow {
  storage_path: string
  position:     number
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  // 1. Authenticate the caller via session cookie — never trust client-supplied identity.
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { matchId } = await params

  // 2. Service role client — bypasses RLS so we can read another user's apartment data.
  //    Key never leaves the server; never prefixed NEXT_PUBLIC_.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'Service not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local.' },
      { status: 500 }
    )
  }
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  )

  // 3. Fetch the match row with the authenticated client.
  //    The participant RLS policy (auth.uid() = user_a_id OR user_b_id) implicitly
  //    enforces participation — no row returned means not a participant.
  const { data: matchRaw } = await supabase
    .from('matches')
    .select('user_a_id, user_b_id, apartment_a_id, apartment_b_id, status_a, status_b')
    .eq('id', matchId)
    .single()

  const match = matchRaw as MatchRow | null

  // 4. Validate participant. Not-found and not-participant both return 403 to
  //    avoid leaking information about whether a match exists at all.
  if (!match || (match.user_a_id !== user.id && match.user_b_id !== user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 5. Caller must not have declined this match.
  const myStatus = match.user_a_id === user.id ? match.status_a : match.status_b
  if (myStatus === 'declined') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 6. Identify the other apartment — never returned to the client.
  const otherApartmentId = match.user_a_id === user.id
    ? match.apartment_b_id
    : match.apartment_a_id

  // 7. Fetch photo rows for the other apartment using the service role client.
  console.error('[match photos] lookup context', {
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    serviceKeyStartsWithEyJ: process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ') ?? false,
    matchId,
    otherApartmentId,
  })

  const { data: rowsRaw, error: photoErr } = await serviceClient
    .from('apartment_photos')
    .select('storage_path, position')
    .eq('apartment_id', otherApartmentId)
    .order('position', { ascending: true })

  if (photoErr) {
    console.error('[match photos] apartment_photos query failed', {
      code: photoErr.code,
      message: photoErr.message,
      details: photoErr.details,
      hint: photoErr.hint,
    })
    return NextResponse.json({ error: 'Photo lookup failed.' }, { status: 500 })
  }

  const rows = (rowsRaw as PhotoRow[] | null) ?? []

  if (rows.length === 0) {
    return NextResponse.json({ urls: [] })
  }

  // 8. Generate signed URLs server-side. The service role client can sign URLs for
  //    any file in the bucket. Signed URLs are valid for 1 hour; they contain no PII.
  //    storage_path is never sent to the client — only the opaque signed URL.
  const signed = await Promise.all(
    rows.map(row =>
      serviceClient.storage
        .from('apartment-photos')
        .createSignedUrl(row.storage_path, 3600)
    )
  )

  const urls: string[] = []
  for (const r of signed) {
    if (r.data?.signedUrl) urls.push(r.data.signedUrl)
  }

  return NextResponse.json({ urls })
}
