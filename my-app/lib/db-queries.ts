import { supabase } from './supabase'
import { createHash } from 'crypto'

/**
 * Check if an email already exists in the account table
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('account')
      .select('email')
      .eq('email', email)
      .limit(1)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return data && data.length > 0
  } catch (error) {
    throw new Error(`Failed to check email existence: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Create a new account entry with fname, lname, phone
 * Returns the auto-generated pubguid (UUID)
 */
export async function createAccount(
  fname: string,
  lname: string,
  email: string,
  phone: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('account')
      .insert({
        fname: fname,
        lname: lname,
        email: email,
        phone: phone || null
      })
      .select('identity_pubguid')
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data || !data.identity_pubguid) {
      throw new Error('Failed to retrieve identity_pubguid from account creation')
    }

    return data.identity_pubguid
  } catch (error) {
    throw new Error(`Failed to create account: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Create a new identity entry with the given pubguid
 * Sets active to TRUE and returns the prvguid
 */
export async function createIdentity(pubguid: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('identity')
      .insert({
        pubguid,
        active: true,
      })
      .select('prvguid')
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data || !data.prvguid) {
      throw new Error('Failed to retrieve prvguid from identity creation')
    }

    return data.prvguid
  } catch (error) {
    throw new Error(`Failed to create identity: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Create a login entry with hashed password
 * Uses prvguid as SALT and generates SHA256 hash of password
 * Sets uname to email and identity_prvguid to prvguid
 */
export async function createLogin(
  email: string,
  password: string,
  prvguid: string
): Promise<void> {
  try {
    // Generate SHA256 hash using prvguid as salt
    const hash = createHash('sha256')
    hash.update(password + prvguid) // Concatenate password with salt
    const hashedPassword = hash.digest('hex')

    const { error } = await supabase
      .from('login')
      .insert({
        uname: email,
        pword: hashedPassword,
        identity_prvguid: prvguid,
      })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
  } catch (error) {
    throw new Error(`Failed to create login entry: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Complete signup process:
 * 1. Check if email exists
 * 2. Create account entry
 * 3. Create identity entry
 * 4. Create login entry with hashed password
 */
export async function completeSignup(
  email: string,
  fname: string,
  lname: string,
  phone: string,
  password: string
): Promise<void> {
  try {
    // Step 1: Check if email already exists
    const emailExists = await checkEmailExists(email)
    if (emailExists) {
      throw new Error('The user already exist')
    }

    // Step 2: Create account and get pubguid
    const pubguid = await createAccount(fname, lname, email, phone)

    // Step 3: Create identity and get prvguid
    const prvguid = await createIdentity(pubguid)

    // Step 4: Create login entry with hashed password
    await createLogin(email, password, prvguid)
  } catch (error) {
    throw error
  }
}

/**
 * Authenticate user login:
 * 1. Check if email exists in account table
 * 2. Get identity_pubguid from account table
 * 3. Find active identity record and get prvguid
 * 4. Generate SHA256 hash using password + prvguid as salt
 * 5. Verify hash matches login table pword and email matches
 */
export async function authenticateUser(email: string, password: string): Promise<boolean> {
  try {
    // Step 1: Check if email exists in account table and get identity_pubguid
    const { data: accountData, error: accountError } = await supabase
      .from('account')
      .select('identity_pubguid')
      .eq('email', email)
      .single()

    if (accountError || !accountData) {
      throw new Error('Invalid Username/Password')
    }

    const pubguid = accountData.identity_pubguid

    // Step 2: Find active identity record and get prvguid
    const { data: identityData, error: identityError } = await supabase
      .from('identity')
      .select('prvguid')
      .eq('pubguid', pubguid)
      .eq('active', true)
      .single()

    if (identityError || !identityData) {
      throw new Error('Invalid Username/Password')
    }

    const prvguid = identityData.prvguid

    // Step 3: Generate SHA256 hash using password + prvguid as salt
    const hash = createHash('sha256')
    hash.update(password + prvguid)
    const hashedPassword = hash.digest('hex')

    // Step 4: Check if hash matches login table pword and email matches
    const { data: loginData, error: loginError } = await supabase
      .from('login')
      .select('pword')
      .eq('uname', email)
      .eq('pword', hashedPassword)
      .single()

    if (loginError || !loginData) {
      throw new Error('Invalid Username/Password')
    }

    return true
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid Username/Password') {
      throw error
    }
    throw new Error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}
