import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJwt } from '@/lib/auth'
import { createMembership, getMembershipsByUserPubguid, removeMembershipByMemId } from '@/lib/db-queries'

async function getAuthPayload() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyJwt(token)
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuthPayload()
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const membershipType = typeof body.type === 'string' ? body.type : undefined

    if (!membershipType) {
      return NextResponse.json({ success: false, error: 'Membership type is required' }, { status: 400 })
    }

    const currentMemberships = await getMembershipsByUserPubguid(payload.identityPubguid)
    if (currentMemberships.length > 0) {
      return NextResponse.json({ success: false, error: 'A user may only have one membership' }, { status: 400 })
    }

    await createMembership(payload.identityPubguid, membershipType)
    const memberships = await getMembershipsByUserPubguid(payload.identityPubguid)

    return NextResponse.json({ success: true, memberships })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add membership'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await getAuthPayload()
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const memId = typeof body.mem_id === 'number' ? body.mem_id : undefined
    if (typeof memId !== 'number') {
      return NextResponse.json({ success: false, error: 'Membership mem_id is required' }, { status: 400 })
    }

    await removeMembershipByMemId(memId, payload.identityPubguid)
    const memberships = await getMembershipsByUserPubguid(payload.identityPubguid)

    return NextResponse.json({ success: true, memberships })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove membership'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
