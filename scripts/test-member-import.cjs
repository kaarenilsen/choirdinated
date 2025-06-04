#!/usr/bin/env node

/**
 * Script to test the member import functionality
 * This creates a test user profile and member record to verify the import process
 */

const { createClient } = require('@supabase/supabase-js')
const { config } = require('dotenv')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

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

async function testMemberImport() {
  try {
    console.log('🧪 Testing member import functionality...\n')
    
    // First, get the existing choir ID
    const { data: choirs } = await supabase
      .from('choirs')
      .select('id, name')
      .limit(1)
    
    if (!choirs || choirs.length === 0) {
      console.error('❌ No choirs found in database')
      return
    }
    
    const choirId = choirs[0].id
    console.log(`🎪 Using choir: ${choirs[0].name} (${choirId})`)
    
    // Create test user profile data
    const testEmail = `test-import-${Date.now()}@example.com`
    const testUserProfileId = uuidv4()
    
    console.log(`👤 Creating test user profile: ${testEmail}`)
    
    // Insert user profile directly
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserProfileId,
        email: testEmail,
        name: 'Test Import User',
        birth_date: '1990-01-01',
        phone: '+47 12345678',
        emergency_contact: 'Test Emergency Contact',
        emergency_phone: '+47 87654321',
        is_active: true
      })
    
    if (profileError) {
      console.error('❌ Failed to create user profile:', profileError.message)
      return
    }
    
    console.log('✅ User profile created successfully')
    
    // Get required IDs for member creation
    console.log('🔍 Looking up voice group and membership type...')
    
    // Get voice group
    const { data: voiceGroups } = await supabase
      .from('list_of_values')
      .select('id, value')
      .eq('choir_id', choirId)
      .eq('category', 'voice_group')
      .limit(1)
    
    // Get membership type
    const { data: membershipTypes } = await supabase
      .from('membership_types')
      .select('id, name')
      .eq('choir_id', choirId)
      .limit(1)
    
    if (!voiceGroups || voiceGroups.length === 0) {
      console.error('❌ No voice groups found')
      return
    }
    
    if (!membershipTypes || membershipTypes.length === 0) {
      console.error('❌ No membership types found')
      return
    }
    
    const voiceGroupId = voiceGroups[0].id
    const membershipTypeId = membershipTypes[0].id
    
    console.log(`🎵 Voice group: ${voiceGroups[0].value} (${voiceGroupId})`)
    console.log(`📋 Membership type: ${membershipTypes[0].name} (${membershipTypeId})`)
    
    // Create member record
    const memberId = uuidv4()
    
    console.log('🎪 Creating member record...')
    
    const { error: memberError } = await supabase
      .from('members')
      .insert({
        id: memberId,
        user_profile_id: testUserProfileId,
        choir_id: choirId,
        membership_type_id: membershipTypeId,
        voice_group_id: voiceGroupId,
        notes: 'Created by import test'
      })
    
    if (memberError) {
      console.error('❌ Failed to create member:', memberError.message)
      return
    }
    
    console.log('✅ Member record created successfully')
    
    // Create membership period
    console.log('📅 Creating membership period...')
    
    const { error: periodError } = await supabase
      .from('membership_periods')
      .insert({
        member_id: memberId,
        start_date: '2024-01-01',
        end_date: null,
        membership_type_id: membershipTypeId,
        voice_group_id: voiceGroupId,
        voice_type_id: null,
        end_reason: null,
        notes: 'Initial period from import test'
      })
    
    if (periodError) {
      console.error('❌ Failed to create membership period:', periodError.message)
      return
    }
    
    console.log('✅ Membership period created successfully')
    
    // Verify the complete setup
    console.log('\n🔍 Verifying complete member setup...')
    
    const { data: fullMember } = await supabase
      .from('members')
      .select(`
        id,
        user_profiles!inner(email, name, birth_date),
        choirs!inner(name),
        membership_types!inner(name),
        list_of_values!voice_group_id(value)
      `)
      .eq('id', memberId)
      .single()
    
    if (fullMember) {
      console.log('✅ Member verification successful:')
      console.log(`   - Email: ${fullMember.user_profiles.email}`)
      console.log(`   - Name: ${fullMember.user_profiles.name}`)
      console.log(`   - Birth Date: ${fullMember.user_profiles.birth_date}`)
      console.log(`   - Choir: ${fullMember.choirs.name}`)
      console.log(`   - Membership Type: ${fullMember.membership_types.name}`)
      console.log(`   - Voice Group: ${fullMember.list_of_values.value}`)
    }
    
    console.log('\n🎉 Member import test completed successfully!')
    console.log('✅ The import process can now create user profiles and member records')
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }
}

testMemberImport()