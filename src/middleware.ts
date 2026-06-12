import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // supabaseResponse must be initialized here and reassigned inside setAll.
  // Returning this object (not a bare NextResponse.next()) ensures any refreshed
  // session cookies written by setAll are forwarded to the browser.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write into request so server-side reads in this cycle see fresh tokens
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Reassign response carrying the updated request, then attach Set-Cookie headers
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the session against the Supabase Auth server.
  // If the access token is expired and a valid refresh token exists, the SDK
  // refreshes it automatically and calls setAll with the new tokens.
  // getSession() must NOT be used here — it reads local state only.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected routes — unauthenticated users are redirected to /anmelden
  const isProtected =
    pathname.startsWith('/onboarding') || pathname.startsWith('/profil')

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/anmelden'
    return NextResponse.redirect(url)
  }

  // Authenticated users visiting /anmelden are redirected to their profile
  if (user && pathname === '/anmelden') {
    const url = request.nextUrl.clone()
    url.pathname = '/profil/meine-wohnung'
    return NextResponse.redirect(url)
  }

  // Always return supabaseResponse to preserve any Set-Cookie headers written above
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Run middleware on all paths except:
     * - _next/static  (Next.js build assets)
     * - _next/image   (Next.js image optimisation)
     * - favicon.ico
     * - Common static file extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
