#!/usr/bin/env node

/**
 * Script to safely delete a choir and all associated data
 * 
 * This script will:
 * 1. Delete all choir-specific data (events, attendance, etc.)
 * 2. Delete member records for this choir
 * 3. Delete user profiles and auth users ONLY if they have no other active memberships
 * 4. Delete the choir itself
 * 
 * Usage: node scripts/delete-choir.cjs <choir-id>
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

async function deleteChoir(choirId) {
  if (!choirId) {
    console.error('❌ Usage: node scripts/delete-choir.cjs <choir-id>')
    process.exit(1)
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(choirId)) {
    console.error('❌ Invalid choir ID format. Please provide a valid UUID.')
    process.exit(1)
  }

  try {
    console.log(`🚨 DANGER: Deleting choir ${choirId} and all associated data`)
    console.log('⚠️  This action cannot be undone!\n')

    // First, verify the choir exists and get its info
    const { data: choir, error: choirError } = await supabase
      .from('choirs')
      .select('id, name, created_at')
      .eq('id', choirId)
      .single()

    if (choirError || !choir) {
      console.error('❌ Choir not found:', choirError?.message || 'Unknown error')
      process.exit(1)
    }

    console.log(`🎪 Found choir: "${choir.name}" (created: ${choir.created_at})`)

    // Get all members of this choir
    const { data: choirMembers, error: membersError } = await supabase
      .from('members')
      .select(`
        id,
        user_profile_id,
        user_profiles!inner(email, name)
      `)
      .eq('choir_id', choirId)

    if (membersError) {
      console.error('❌ Failed to get choir members:', membersError.message)
      process.exit(1)
    }

    console.log(`👥 Found ${choirMembers.length} members in this choir`)

    // For each member, check if they have memberships in other choirs
    const usersToDelete = []
    const usersToKeep = []

    for (const member of choirMembers) {
      const { data: otherMemberships, error: otherError } = await supabase
        .from('members')
        .select('choir_id')
        .eq('user_profile_id', member.user_profile_id)
        .neq('choir_id', choirId)

      if (otherError) {
        console.warn(`⚠️  Failed to check other memberships for ${member.user_profiles.email}:`, otherError.message)
        continue
      }

      if (otherMemberships.length === 0) {
        // User has no other choir memberships - safe to delete
        usersToDelete.push({
          userId: member.user_profile_id,
          email: member.user_profiles.email,
          name: member.user_profiles.name
        })
      } else {
        // User has other choir memberships - keep the user
        usersToKeep.push({
          userId: member.user_profile_id,
          email: member.user_profiles.email,
          name: member.user_profiles.name,
          otherChoirs: otherMemberships.length
        })
      }
    }

    console.log(`\n📊 Deletion Analysis:`)
    console.log(`   - Users to delete (no other memberships): ${usersToDelete.length}`)
    console.log(`   - Users to keep (have other memberships): ${usersToKeep.length}`)

    if (usersToDelete.length > 0) {
      console.log(`\n🗑️  Users that will be completely deleted:`)
      usersToDelete.forEach(user => {
        console.log(`   - ${user.email} (${user.name})`)
      })
    }

    if (usersToKeep.length > 0) {
      console.log(`\n💾 Users that will be kept (have other choir memberships):`)
      usersToKeep.forEach(user => {
        console.log(`   - ${user.email} (${user.name}) - ${user.otherChoirs} other choir(s)`)
      })
    }

    // Confirm deletion
    console.log(`\n⚠️  FINAL WARNING: This will permanently delete:`)
    console.log(`   - Choir: "${choir.name}"`)
    console.log(`   - All choir events and attendance records`)
    console.log(`   - All choir-specific data (voice groups, membership types, etc.)`)
    console.log(`   - ${choirMembers.length} member records`)
    console.log(`   - ${usersToDelete.length} user profiles and auth accounts`)
    console.log(`\nPress Ctrl+C to cancel or wait 10 seconds to continue...`)
    
    await new Promise(resolve => setTimeout(resolve, 10000))

    console.log(`\n🚀 Starting deletion process...`)

    // Step 1: Delete choir-specific data in dependency order
    console.log(`\n1️⃣ Deleting choir-specific data...`)

    // Delete event attendance
    const { error: attendanceError } = await supabase
      .from('event_attendance')
      .delete()
      .in('event_id', 
        (await supabase
          .from('events')
          .select('id')
          .eq('choir_id', choirId)
        ).data?.map(e => e.id) || []
      )

    if (attendanceError) {
      console.warn(`⚠️  Failed to delete event attendance:`, attendanceError.message)
    } else {
      console.log(`   ✅ Deleted event attendance records`)
    }

    // Delete attendance expectations
    const { error: expectationsError } = await supabase
      .from('attendance_expectations')
      .delete()
      .in('event_id',
        (await supabase
          .from('events')
          .select('id')
          .eq('choir_id', choirId)
        ).data?.map(e => e.id) || []
      )

    if (expectationsError) {
      console.warn(`⚠️  Failed to delete attendance expectations:`, expectationsError.message)
    } else {
      console.log(`   ✅ Deleted attendance expectations`)
    }

    // Delete events
    const { error: eventsError } = await supabase
      .from('events')
      .delete()
      .eq('choir_id', choirId)

    if (eventsError) {
      console.warn(`⚠️  Failed to delete events:`, eventsError.message)
    } else {
      console.log(`   ✅ Deleted events`)
    }

    // Delete membership leaves
    const { error: leavesError } = await supabase
      .from('membership_leaves')
      .delete()
      .in('member_id', choirMembers.map(m => m.id))

    if (leavesError) {
      console.warn(`⚠️  Failed to delete membership leaves:`, leavesError.message)
    } else {
      console.log(`   ✅ Deleted membership leaves`)
    }

    // Delete membership periods
    const { error: periodsError } = await supabase
      .from('membership_periods')
      .delete()
      .in('member_id', choirMembers.map(m => m.id))

    if (periodsError) {
      console.warn(`⚠️  Failed to delete membership periods:`, periodsError.message)
    } else {
      console.log(`   ✅ Deleted membership periods`)
    }

    // Step 2: Delete member records
    console.log(`\n2️⃣ Deleting member records...`)
    
    const { error: membersDeleteError } = await supabase
      .from('members')
      .delete()
      .eq('choir_id', choirId)

    if (membersDeleteError) {
      console.error(`❌ Failed to delete members:`, membersDeleteError.message)
      process.exit(1)
    } else {
      console.log(`   ✅ Deleted ${choirMembers.length} member records`)
    }

    // Step 3: Delete choir configuration data
    console.log(`\n3️⃣ Deleting choir configuration...`)

    // Delete membership types
    const { error: membershipTypesError } = await supabase
      .from('membership_types')
      .delete()
      .eq('choir_id', choirId)

    if (membershipTypesError) {
      console.warn(`⚠️  Failed to delete membership types:`, membershipTypesError.message)
    } else {
      console.log(`   ✅ Deleted membership types`)
    }

    // Delete list of values (voice groups, voice types, etc.)
    const { error: lovError } = await supabase
      .from('list_of_values')
      .delete()
      .eq('choir_id', choirId)

    if (lovError) {
      console.warn(`⚠️  Failed to delete list of values:`, lovError.message)
    } else {
      console.log(`   ✅ Deleted list of values (voice groups, types, etc.)`)
    }

    // Step 4: Delete user profiles and auth users for users with no other memberships
    if (usersToDelete.length > 0) {
      console.log(`\n4️⃣ Deleting user profiles and auth accounts...`)
      
      for (const user of usersToDelete) {
        // Delete user profile (this will cascade to related records)
        const { error: profileError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('id', user.userId)

        if (profileError) {
          console.warn(`   ⚠️  Failed to delete user profile for ${user.email}:`, profileError.message)
          continue
        }

        // Delete auth user
        const { error: authError } = await supabase.auth.admin.deleteUser(user.userId)

        if (authError) {
          console.warn(`   ⚠️  Failed to delete auth user for ${user.email}:`, authError.message)
        } else {
          console.log(`   ✅ Deleted user: ${user.email}`)
        }
      }
    }

    // Step 5: Delete the choir itself
    console.log(`\n5️⃣ Deleting the choir...`)
    
    const { error: choirDeleteError } = await supabase
      .from('choirs')
      .delete()
      .eq('id', choirId)

    if (choirDeleteError) {
      console.error(`❌ Failed to delete choir:`, choirDeleteError.message)
      process.exit(1)
    }

    console.log(`\n🎉 Choir deletion completed successfully!`)
    console.log(`\n📊 Summary:`)
    console.log(`   - Deleted choir: "${choir.name}"`)
    console.log(`   - Deleted ${choirMembers.length} member records`)
    console.log(`   - Deleted ${usersToDelete.length} user accounts completely`)
    console.log(`   - Preserved ${usersToKeep.length} users (have other choir memberships)`)
    console.log(`   - Deleted all associated events, attendance, and configuration data`)

  } catch (error) {
    console.error('💥 Deletion failed:', error.message)
    process.exit(1)
  }
}

// Get choir ID from command line arguments
const choirId = process.argv[2]
deleteChoir(choirId)