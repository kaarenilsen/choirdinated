#!/usr/bin/env node

/**
 * Script to test the auth helper function
 * This helps debug the getCurrentUserChoirId function
 */

const { createClient } = require('@supabase/supabase-js')
const { config } = require('dotenv')
const path = require('path')

// Load environment variables
const envPath = path.join(__dirname, '../web-admin/.env.local')
config({ path: envPath })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAuthHelper() {
  try {
    console.log('🧪 Testing auth helper logic...\n')
    
    // Get the user we know exists
    const { data: users } = await supabase.auth.admin.listUsers()
    const testUser = users.users[0]
    
    if (!testUser) {
      console.log('❌ No users found in auth')
      return
    }
    
    console.log(`👤 Test user: ${testUser.email} (${testUser.id})`)
    
    // Check members table manually
    const { data: members, error } = await supabase
      .from('members')
      .select('choir_id, user_profile_id')
      .eq('user_profile_id', testUser.id)
    
    if (error) {
      console.error('❌ Error querying members:', error.message)
      return
    }
    
    console.log(`🎪 Member records found: ${members.length}`)
    if (members.length > 0) {
      console.log(`   - Choir ID: ${members[0].choir_id}`)
      console.log(`   - User Profile ID: ${members[0].user_profile_id}`)
    }
    
    // Test if the choir ID is a valid UUID
    if (members.length > 0) {
      const choirId = members[0].choir_id
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const isValidUuid = uuidRegex.test(choirId)
      
      console.log(`🔍 Choir ID validity: ${isValidUuid ? '✅ Valid UUID' : '❌ Invalid UUID'}`)
      
      if (!isValidUuid) {
        console.log(`⚠️  Invalid choir ID format: "${choirId}"`)
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }
}

testAuthHelper()