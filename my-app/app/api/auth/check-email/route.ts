import { checkEmailExists } from '@/lib/db-queries'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const exists = await checkEmailExists(email)

    return NextResponse.json({
      exists,
      error: null,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    console.error('Check email error:', error)
    
    return NextResponse.json(
      { error: errorMessage, exists: false },
      { status: 500 }
    )
  }
}
