import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  // Check if env vars exist and are not empty
  if (!supabaseUrl || supabaseUrl.trim() === '') {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing or empty')
    throw new Error(
      'Missing Supabase URL!\n' +
      'Please check your .env.local file and ensure you have:\n' +
      'NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co'
    )
  }

  if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty')
    throw new Error(
      'Missing Supabase API Key!\n' +
      'Please check your .env.local file and ensure you have:\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here'
    )
  }

  console.log('✅ Supabase client initialized')
  console.log(`🔗 URL: ${supabaseUrl.substring(0, 5)}...`)
  console.log(`🔑 Key: ${supabaseAnonKey.substring(0, 5)}...`)

  // Use .trim() to ensure no hidden whitespace is passed in headers
  const url = supabaseUrl.trim()
  const key = supabaseAnonKey.trim()

  return createBrowserClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: typeof window !== 'undefined' && globalThis.navigator?.onLine,
      detectSessionInUrl: true
    }
  })
}
