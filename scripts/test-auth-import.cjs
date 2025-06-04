#!/usr/bin/env node

/**
 * Script to test the enhanced member import functionality
 * This tests creating auth users via Admin API
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

async function testAuthImport() {
  try {
    console.log('🧪 Testing enhanced member import functionality...\n')
    
    // Create a unique test email
    const testEmail = `test-auth-import-${Date.now()}@example.com`
    const testName = 'Auth Import Test User'
    
    console.log(`👤 Testing auth user creation for: ${testEmail}`)
    
    // Create auth user via Admin API (same as import process)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'temporary-password-' + Math.random().toString(36).slice(2),
      email_confirm: true,
      user_metadata: {
        name: testName,
        birth_date: '1990-01-01',
        phone: '+47 12345678',
        emergency_contact: 'Test Emergency Contact',
        emergency_phone: '+47 87654321',
        imported: true,
        imported_at: new Date().toISOString()
      }
    })
    
    if (authError || !authUser.user) {
      console.error('❌ Failed to create auth user:', authError?.message)
      return
    }
    
    console.log(`✅ Created auth user with ID: ${authUser.user.id}`)
    
    // Wait for trigger to create user profile
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Check if user profile was created by trigger
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single()
    
    if (profileError || !userProfile) {
      console.error('❌ User profile not created by trigger:', profileError?.message)
      return
    }
    
    console.log('✅ User profile created automatically by trigger:')
    console.log(`   - ID: ${userProfile.id}`)
    console.log(`   - Email: ${userProfile.email}`)
    console.log(`   - Name: ${userProfile.name}`)
    console.log(`   - Created: ${userProfile.created_at}`)
    
    // Test updating the profile (as the import would do)
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        birth_date: '1990-01-01',
        phone: '+47 12345678',
        emergency_contact: 'Test Emergency Contact',
        emergency_phone: '+47 87654321',
        is_active: true
      })
      .eq('id', authUser.user.id)
    
    if (updateError) {
      console.error('❌ Failed to update user profile:', updateError.message)
      return
    }
    
    console.log('✅ User profile updated with import data')
    
    // Verify the complete setup
    const { data: updatedProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single()
    
    if (updatedProfile) {
      console.log('\n🔍 Final profile verification:')
      console.log(`   - Birth Date: ${updatedProfile.birth_date}`)
      console.log(`   - Phone: ${updatedProfile.phone}`)
      console.log(`   - Emergency Contact: ${updatedProfile.emergency_contact}`)
      console.log(`   - Emergency Phone: ${updatedProfile.emergency_phone}`)
      console.log(`   - Active: ${updatedProfile.is_active}`)
    }
    
    console.log('\n🎉 Enhanced import test completed successfully!')
    console.log('✅ The import process can now create auth users and user profiles correctly')
    console.log('✅ Database triggers are working properly')
    console.log('✅ Profile updates work as expected')
    
    // Cleanup the test user
    console.log('\n🧹 Cleaning up test user...')
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.user.id)
    
    if (deleteError) {
      console.warn(`⚠️  Failed to delete test user: ${deleteError.message}`)
      console.log(`   Please manually delete user: ${authUser.user.id}`)
    } else {
      console.log('✅ Test user cleaned up successfully')
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }
}

testAuthImport()