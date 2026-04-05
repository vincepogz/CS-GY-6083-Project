'use server'

import { initialSignup, completeSignupWithSecurity } from '@/lib/db-queries'

export async function handleInitialSignup(
  email: string,
  fname: string,
  lname: string,
  phone: string
) {
  try {
    const pubguid = await initialSignup(email, fname, lname, phone)
    return { success: true, pubguid, error: null }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return { success: false, pubguid: null, error: errorMessage }
  }
}

export async function handleCompleteSignup(
  pubguid: string,
  email: string,
  password: string,
  question1: string,
  answer1: string,
  question2: string,
  answer2: string
) {
  try {
    await completeSignupWithSecurity(pubguid, email, password, question1, answer1, question2, answer2)
    return { success: true, error: null }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return { success: false, error: errorMessage }
  }
}
