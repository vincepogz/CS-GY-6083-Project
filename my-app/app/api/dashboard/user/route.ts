import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJwt } from '@/lib/auth'
import { getUserDataByEmail, updateUserByPubguid, upsertDemographicsByPubguid } from '@/lib/db-queries'

async function getAuthPayload() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyJwt(token)
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await getAuthPayload()
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const fname = typeof body.fname === 'string' ? body.fname : ''
    const lname = typeof body.lname === 'string' ? body.lname : ''
    const phone = typeof body.phone === 'string' ? body.phone : ''
    const street = typeof body.street === 'string' ? body.street : ''
    const city = typeof body.city === 'string' ? body.city : ''
    const state = typeof body.state === 'string' ? body.state : ''
    const zip = typeof body.zip === 'string' ? body.zip : ''

    await updateUserByPubguid(payload.identityPubguid, fname, lname, phone)
    await upsertDemographicsByPubguid(payload.identityPubguid, street, city, state, zip)

    const user = await getUserDataByEmail(payload.email)
    return NextResponse.json({ success: true, user })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update user'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
