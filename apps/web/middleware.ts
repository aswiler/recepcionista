import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard')
  const isOnLogin = req.nextUrl.pathname === '/login'
  const isOnOnboarding = req.nextUrl.pathname.startsWith('/onboarding')
  const isOnPublicPage = req.nextUrl.pathname === '/' || 
                         req.nextUrl.pathname === '/integrations' ||
                         req.nextUrl.pathname.startsWith('/api/')

  // Allow public pages
  if (isOnPublicPage) {
    return NextResponse.next()
  }

  // Allow onboarding without login (for now)
  if (isOnOnboarding) {
    return NextResponse.next()
  }

  // Redirect to dashboard if logged in and trying to access login
  if (isLoggedIn && isOnLogin) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Protect dashboard routes
  if (isOnDashboard && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Match all routes except static files and API routes that don't need auth
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
