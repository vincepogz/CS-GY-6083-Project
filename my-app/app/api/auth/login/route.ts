import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, getUserDataByEmail } from '@/lib/db-queries'
import { signJwt } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 })
    }

    await authenticateUser(email, password)
    const user = await getUserDataByEmail(email)
    const expiresInSeconds = 300
    const token = signJwt({
      email: user.email,
      identityPubguid: user.identityPubguid,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    })

    const response = NextResponse.json({ success: true, message: 'Login successful' }, { status: 200 })
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      maxAge: expiresInSeconds,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed'
    const status = errorMessage.includes('Invalid Username/Password') ? 401 : 500
    return NextResponse.json({ success: false, error: errorMessage }, { status })
  }
}
