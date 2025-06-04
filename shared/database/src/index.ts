// Main exports for the database package
export * from './types'
export * from './client'

// Re-export commonly used Supabase types
export type { User, Session, AuthError } from '@supabase/supabase-js'