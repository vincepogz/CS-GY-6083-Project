import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJwt } from '@/lib/auth'
import { getMembershipsByUserPubguid, getPayablesByMemId, addPayable } from '@/lib/db-queries'

async function getAuthPayload() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyJwt(token)
}

export async function GET() {
  try {
    const payload = await getAuthPayload()
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const memberships = await getMembershipsByUserPubguid(payload.identityPubguid)
    if (memberships.length === 0) {
      return NextResponse.json({ success: true, cards: [] })
    }

    const memId = memberships[0].mem_id
    const cards = await getPayablesByMemId(memId)

    return NextResponse.json({ success: true, cards })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch payment options'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuthPayload()
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const cardData = typeof body.cardData === 'string' ? body.cardData : ''

    if (!cardData) {
      return NextResponse.json({ success: false, error: 'Card data required' }, { status: 400 })
    }

    const memberships = await getMembershipsByUserPubguid(payload.identityPubguid)
    if (memberships.length === 0) {
      return NextResponse.json({ success: false, error: 'No membership found' }, { status: 400 })
    }

    const memId = memberships[0].mem_id
    await addPayable(memId, cardData, payload.identityPubguid)

    const cards = await getPayablesByMemId(memId)
    return NextResponse.json({ success: true, cards })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add payment option'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}