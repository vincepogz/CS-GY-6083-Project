import { createHmac, timingSafeEqual } from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret'

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  return Buffer.from(padded, 'base64').toString('utf8')
}

export interface AuthTokenPayload {
  email: string
  identityPubguid: string
  exp: number
}

export function signJwt(payload: AuthTokenPayload) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64UrlEncode(JSON.stringify(payload))
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `${header}.${body}.${signature}`
}

export function verifyJwt(token: string): AuthTokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const [header, body, signature] = parts
    const expected = createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const actual = Buffer.from(signature, 'utf8')
    const expectedBuf = Buffer.from(expected, 'utf8')
    if (actual.length !== expectedBuf.length || !timingSafeEqual(actual, expectedBuf)) {
      return null
    }

    const payload = JSON.parse(base64UrlDecode(body)) as AuthTokenPayload
    if (typeof payload.exp !== 'number' || Date.now() / 1000 >= payload.exp) {
      return null
    }

    return payload
  } catch {
    return null
  }
}
