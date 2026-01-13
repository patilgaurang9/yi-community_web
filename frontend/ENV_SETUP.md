# Environment Variables Setup

## The Error
```
{"message":"No API key found in request","hint":"No `apikey` request header or url param was found."}
```

This means your Supabase API key is not being loaded.

## Solution

### 1. Create `.env.local` file in the root directory

Create a file named `.env.local` (not `.env`) in the root of your project:

```
C:\Users\gaura\Desktop\yi_web\.env.local
```

### 2. Add your Supabase credentials

Get these from your Supabase project dashboard: https://app.supabase.com/project/_/settings/api

```env
NEXT_PUBLIC_SUPABASE_URL=https://lsegbzcqmispppcvload.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:**
- Use `.env.local` (Next.js automatically loads this)
- The `NEXT_PUBLIC_` prefix is required for client-side access
- Never commit `.env.local` to git (it's already in `.gitignore`)

### 3. Restart your dev server

After creating/updating `.env.local`:
1. Stop your dev server (Ctrl+C)
2. Run `npm run dev` again

Environment variables are only loaded when the server starts!

### 4. Verify it's working

Check the browser console when you try to sign up. You should see:
```
Supabase URL: ✅ Set
Supabase Key: ✅ Set
```

If you see "❌ Missing", the env vars aren't loaded.

## Quick Check

Run this in your terminal to verify:
```bash
# Windows PowerShell
Get-Content .env.local

# Should show your Supabase URL and Key
```
