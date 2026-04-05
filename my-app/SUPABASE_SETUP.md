# Supabase Database Setup

## Prerequisites
1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key from the project settings

## Environment Variables
Update your `.env.local` file with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

### Profiles Table
Create a `profiles` table to store user profile information:

```sql
-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  first_name text,
  last_name text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

-- Create policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, phone)
  values (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', new.raw_user_meta_data->>'phone');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Authentication Settings

In your Supabase dashboard:
1. Go to Authentication > Settings
2. Configure your site URL and redirect URLs
3. Enable email confirmations if desired
4. Set up SMTP settings for email delivery

## Testing

1. Start your development server: `npm run dev`
2. Navigate to `/signup` to test user registration
3. Navigate to `/login` to test user authentication
4. Check your Supabase dashboard to see new users and profiles

## Next Steps

- Add password reset functionality
- Implement email verification flow
- Add user profile management
- Set up additional database tables as needed for your application