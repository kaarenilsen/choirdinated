import { createSupabaseClient, connectionConfigs } from '@choirdinated/database'

// Create Supabase client for web admin
export const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
)

// Database connection for server-side operations (migrations, etc.)
export const databaseUrl = connectionConfigs.transaction(
  'uabjpfgamdkctrvfwnuq',
  process.env.DB_PASSWORD || 'z9iKTuNgXwYT2ivwZx9C'
)

// Re-export types from shared package
export type { Database, SupabaseClient } from '@choirdinated/database'