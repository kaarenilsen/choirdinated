#!/usr/bin/env node

/**
 * Script to reset a user's password in Supabase Auth (CommonJS version)
 * Usage: node scripts/reset-user-password-simple.cjs <user-id> <new-password>
 * 
 * This script uses the Supabase Admin API to directly set a new password
 * for a user given their user ID.
 */

const { createClient } = require('@supabase/supabase-js')
const { config } = require('dotenv')
const path = require('path')

// Load environment variables from web-admin/.env.local
const envPath = path.join(__dirname, '../web-admin/.env.local')
config({ path: envPath })

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in web-admin/.env.local')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetUserPassword(userId, newPassword) {
  try {
    console.log(`🔄 Resetting password for user: ${userId}`)
    
    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID must be a non-empty string')
    }
    
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    // First, check if the user exists
    const { data: user, error: getUserError } = await supabase.auth.admin.getUserById(userId)
    
    if (getUserError) {
      throw new Error(`Failed to find user: ${getUserError.message}`)
    }
    
    if (!user) {
      throw new Error('User not found')
    }
    
    console.log(`👤 Found user: ${user.email}`)
    
    // Update the user's password
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    })
    
    if (error) {
      throw new Error(`Failed to update password: ${error.message}`)
    }
    
    console.log('✅ Password reset successfully!')
    console.log(`📧 User email: ${data.user.email}`)
    console.log(`🆔 User ID: ${data.user.id}`)
    console.log(`📅 Updated at: ${data.user.updated_at}`)
    
    return data.user
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message)
    throw error
  }
}

// Main script execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length !== 2) {
    console.log('📋 Usage: node scripts/reset-user-password-simple.cjs <user-id> <new-password>')
    console.log('')
    console.log('Examples:')
    console.log('  node scripts/reset-user-password-simple.cjs 123e4567-e89b-12d3-a456-426614174000 newpassword123')
    console.log('  node scripts/reset-user-password-simple.cjs user@example.com newpassword123')
    console.log('')
    console.log('⚠️  Note: If you provide an email instead of user ID, the script will look up the user first.')
    process.exit(1)
  }
  
  const [userIdentifier, newPassword] = args
  
  try {
    let userId = userIdentifier
    
    // Check if the identifier looks like an email (contains @)
    if (userIdentifier.includes('@')) {
      console.log(`🔍 Looking up user by email: ${userIdentifier}`)
      
      // Look up user by email
      const { data: users, error } = await supabase.auth.admin.listUsers()
      
      if (error) {
        throw new Error(`Failed to list users: ${error.message}`)
      }
      
      const user = users.users.find(u => u.email === userIdentifier)
      
      if (!user) {
        throw new Error(`No user found with email: ${userIdentifier}`)
      }
      
      userId = user.id
      console.log(`✅ Found user ID: ${userId}`)
    }
    
    await resetUserPassword(userId, newPassword)
    
  } catch (error) {
    console.error('💥 Script failed:', error.message)
    process.exit(1)
  }
}

// Run the script
main()