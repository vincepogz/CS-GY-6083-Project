# Neon Database Setup

## Prerequisites
1. Create a Neon account at https://neon.tech
2. Create a new project and database
3. Get your database connection string from the Neon dashboard

## Environment Variables
Update your `.env.local` file with your Neon database connection string:
```
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
```

You can find your connection string in the Neon dashboard under "Connection Details".

## Database Schema

Create the following tables in your Neon database. You can run these SQL commands in the Neon SQL Editor or any PostgreSQL client:

```sql
-- Account table
CREATE TABLE account (
  identity_pubguid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fname TEXT,
  lname TEXT,
  email TEXT UNIQUE NOT NULL,
  phone NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Identity table
CREATE TABLE identity (
  pubguid UUID REFERENCES account(identity_pubguid) ON DELETE CASCADE,
  prvguid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE demographics (
  pubguid UUID REFERENCES account(identity_pubguid) ON DELETE CASCADE,
  Street VARCHAR(20) NOT NULL,
  City VARCHAR(20) NOT NULL,
  State VARCHAR(2) NOT NULL,
  Zip VARCHAR(5) NOT NULL
);

-- Login table
CREATE TABLE login (
  uname TEXT PRIMARY KEY,
  pword TEXT NOT NULL,
  identity_prvguid UUID REFERENCES identity(prvguid) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Membership table
CREATE TABLE membership (
  mem_id INTEGER PRIMARY KEY,
  identity_pubguid UUID REFERENCES account(identity_pubguid) ON DELETE CASCADE,
  type TEXT NOT NULL,
  fee NUMERIC,
  balance NUMERIC,
  due DATE
);

-- Payable table for payment options
CREATE TABLE payable (
  mem_id INTEGER PRIMARY KEY REFERENCES membership(mem_id) ON DELETE CASCADE,
  card_primary BOOLEAN DEFAULT FALSE,
  card_info JSONB NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- Security table (for security questions)
CREATE TABLE security (
  pubguid UUID PRIMARY KEY REFERENCES account(identity_pubguid) ON DELETE CASCADE,
  q1 TEXT NOT NULL,  -- JSON string containing questions and hashed answers
  q2 TEXT,           -- Not used (set to null)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example JSON structure stored in q1:
-- {
--   "questions": [
--     {
--       "question": "What was the name of your first pet?",
--       "answer": "hashed_answer_with_pubguid_salt"
--     },
--     {
--       "question": "What city were you born in?",
--       "answer": "hashed_answer_with_pubguid_salt"
--     }
--   ]
-- }
```

## Testing

1. Install dependencies: `npm install`
2. Start your development server: `npm run dev`
3. Navigate to `/health` to test database connection and table existence
4. Navigate to `/signup` to test user registration with security questions
5. Navigate to `/login` to test user authentication

## Troubleshooting

If you get database errors:
1. Check that all tables exist in your Neon database
2. Verify the table column names match the schema above
3. Ensure your DATABASE_URL is correct and accessible
4. Check the browser console and server logs for detailed error messages

## Migration from Supabase

If you're migrating from Supabase:
1. Export your data from Supabase
2. Create the tables in Neon using the schema above
3. Import your data (you may need to adjust the data structure)
4. Update your environment variables
5. Test thoroughly

## Next Steps

- Review and adjust database indexes for performance
- Add password reset functionality
- Implement account recovery using security questions
- Add user profile management features

1. Start your development server: `npm run dev`
2. Navigate to `/health` to test database connection and table existence
3. Navigate to `/signup` to test user registration with security questions
4. Navigate to `/login` to test user authentication

## Troubleshooting

If you get database errors:
1. Check that all tables exist in your Supabase database
2. Verify the table column names match the schema above
3. Ensure Row Level Security policies allow the operations (or disable RLS for testing)
4. Check the browser console and server logs for detailed error messages

## Next Steps

- Review and adjust Row Level Security policies for production
- Add password reset functionality
- Implement account recovery using security questions
- Add user profile management features