import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

// Create Supabase client with proper configuration
export function createSupabaseClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: {
    auth?: {
      autoRefreshToken?: boolean
      persistSession?: boolean
    }
    db?: {
      schema?: string
    }
    global?: {
      headers?: Record<string, string>
    }
  }
) {
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      ...options?.auth
    },
    db: {
      schema: 'public',
      ...options?.db
    } as any,
    global: {
      headers: {
        'x-client-info': 'choirdinated',
        ...options?.global?.headers
      }
    }
  })
}

// Connection string builder for direct database access
export function buildConnectionString(
  host: string,
  port: number,
  database: string,
  username: string,
  password: string,
  options?: {
    sslmode?: 'require' | 'prefer' | 'disable'
    application_name?: string
  }
): string {
  const params = new URLSearchParams()
  
  if (options?.sslmode) {
    params.set('sslmode', options.sslmode)
  }
  
  if (options?.application_name) {
    params.set('application_name', options.application_name)
  }
  
  const query = params.toString()
  const queryString = query ? `?${query}` : ''
  
  return `postgresql://${username}:${password}@${host}:${port}/${database}${queryString}`
}

// Standard connection configurations
export const connectionConfigs = {
  // Transaction mode - recommended for migrations and batch operations
  transaction: (projectRef: string, password: string) => 
    buildConnectionString(
      `aws-0-eu-north-1.pooler.supabase.com`,
      6543,
      'postgres',
      `postgres.${projectRef}`,
      password,
      { sslmode: 'require', application_name: 'choirdinated' }
    ),
  
  // Session mode - for real-time and long-running connections  
  session: (projectRef: string, password: string) =>
    buildConnectionString(
      `aws-0-eu-north-1.pooler.supabase.com`, 
      5432,
      'postgres',
      `postgres.${projectRef}`,
      password,
      { sslmode: 'require', application_name: 'choirdinated' }
    )
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>