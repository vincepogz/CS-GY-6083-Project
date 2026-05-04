import { pool } from './supabase'
import { createHash, randomInt } from 'crypto'

/**
 * Check if an email already exists in the account table
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT a.email
       FROM account a
       JOIN identity i ON a.identity_pubguid = i.pubguid
       WHERE a.email = $1
         AND i.active = true
       LIMIT 1`,
      [email]
    )

    return result.rows.length > 0
  } catch (error) {
    throw new Error(`Failed to check email existence: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export interface Demographics {
  street: string
  city: string
  state: string
  zip: string
}

export interface UserData {
  fname: string
  lname: string
  email: string
  phone: string | null
  identityPubguid: string
  active: boolean
  loginExists: boolean
  demographics: Demographics
  securityQuestions: Array<{ question: string }>
}

export async function getUsersByEmail(email: string): Promise<UserData[]> {
  try {
    const result = await pool.query(
      `SELECT a.fname, a.lname, a.email, a.phone, a.identity_pubguid, i.active, l.uname IS NOT NULL AS login_exists, s.q1
       FROM account a
       LEFT JOIN identity i ON a.identity_pubguid = i.pubguid
       LEFT JOIN login l ON l.uname = a.email
       LEFT JOIN security s ON s.pubguid = a.identity_pubguid
       LEFT JOIN demographics d ON d.pubguid = a.identity_pubguid
       WHERE a.email = $1
       ORDER BY i.active DESC, a.identity_pubguid`,
      [email]
    )

    if (result.rows.length === 0) {
      throw new Error('No user found for the provided email')
    }

    return result.rows.map((row) => {
      const q1Data = typeof row.q1 === 'string' ? JSON.parse(row.q1) : row.q1
      const securityQuestions = q1Data?.questions?.map((q: any) => ({ question: q.question })) || []

      return {
        fname: row.fname,
        lname: row.lname,
        email: row.email,
        phone: row.phone,
        identityPubguid: row.identity_pubguid,
        active: row.active,
        loginExists: row.login_exists,
        demographics: {
          street: row.street,
          city: row.city,
          state: row.state,
          zip: row.zip,
        },
        securityQuestions,
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch user data: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function getUserDataByEmail(email: string): Promise<UserData> {
  const users = await getUsersByEmail(email)
  return users[0]
}

export async function updateUserByPubguid(
  identityPubguid: string,
  fname: string,
  lname: string,
  phone: string,
): Promise<UserData> {
  try {
    const updateResult = await pool.query(
      `UPDATE account
       SET fname = COALESCE(NULLIF($1, ''), fname),
           lname = COALESCE(NULLIF($2, ''), lname),
           phone = COALESCE(NULLIF($3, ''), phone)
       WHERE identity_pubguid = $4
       RETURNING email`,
      [fname, lname, phone, identityPubguid]
    )

    if (updateResult.rows.length === 0) {
      throw new Error('No user found for the provided identity pubguid')
    }

    const updated = await pool.query(
      `SELECT a.fname, a.lname, a.email, a.phone, a.identity_pubguid, i.active, l.uname IS NOT NULL AS login_exists, s.q1,
              d.Street, d.City, d.State, d.Zip
       FROM account a
       LEFT JOIN identity i ON a.identity_pubguid = i.pubguid
       LEFT JOIN login l ON l.uname = a.email
       LEFT JOIN security s ON s.pubguid = a.identity_pubguid
       LEFT JOIN demographics d ON d.pubguid = a.identity_pubguid
       WHERE a.identity_pubguid = $1`,
      [identityPubguid]
    )

    if (updated.rows.length === 0) {
      throw new Error('Failed to fetch updated user data')
    }

    const row = updated.rows[0]
    const q1Data = typeof row.q1 === 'string' ? JSON.parse(row.q1) : row.q1
    const securityQuestions = q1Data?.questions?.map((q: any) => ({ question: q.question })) || []

    return {
      fname: row.fname,
      lname: row.lname,
      email: row.email,
      phone: row.phone,
      identityPubguid: row.identity_pubguid,
      active: row.active,
      loginExists: row.login_exists,
      demographics: {
        street: row.street,
        city: row.city,
        state: row.state,
        zip: row.zip,
      },
      securityQuestions,
    }
  } catch (error) {
    throw new Error(`Failed to update user data: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function upsertDemographicsByPubguid(
  identityPubguid: string,
  street: string,
  city: string,
  state: string,
  zip: string,
): Promise<Demographics> {
  try {
    const result = await pool.query(
      `INSERT INTO demographics (pubguid, street, city, state, zip)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (pubguid)
       DO UPDATE SET
         street = $2,
         city = $3,
         state = $4,
         zip = $5
       RETURNING street, city, state, zip`,
      [identityPubguid, street, city, state, zip]
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to update demographics')
    }

    return {
      street: row.street,
      city: row.city,
      state: row.state,
      zip: row.zip,
    }
  } catch (error) {
    throw new Error(`Failed to upsert demographics: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function deactivateUserByPubguid(identityPubguid: string): Promise<void> {
  try {
    const result = await pool.query(
      `UPDATE identity
       SET active = false
       WHERE pubguid = $1
       RETURNING prvguid`,
      [identityPubguid]
    )

    if (result.rows.length === 0) {
      throw new Error('No user found for the provided identity pubguid')
    }
  } catch (error) {
    throw new Error(`Failed to deactivate user: ${error instanceof Error ? error.message : String(error)}`)
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
    const result = await pool.query(
      'INSERT INTO account (fname, lname, email, phone) VALUES ($1, $2, $3, $4) RETURNING identity_pubguid',
      [fname, lname, email, phone || null]
    )

    if (!result.rows[0] || !result.rows[0].identity_pubguid) {
      throw new Error('Failed to retrieve identity_pubguid from account creation')
    }

    return result.rows[0].identity_pubguid
  } catch (error) {
    throw new Error(`Failed to create account: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Create a new identity entry with the given pubguid
 * Sets active to the provided value and returns the prvguid
 */
