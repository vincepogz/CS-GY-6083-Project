import { NextRequest, NextResponse } from 'next/server'
import {
  getUsersByEmail,
  updateUserByPubguid,
  deactivateUserByPubguid,
} from '@/lib/db-queries'

function requireAdminAuth(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === 'true'
}

export async function POST(req: NextRequest) {
  if (!requireAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const users = await getUsersByEmail(email)
    return NextResponse.json({ users, error: null })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  if (!requireAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { identityPubguid, fname, lname, phone } = await req.json()

    if (!identityPubguid || typeof identityPubguid !== 'string') {
      return NextResponse.json({ error: 'identityPubguid is required' }, { status: 400 })
    }

    const user = await updateUserByPubguid(identityPubguid, fname || '', lname || '', phone || '')
    return NextResponse.json({ user, error: null })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update user'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!requireAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const identityPubguid = req.nextUrl.searchParams.get('pubguid')

    if (!identityPubguid) {
      return NextResponse.json({ error: 'identityPubguid is required' }, { status: 400 })
    }

    await deactivateUserByPubguid(identityPubguid)
    return NextResponse.json({ success: true, error: null })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate user'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
