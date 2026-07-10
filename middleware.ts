import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isAdmin = pathname.startsWith('/admin')
  const isDashboard = pathname.startsWith('/dashboard')
  if (!isAdmin && !isDashboard) return NextResponse.next()

  // Allow the unauthenticated entry points through
  if (pathname === '/admin/login' || pathname === '/login-company') return NextResponse.next()

  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (isAdmin) {
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    return res
  }

  // /dashboard/*: any signed-in Supabase session may pass — the (authenticated) layout
  // resolves the session to a company_users row/role and redirects further if there's no match.
  if (!user) {
    return NextResponse.redirect(new URL('/login-company', req.url))
  }
  return res
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
}
