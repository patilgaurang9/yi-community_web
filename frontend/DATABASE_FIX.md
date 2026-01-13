# Fix Database Error: "Database error saving new user"

## The Problem
You're getting a 500 error: `"Database error saving new user"` when signing up. This is likely caused by a database trigger that runs when a new user is created in `auth.users`.

## Root Cause
Supabase has a database trigger (probably in your `profiles` table) that automatically creates a profile row when a user signs up. This trigger is failing, which causes the entire signup to fail.

## Solution Options

### Option 1: Fix the Database Trigger (Recommended)

Go to your Supabase Dashboard → SQL Editor and run this to check/fix the trigger:

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname LIKE '%profile%';

-- View the trigger function
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';

-- If the trigger is failing, you can temporarily disable it:
-- ALTER TABLE auth.users DISABLE TRIGGER handle_new_user;
```

**Better Fix:** Update the trigger function to handle errors gracefully:

```sql
-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_profile_complete, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Option 2: Disable the Trigger Temporarily

If you want to handle profile creation in your app code (which we're now doing):

```sql
-- Disable the automatic trigger
ALTER TABLE auth.users DISABLE TRIGGER handle_new_user;
```

Then the app will create profiles manually after signup.

### Option 3: Check Required Fields

The trigger might be failing because `profiles` table has required fields that aren't being set. Check your table schema:

```sql
-- Check profiles table constraints
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

Make sure all NOT NULL fields have defaults or are being set by the trigger.

## Current Workaround

The code now:
1. ✅ Detects database errors during signup
2. ✅ Checks if user was created despite the error
3. ✅ Manually creates profile row if user exists
4. ✅ Handles both success and error cases

Try signing up again - it should work even if the trigger fails!

## Verify Fix

After fixing, test signup:
1. Sign up with a new email
2. Check browser console for logs
3. Check Supabase Dashboard → Authentication → Users
4. Check Supabase Dashboard → Table Editor → profiles

If you see the user in auth.users but not in profiles, the trigger is still failing and you should use Option 2 (disable trigger).
