import { NextRequest, NextResponse } from 'next/server'
import { signToken, AUTH_COOKIE_NAME, TOKEN_EXPIRY_DAYS } from '@/lib/auth'

const REMEMBER_ME_DAYS = 90

export async function POST(request: NextRequest) {
  try {
    const { password, rememberMe } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const correctPassword = process.env.AUTH_PASSWORD || 'Dxrk'

    if (password !== correctPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const expiryDays = rememberMe ? REMEMBER_ME_DAYS : TOKEN_EXPIRY_DAYS
    const token = await signToken({ authenticated: true, iat: Date.now() }, expiryDays)

    const response = NextResponse.json({ success: true })
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiryDays * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
