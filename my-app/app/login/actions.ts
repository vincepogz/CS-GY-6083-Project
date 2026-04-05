'use server'

import { authenticateUser } from '@/lib/db-queries'

export async function handleLogin(email: string, password: string) {
  try {
    const isAuthenticated = await authenticateUser(email, password)
    if (isAuthenticated) {
      return { success: true, error: null }
    }
    return { success: false, error: 'Invalid Username/Password' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return { success: false, error: errorMessage }
  }
}