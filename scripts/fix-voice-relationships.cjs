#!/usr/bin/env node

/**
 * Script to fix voice type and voice group relationships in existing choirs
 * This will clean up inconsistent voice structures and establish proper hierarchies
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

async function fixVoiceRelationships(choirId) {
  if (!choirId) {
    console.error('❌ Usage: node scripts/fix-voice-relationships.cjs <choir-id>')
    process.exit(1)
  }

  try {
    console.log(`🔧 Fixing voice relationships for choir: ${choirId}\n`)

    // Get choir details
    const { data: choir } = await supabase
      .from('choirs')
      .select('name')
      .eq('id', choirId)
      .single()

    if (!choir) {
      console.error('❌ Choir not found')
      process.exit(1)
    }

    console.log(`🎪 Working on choir: ${choir.name}`)

    // Step 1: Get all current voice groups and types
    const { data: currentVoiceGroups } = await supabase
      .from('list_of_values')
      .select('*')
      .eq('choir_id', choirId)
      .eq('category', 'voice_group')
      .order('sort_order')

    const { data: currentVoiceTypes } = await supabase
      .from('list_of_values')
      .select('*')
      .eq('choir_id', choirId)
      .eq('category', 'voice_type')
      .order('sort_order')

    console.log(`\n📊 Current state:`)
    console.log(`   - Voice Groups: ${currentVoiceGroups?.length || 0}`)
    console.log(`   - Voice Types: ${currentVoiceTypes?.length || 0}`)

    // Step 2: Identify and consolidate duplicate voice groups
    const groupsByValue = new Map()
    currentVoiceGroups?.forEach(vg => {
      const normalizedValue = vg.value.toLowerCase()
      if (!groupsByValue.has(normalizedValue)) {
        groupsByValue.set(normalizedValue, [])
      }
      groupsByValue.get(normalizedValue).push(vg)
    })

    console.log(`\n🔍 Analysis:`)
    const duplicateGroups = []
    const keepGroups = []
    
    for (const [normalizedValue, groups] of groupsByValue.entries()) {
      if (groups.length > 1) {
        console.log(`   - Duplicate "${normalizedValue}": ${groups.length} entries`)
        duplicateGroups.push(...groups.slice(1)) // Keep first, mark others for deletion
        keepGroups.push(groups[0])
      } else {
        keepGroups.push(groups[0])
      }
    }

    // Step 3: Update member references to use consolidated voice groups
    if (duplicateGroups.length > 0) {
      console.log(`\n🔄 Consolidating duplicate voice groups...`)
      
      for (const duplicateGroup of duplicateGroups) {
        const keepGroup = keepGroups.find(kg => 
          kg.value.toLowerCase() === duplicateGroup.value.toLowerCase()
        )
        
        if (keepGroup) {
          console.log(`   - Merging "${duplicateGroup.display_name}" → "${keepGroup.display_name}"`)
          
          // Update members using the duplicate group
          const { error: memberUpdateError } = await supabase
            .from('members')
            .update({ voice_group_id: keepGroup.id })
            .eq('voice_group_id', duplicateGroup.id)
          
          if (memberUpdateError) {
            console.error(`     ❌ Failed to update members: ${memberUpdateError.message}`)
            continue
          }

          // Update membership periods using the duplicate group
          const { error: periodUpdateError } = await supabase
            .from('membership_periods')
            .update({ voice_group_id: keepGroup.id })
            .eq('voice_group_id', duplicateGroup.id)
          
          if (periodUpdateError) {
            console.error(`     ❌ Failed to update membership periods: ${periodUpdateError.message}`)
            continue
          }

          // Update voice types that reference this group as parent
          const { error: typeUpdateError } = await supabase
            .from('list_of_values')
            .update({ parent_id: keepGroup.id })
            .eq('parent_id', duplicateGroup.id)
          
          if (typeUpdateError) {
            console.error(`     ❌ Failed to update voice type parents: ${typeUpdateError.message}`)
            continue
          }
        }
      }

      // Delete duplicate voice groups
      for (const duplicateGroup of duplicateGroups) {
        const { error: deleteError } = await supabase
          .from('list_of_values')
          .delete()
          .eq('id', duplicateGroup.id)
        
        if (deleteError) {
          console.error(`     ❌ Failed to delete duplicate group: ${deleteError.message}`)
        } else {
          console.log(`     ✅ Deleted duplicate group: ${duplicateGroup.display_name}`)
        }
      }
    }

    // Step 4: Fix orphaned voice types (those without parent relationships)
    console.log(`\n🔗 Fixing orphaned voice types...`)
    
    const orphanedTypes = currentVoiceTypes?.filter(vt => !vt.parent_id) || []
    
    for (const orphanType of orphanedTypes) {
      console.log(`   - Processing orphaned type: ${orphanType.display_name} (${orphanType.value})`)
      
      // Try to find matching parent group
      let parentGroup = null
      const typeLower = orphanType.value.toLowerCase()
      const displayLower = orphanType.display_name.toLowerCase()
      
      // Look for exact or partial matches
      for (const group of keepGroups) {
        const groupLower = group.value.toLowerCase()
        const groupDisplayLower = group.display_name.toLowerCase()
        
        if (typeLower.includes(groupLower) || 
            displayLower.includes(groupDisplayLower) ||
            typeLower.includes(groupDisplayLower) ||
            displayLower.includes(groupLower)) {
          parentGroup = group
          break
        }
        
        // Handle soprano/sopran variations
        if ((groupLower.includes('soprano') || groupLower.includes('sopran')) &&
            (typeLower.includes('soprano') || typeLower.includes('sopran'))) {
          parentGroup = group
          break
        }
      }
      
      if (parentGroup) {
        console.log(`     → Linking to parent: ${parentGroup.display_name}`)
        
        const { error: linkError } = await supabase
          .from('list_of_values')
          .update({ parent_id: parentGroup.id })
          .eq('id', orphanType.id)
        
        if (linkError) {
          console.error(`     ❌ Failed to link parent: ${linkError.message}`)
        } else {
          console.log(`     ✅ Successfully linked to parent`)
        }
      } else {
        console.log(`     ⚠️  No matching parent group found`)
        
        // If this voice type has no matching group, it might be a standalone voice group
        // Convert it to a voice group instead
        console.log(`     → Converting to voice group`)
        
        const { error: convertError } = await supabase
          .from('list_of_values')
          .update({ category: 'voice_group' })
          .eq('id', orphanType.id)
        
        if (convertError) {
          console.error(`     ❌ Failed to convert to voice group: ${convertError.message}`)
        } else {
          console.log(`     ✅ Converted to voice group`)
          keepGroups.push({ ...orphanType, category: 'voice_group' })
        }
      }
    }

    // Step 5: Verify all member voice assignments are valid
    console.log(`\n✅ Verifying member voice assignments...`)
    
    const { data: members } = await supabase
      .from('members')
      .select('id, voice_group_id, voice_type_id')
      .eq('choir_id', choirId)

    if (members) {
      let invalidGroupAssignments = 0
      let invalidTypeAssignments = 0
      
      for (const member of members) {
        // Check voice group assignment
        if (member.voice_group_id) {
          const groupExists = keepGroups.some(g => g.id === member.voice_group_id)
          if (!groupExists) {
            invalidGroupAssignments++
            console.log(`     ⚠️  Member ${member.id} has invalid voice group ID`)
          }
        }
        
        // Check voice type assignment
        if (member.voice_type_id) {
          const { data: typeExists } = await supabase
            .from('list_of_values')
            .select('id')
            .eq('id', member.voice_type_id)
            .eq('category', 'voice_type')
            .single()
          
          if (!typeExists) {
            invalidTypeAssignments++
            console.log(`     ⚠️  Member ${member.id} has invalid voice type ID`)
          }
        }
      }
      
      console.log(`   - ${members.length} members checked`)
      console.log(`   - ${invalidGroupAssignments} invalid voice group assignments`)
      console.log(`   - ${invalidTypeAssignments} invalid voice type assignments`)
    }

    console.log(`\n🎉 Voice relationship cleanup complete!`)
    console.log(`\nTo verify the results, run:`)
    console.log(`   node scripts/test-voice-relationships.cjs`)

  } catch (error) {
    console.error('💥 Fix failed:', error.message)
    process.exit(1)
  }
}

// Get choir ID from command line arguments
const choirId = process.argv[2]
fixVoiceRelationships(choirId)