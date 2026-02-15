import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, signToken, tokenNeedsRefresh, AUTH_COOKIE_NAME, TOKEN_EXPIRY_DAYS } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page, auth API routes, scrape API, shopify API, and static assets
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/scrape') ||
    pathname.startsWith('/api/shopify') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.set(AUTH_COOKIE_NAME, '', { maxAge: 0, path: '/' })
    return response
  }

  // Auto-refresh token if it's close to expiry (within 7 days)
  if (tokenNeedsRefresh(payload)) {
    try {
      const newToken = await signToken({ authenticated: true }, TOKEN_EXPIRY_DAYS)
      const response = NextResponse.next()
      response.cookies.set(AUTH_COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
        path: '/',
      })
      return response
    } catch {
      // If refresh fails, continue with existing token
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
