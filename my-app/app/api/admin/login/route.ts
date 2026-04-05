import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    const adminUsername = process.env.ADMIN_USERNAME
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Admin credentials are not configured.' },
        { status: 500 }
      )
    }

    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin username or password.' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ success: true, error: null })
    response.cookies.set('admin_auth', 'true', {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60,
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to authenticate admin'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
