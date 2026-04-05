'use server'

import { completeSignup } from '@/lib/db-queries'

export async function handleSignup(
  email: string,
  fname: string,
  lname: string,
  phone: string,
  password: string
) {
  try {
    await completeSignup(email, fname, lname, phone, password)
    return { success: true, error: null }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return { success: false, error: errorMessage }
  }
}
