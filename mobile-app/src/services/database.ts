import { createSupabaseClient } from '@choirdinated/database'
import Constants from 'expo-constants'

// Create Supabase client for mobile app
export const supabase = createSupabaseClient(
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL!,
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
)

// Re-export types from shared package
export type { Database, SupabaseClient } from '@choirdinated/database'