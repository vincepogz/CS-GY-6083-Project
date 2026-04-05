import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/dbname'

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Helper function to check if database is properly configured
export const isDatabaseConfigured = () => {
  return process.env.DATABASE_URL &&
         !process.env.DATABASE_URL.includes('placeholder')
}

// For backward compatibility - you might want to keep this for now
export const supabase = null