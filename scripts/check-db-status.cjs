#!/usr/bin/env node

/**
 * Script to check the current database status
 * Usage: node scripts/check-db-status.cjs
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
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Checking database status...\n')
    
    // Check auth users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
    } else {
      console.log(`👥 Total Auth Users: ${users.users.length}`)
      users.users.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`)
      })
    }
    
    console.log('\n' + '─'.repeat(50) + '\n')
    
    // Check choirs table
    const { data: choirs, error: choirsError } = await supabase
      .from('choirs')
      .select('*')
      
    if (choirsError) {
      console.error('❌ Error fetching choirs:', choirsError.message)
    } else {
      console.log(`🎵 Total Choirs: ${choirs.length}`)
      choirs.forEach(choir => {
        console.log(`   - ${choir.name} (${choir.id})`)
      })
    }
    
    console.log('\n' + '─'.repeat(50) + '\n')
    
    // Check user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      
    if (profilesError) {
      console.error('❌ Error fetching user profiles:', profilesError.message)
    } else {
      console.log(`👤 Total User Profiles: ${profiles.length}`)
      profiles.forEach(profile => {
        console.log(`   - ${profile.name} (${profile.email}) - ${profile.id}`)
      })
    }
    
    console.log('\n' + '─'.repeat(50) + '\n')
    
    // Check members
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select(`
        *,
        user_profiles(name, email),
        choirs(name)
      `)
      
    if (membersError) {
      console.error('❌ Error fetching members:', membersError.message)
    } else {
      console.log(`🎪 Total Members: ${members.length}`)
      members.forEach(member => {
        console.log(`   - ${member.user_profiles?.name} (${member.user_profiles?.email}) in ${member.choirs?.name}`)
      })
    }
    
    if (members.length === 0 && users.users.length > 0) {
      console.log('\n⚠️  WARNING: There are auth users but no member records!')
      console.log('   This might cause import issues. Users need to complete choir onboarding.')
    }
    
  } catch (error) {
    console.error('💥 Database check failed:', error.message)
  }
}

checkDatabaseStatus()