export async function createIdentity(pubguid: string, active: boolean = true): Promise<string> {
  try {
    const result = await pool.query(
      'INSERT INTO identity (pubguid, active) VALUES ($1, $2) RETURNING prvguid',
      [pubguid, active]
    )

    if (!result.rows[0] || !result.rows[0].prvguid) {
      throw new Error('Failed to retrieve prvguid from identity creation')
    }

    return result.rows[0].prvguid
  } catch (error) {
    throw new Error(`Failed to create identity: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Initial signup process:
 * 1. Check if email exists
 * 2. Create account entry
 * 3. Create identity entry with active=false
 * Returns the pubguid
 */
export async function initialSignup(
  email: string,
  fname: string,
  lname: string,
  phone: string
): Promise<string> {
  try {
    // Step 1: Check if email already exists
    const emailExists = await checkEmailExists(email)
    if (emailExists) {
      throw new Error('The user already exist')
    }

    // Step 2: Create account and get pubguid
    const pubguid = await createAccount(fname, lname, email, phone)

    // Step 3: Create identity with active=false
    await createIdentity(pubguid, false)

    return pubguid
  } catch (error) {
    throw error
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

    await pool.query(
      'INSERT INTO login (uname, pword, identity_prvguid) VALUES ($1, $2, $3)',
      [email, hashedPassword, prvguid]
    )
  } catch (error) {
    throw new Error(`Failed to create login entry: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Complete signup process after security questions:
 * 1. Create security entry
 * 2. Activate identity
 * 3. Create login entry with hashed password
 */
export async function completeSignupWithSecurity(
  pubguid: string,
  email: string,
  password: string,
  question1: string,
  answer1: string,
  question2: string,
  answer2: string
): Promise<void> {
  try {
    // Step 1: Create security entry
    await createSecurity(pubguid, question1, answer1, question2, answer2)

    // Step 2: Activate identity
    await activateIdentity(pubguid)

    // Step 3: Get prvguid from identity
    const identityResult = await pool.query(
      'SELECT prvguid FROM identity WHERE pubguid = $1',
      [pubguid]
    )

    if (!identityResult.rows[0]) {
      throw new Error('Failed to retrieve prvguid')
    }

    const prvguid = identityResult.rows[0].prvguid

    // Step 4: Create login entry with hashed password
    await createLogin(email, password, prvguid)
  } catch (error) {
    throw error
  }
}

/**
 * Create a security entry with questions and hashed answers as JSON
 * Uses identity_pubguid as SALT and generates SHA256 hash of answers
 */
export async function createSecurity(
  pubguid: string,
  question1: string,
  answer1: string,
  question2: string,
  answer2: string
): Promise<void> {
  try {
    // Generate SHA256 hash for answer1 using pubguid as salt
    const hash1 = createHash('sha256')
    hash1.update(answer1 + pubguid)
    const hashedAnswer1 = hash1.digest('hex')

    // Generate SHA256 hash for answer2 using pubguid as salt
    const hash2 = createHash('sha256')
    hash2.update(answer2 + pubguid)
    const hashedAnswer2 = hash2.digest('hex')

    // Create JSON object with questions and hashed answers
    const securityData = {
      questions: [
        {
          question: question1,
          answer: hashedAnswer1
        },
        {
          question: question2,
          answer: hashedAnswer2
        }
      ]
    }

    await pool.query(
      'INSERT INTO security (pubguid, q1) VALUES ($1, $2)',
      [pubguid, JSON.stringify(securityData)]
    )
  } catch (error) {
    throw new Error(`Failed to create security entry: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Activate identity after security questions are answered
 */
export async function activateIdentity(pubguid: string): Promise<void> {
  try {
    await pool.query(
      'UPDATE identity SET active = true WHERE pubguid = $1',
      [pubguid]
    )
  } catch (error) {
    throw new Error(`Failed to activate identity: ${error instanceof Error ? error.message : String(error)}`)
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
    // Step 1: Find active identity record for the given email
    const identityResult = await pool.query(
      `SELECT i.prvguid
       FROM account a
       JOIN identity i ON a.identity_pubguid = i.pubguid
       WHERE a.email = $1
         AND i.active = true
       LIMIT 1`,
      [email]
    )

    if (identityResult.rows.length === 0) {
      throw new Error('Invalid Username/Password')
    }

    const prvguid = identityResult.rows[0].prvguid

    // Step 3: Generate SHA256 hash using password + prvguid as salt
    const hash = createHash('sha256')
    hash.update(password + prvguid)
    const hashedPassword = hash.digest('hex')

    // Step 4: Check if hash matches login table pword and email matches
    const loginResult = await pool.query(
      'SELECT pword FROM login WHERE uname = $1 AND pword = $2',
      [email, hashedPassword]
    )

    if (loginResult.rows.length === 0) {
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

/**
 * Get security questions for password reset
 * Returns pubguid and security questions from security table
 */
export async function getSecurityQuestionsForReset(email: string): Promise<{ pubguid: string; questions: any }> {
  try {
    // Step 1: Get active pubguid from account/identity for the email
    const accountResult = await pool.query(
      `SELECT i.pubguid
       FROM account a
       JOIN identity i ON a.identity_pubguid = i.pubguid
       WHERE a.email = $1
         AND i.active = true
       LIMIT 1`,
      [email]
    )

    if (accountResult.rows.length === 0) {
      throw new Error('Invalid email address')
    }

    const pubguid = accountResult.rows[0].pubguid

    // Step 2: Get security questions from security table
    const securityResult = await pool.query(
      'SELECT q1 FROM security WHERE pubguid = $1',
      [pubguid]
    )

    if (securityResult.rows.length === 0) {
      throw new Error('Invalid email address')
    }

    const q1Data = securityResult.rows[0].q1

    return {
      pubguid,
      questions: q1Data
    }
  } catch (error) {
    throw error
  }
}

/**
 * Validate security answers for password reset
 * Compares hashed answers with stored hashes
 */
export async function validateSecurityAnswers(
  pubguid: string,
  answer1: string,
  answer2: string
): Promise<boolean> {
  try {
    // Get stored security data
    const securityResult = await pool.query(
      'SELECT q1 FROM security WHERE pubguid = $1',
      [pubguid]
    )

    if (securityResult.rows.length === 0) {
      throw new Error('Invalid email address')
    }

    const q1Data = securityResult.rows[0].q1
    const storedQuestions = q1Data.questions

    // Hash the provided answers using pubguid as salt
    const hash1 = createHash('sha256')
    hash1.update(answer1 + pubguid)
    const hashedAnswer1 = hash1.digest('hex')

    const hash2 = createHash('sha256')
    hash2.update(answer2 + pubguid)
    const hashedAnswer2 = hash2.digest('hex')

    // Compare with stored hashes
    const answer1Match = storedQuestions[0].answer === hashedAnswer1
    const answer2Match = storedQuestions[1].answer === hashedAnswer2

    if (!answer1Match || !answer2Match) {
      throw new Error('Security question validation failed')
    }

    return true
  } catch (error) {
    throw error
  }
}

/**
 * Update password for password reset
 * Uses prvguid as SALT and generates SHA256 hash of new password
 */
export async function updatePassword(email: string, newPassword: string): Promise<void> {
  try {
    // Step 1: Get active pubguid from account/identity for the email
    const accountResult = await pool.query(
      `SELECT i.pubguid
       FROM account a
       JOIN identity i ON a.identity_pubguid = i.pubguid
       WHERE a.email = $1
         AND i.active = true
       LIMIT 1`,
      [email]
    )

    if (accountResult.rows.length === 0) {
      throw new Error('Invalid email address')
    }

    const pubguid = accountResult.rows[0].pubguid

    // Step 2: Get prvguid from identity table
    const identityResult = await pool.query(
      'SELECT prvguid FROM identity WHERE pubguid = $1',
      [pubguid]
    )

    if (identityResult.rows.length === 0) {
      throw new Error('Invalid email address')
    }

    const prvguid = identityResult.rows[0].prvguid

    // Step 3: Hash the new password
    const hash = createHash('sha256')
    hash.update(newPassword + prvguid)
    const hashedPassword = hash.digest('hex')

    // Step 4: Update the password in login table
    await pool.query(
      'UPDATE login SET pword = $1 WHERE identity_prvguid = $2',
      [hashedPassword, prvguid]
    )
  } catch (error) {
    throw error
  }
}

export interface MembershipRow {
  mem_id: number
  type: string
  fee: number
  balance: number
  due: string | null
}

const membershipFees: Record<string, number> = {
  Free: 0,
  Member: 5.99,
  Premium: 25.99,
}

function normalizeMembershipType(membershipType: string) {
  const normalized = membershipType.trim()
  if (!Object.prototype.hasOwnProperty.call(membershipFees, normalized)) {
    throw new Error('Invalid membership type')
  }
  return normalized
}

function generateMembershipId(): number {
  return randomInt(10000000, 100000000)
}

export async function getMembershipsByUserPubguid(userPubguid: string): Promise<MembershipRow[]> {
  try {
    const result = await pool.query(
      'SELECT mem_id, identity_pubguid, type, fee, balance, due FROM membership WHERE identity_pubguid = $1',
      [userPubguid]
    )

    return result.rows.map((row) => ({
      mem_id: row.mem_id,
      type: row.type,
      fee: parseFloat(row.fee) || 0,
      balance: parseFloat(row.balance) || 0,
      due: row.due,
    }))
  } catch (error) {
    throw new Error(`Failed to fetch memberships: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function createMembership(userPubguid: string, membershipType: string): Promise<MembershipRow> {
  try {
    const existing = await getMembershipsByUserPubguid(userPubguid)
    if (existing.length > 0) {
      throw new Error('A user may only have one membership')
    }

    const normalizedType = normalizeMembershipType(membershipType)
    let mem_id = generateMembershipId()
    let attempts = 0

    while (attempts < 5) {
      try {
        const fee = membershipFees[normalizedType]
        const result = await pool.query(
          'INSERT INTO membership (mem_id, identity_pubguid, type, fee, balance, due) VALUES ($1, $2, $3, $4, 0, NULL) RETURNING mem_id',
          [mem_id, userPubguid, normalizedType, fee]
        )

        const returnedId = result.rows[0]?.mem_id
        if (!returnedId) {
          throw new Error('Failed to add membership')
        }

        return {
          mem_id: returnedId,
          type: normalizedType,
          fee,
          balance: 0,
          due: null,
        }
      } catch (error) {
        if (error instanceof Error && 'code' in error && (error as any).code === '23505') {
          mem_id = generateMembershipId()
          attempts += 1
          continue
        }
        throw error
      }
    }

    throw new Error('Failed to generate a unique membership id')
  } catch (error) {
    throw new Error(`Failed to create membership: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function removeMembershipByMemId(memId: number, userPubguid: string): Promise<void> {
  try {
    const result = await pool.query(
      'DELETE FROM membership WHERE mem_id = $1 AND identity_pubguid = $2',
      [memId, userPubguid]
    )

    if (result.rowCount === 0) {
      throw new Error('Membership row not found')
    }
  } catch (error) {
    throw new Error(`Failed to remove membership: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export interface PayableRow {
  mem_id: number
  card_primary: boolean
  card_info: any
  active: boolean
}

export async function getPrivGuidByPubGuid(pubguid: string): Promise<string> {
  try {
    const result = await pool.query(
      'SELECT prvguid FROM identity WHERE pubguid = $1',
      [pubguid]
    )

    if (result.rows.length === 0) {
      throw new Error('Identity not found')
    }

    return result.rows[0].prvguid
  } catch (error) {
    throw new Error(`Failed to get priv_guid: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function getPayablesByMemId(memId: number): Promise<PayableRow[]> {
  try {
    const result = await pool.query(
      'SELECT mem_id, card_primary, card_info, active FROM payable WHERE mem_id = $1 AND active = true',
      [memId]
    )

    return result.rows.map((row) => ({
      mem_id: row.mem_id,
      card_primary: row.card_primary,
      card_info: typeof row.card_info === 'string' ? JSON.parse(row.card_info) : row.card_info,
      active: row.active,
    }))
  } catch (error) {
    throw new Error(`Failed to fetch payables: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function addPayable(memId: number, cardNumber: string, securityCode: string, expiration: string, pubguid: string): Promise<void> {
  try {
    const prvguid = await getPrivGuidByPubGuid(pubguid)
    const hash = createHash('sha256')
    hash.update(cardNumber + securityCode + expiration + prvguid)
    const hashedCard = hash.digest('hex')
    const last4 = cardNumber.slice(-4)
    const cardInfo = JSON.stringify({ hash: hashedCard, last4, expiration })

    await pool.query(
      `INSERT INTO payable (mem_id, card_primary, card_info, active)
       VALUES ($1, true, $2, true)
       ON CONFLICT (mem_id)
       DO UPDATE SET card_primary = true, card_info = $2, active = true`,
      [memId, cardInfo]
    )
  } catch (error) {
    throw new Error(`Failed to add payable: ${error instanceof Error ? error.message : String(error)}`)
  }
}

