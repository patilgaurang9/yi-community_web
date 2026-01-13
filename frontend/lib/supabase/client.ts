import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
  console.log('URL:', supabaseUrl.substring(0, 30) + '...')
  console.log('Key:', supabaseAnonKey.substring(0, 20) + '...')

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
