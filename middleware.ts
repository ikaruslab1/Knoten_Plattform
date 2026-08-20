import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Middleware Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing from environment variables.'
    )
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // IMPORTANT: Always use getUser() — validates JWT server-side
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Public routes (no auth needed)
    const publicRoutes = ['/login', '/register', '/confirm']
    const isPublicRoute = publicRoutes.some((r) => pathname.startsWith(r))

    // No user: redirect to login unless on a public route
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Authenticated user trying to access public/auth routes
    if (user && isPublicRoute && !pathname.startsWith('/confirm')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (!profile?.rol) {
        const url = request.nextUrl.clone()
        url.pathname = '/select-role'
        return NextResponse.redirect(url)
      }

      const url = request.nextUrl.clone()
      url.pathname = profile.rol === 'freelancer' ? '/freelancer/profile' : '/director/profile'
      return NextResponse.redirect(url)
    }

    // Authenticated user: enforce role-based route access
    if (user && !isPublicRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .single()

      // No role yet: only allow /select-role
      if (!profile?.rol && !pathname.startsWith('/select-role')) {
        const url = request.nextUrl.clone()
        url.pathname = '/select-role'
        return NextResponse.redirect(url)
      }

      // Has role but tries /select-role: go to dashboard
      if (profile?.rol && pathname.startsWith('/select-role')) {
        const url = request.nextUrl.clone()
        url.pathname = profile.rol === 'freelancer' ? '/freelancer/profile' : '/director/profile'
        return NextResponse.redirect(url)
      }

      // Cross-role access protection
      if (profile?.rol === 'freelancer' && pathname.startsWith('/director')) {
        const url = request.nextUrl.clone()
        url.pathname = '/freelancer/profile'
        return NextResponse.redirect(url)
      }

      if (profile?.rol === 'director' && pathname.startsWith('/freelancer')) {
        const url = request.nextUrl.clone()
        url.pathname = '/director/profile'
        return NextResponse.redirect(url)
      }
    }
  } catch (error) {
    console.error('Unhandled error in Middleware:', error)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
