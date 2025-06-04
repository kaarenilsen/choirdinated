#!/usr/bin/env node

/**
 * Script to preview what would be deleted when deleting a choir
 * 
 * This is a safe preview script that shows all data that would be affected
 * without actually deleting anything.
 * 
 * Usage: node scripts/preview-choir-deletion.cjs <choir-id>
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

async function previewChoirDeletion(choirId) {
  if (!choirId) {
    console.error('❌ Usage: node scripts/preview-choir-deletion.cjs <choir-id>')
    process.exit(1)
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(choirId)) {
    console.error('❌ Invalid choir ID format. Please provide a valid UUID.')
    process.exit(1)
  }

  try {
    console.log(`🔍 PREVIEW: Analyzing what would be deleted for choir ${choirId}`)
    console.log('📋 This is a safe preview - nothing will be deleted\n')

    // First, verify the choir exists and get its info
    const { data: choir, error: choirError } = await supabase
      .from('choirs')
      .select('id, name, created_at, description')
      .eq('id', choirId)
      .single()

    if (choirError || !choir) {
      console.error('❌ Choir not found:', choirError?.message || 'Unknown error')
      process.exit(1)
    }

    console.log(`🎪 Choir Details:`)
    console.log(`   - Name: "${choir.name}"`)
    console.log(`   - Description: ${choir.description || 'No description'}`)
    console.log(`   - Created: ${choir.created_at}`)

    // Get all members of this choir
    const { data: choirMembers, error: membersError } = await supabase
      .from('members')
      .select(`
        id,
        user_profile_id,
        created_at,
        user_profiles!inner(email, name, birth_date, phone),
        membership_types!inner(name, display_name),
        voice_group:list_of_values!voice_group_id(value, display_name),
        voice_type:list_of_values!voice_type_id(value, display_name)
      `)
      .eq('choir_id', choirId)

    if (membersError) {
      console.error('❌ Failed to get choir members:', membersError.message)
      process.exit(1)
    }

    console.log(`\n👥 Members (${choirMembers.length} total):`)
    
    // Analyze each member's status across choirs
    const usersToDelete = []
    const usersToKeep = []

    for (const member of choirMembers) {
      // Check other choir memberships
      const { data: otherMemberships, error: otherError } = await supabase
        .from('members')
        .select(`
          choir_id,
          choirs!inner(name)
        `)
        .eq('user_profile_id', member.user_profile_id)
        .neq('choir_id', choirId)

      if (otherError) {
        console.warn(`⚠️  Failed to check other memberships for ${member.user_profiles.email}:`, otherError.message)
        continue
      }

      const memberInfo = {
        userId: member.user_profile_id,
        email: member.user_profiles.email,
        name: member.user_profiles.name,
        birthDate: member.user_profiles.birth_date,
        phone: member.user_profiles.phone,
        membershipType: member.membership_types.display_name,
        voiceGroup: member.voice_group?.display_name || 'Unknown',
        voiceType: member.voice_type?.display_name || null,
        memberSince: member.created_at,
        otherChoirs: otherMemberships.map(m => m.choirs.name)
      }

      if (otherMemberships.length === 0) {
        usersToDelete.push(memberInfo)
      } else {
        usersToKeep.push(memberInfo)
      }
    }

    // Display users that would be deleted
    if (usersToDelete.length > 0) {
      console.log(`\n🗑️  Users that would be COMPLETELY DELETED (${usersToDelete.length}):`)
      usersToDelete.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.name} (${user.email})`)
        console.log(`      - Birth Date: ${user.birthDate || 'Not set'}`)
        console.log(`      - Phone: ${user.phone || 'Not set'}`)
        console.log(`      - Membership: ${user.membershipType}`)
        console.log(`      - Voice: ${user.voiceGroup}${user.voiceType ? ` - ${user.voiceType}` : ''}`)
        console.log(`      - Member Since: ${user.memberSince}`)
        console.log(`      - Other Choirs: None (will be deleted)`)
      })
    }

    // Display users that would be kept
    if (usersToKeep.length > 0) {
      console.log(`\n💾 Users that would be PRESERVED (${usersToKeep.length}):`)
      usersToKeep.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.name} (${user.email})`)
        console.log(`      - Birth Date: ${user.birthDate || 'Not set'}`)
        console.log(`      - Phone: ${user.phone || 'Not set'}`)
        console.log(`      - Membership: ${user.membershipType}`)
        console.log(`      - Voice: ${user.voiceGroup}${user.voiceType ? ` - ${user.voiceType}` : ''}`)
        console.log(`      - Member Since: ${user.memberSince}`)
        console.log(`      - Other Choirs: ${user.otherChoirs.join(', ')}`)
      })
    }

    // Get events count
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, start_time, type_id')
      .eq('choir_id', choirId)

    if (!eventsError && events) {
      console.log(`\n📅 Events that would be deleted (${events.length}):`)
      if (events.length > 0) {
        events.slice(0, 10).forEach(event => {
          console.log(`   - ${event.title} (${event.start_time})`)
        })
        if (events.length > 10) {
          console.log(`   ... and ${events.length - 10} more events`)
        }
      }
    }

    // Get membership types count
    const { data: membershipTypes, error: mtError } = await supabase
      .from('membership_types')
      .select('name, display_name')
      .eq('choir_id', choirId)

    if (!mtError && membershipTypes) {
      console.log(`\n📋 Membership Types that would be deleted (${membershipTypes.length}):`)
      membershipTypes.forEach(mt => {
        console.log(`   - ${mt.display_name}`)
      })
    }

    // Get voice configuration count
    const { data: voiceConfig, error: vcError } = await supabase
      .from('list_of_values')
      .select('category, value, display_name')
      .eq('choir_id', choirId)
      .in('category', ['voice_group', 'voice_type', 'event_type', 'event_status'])

    if (!vcError && voiceConfig) {
      const voiceGroups = voiceConfig.filter(v => v.category === 'voice_group')
      const voiceTypes = voiceConfig.filter(v => v.category === 'voice_type')
      
      console.log(`\n🎵 Voice Configuration that would be deleted:`)
      console.log(`   - Voice Groups (${voiceGroups.length}): ${voiceGroups.map(v => v.display_name).join(', ')}`)
      console.log(`   - Voice Types (${voiceTypes.length}): ${voiceTypes.map(v => v.display_name).join(', ')}`)
    }

    // Summary
    console.log(`\n📊 DELETION IMPACT SUMMARY:`)
    console.log(`   🎪 Choir: "${choir.name}" would be deleted`)
    console.log(`   👥 ${choirMembers.length} member records would be deleted`)
    console.log(`   🗑️  ${usersToDelete.length} users would be completely removed (auth + profile)`)
    console.log(`   💾 ${usersToKeep.length} users would be preserved (have other choir memberships)`)
    console.log(`   📅 ${events?.length || 0} events would be deleted`)
    console.log(`   📋 ${membershipTypes?.length || 0} membership types would be deleted`)
    console.log(`   🎵 ${voiceConfig?.length || 0} voice/event configuration items would be deleted`)

    console.log(`\n⚠️  To actually delete this choir, run:`)
    console.log(`   node scripts/delete-choir.cjs ${choirId}`)

  } catch (error) {
    console.error('💥 Preview failed:', error.message)
    process.exit(1)
  }
}

// Get choir ID from command line arguments
const choirId = process.argv[2]
previewChoirDeletion(choirId)