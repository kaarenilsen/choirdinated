#!/usr/bin/env node

/**
 * Script to test voice type and voice group relationships
 * This verifies that the hierarchical structure is correctly implemented
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

async function testVoiceRelationships() {
  try {
    console.log('🎵 Testing voice type and voice group relationships...\n')

    // Get all choirs
    const { data: choirs } = await supabase
      .from('choirs')
      .select('id, name')

    if (!choirs || choirs.length === 0) {
      console.log('❌ No choirs found')
      return
    }

    for (const choir of choirs) {
      console.log(`🎪 Analyzing choir: ${choir.name} (${choir.id})`)

      // Get voice groups
      const { data: voiceGroups, error: vgError } = await supabase
        .from('list_of_values')
        .select('id, value, display_name, sort_order')
        .eq('choir_id', choir.id)
        .eq('category', 'voice_group')
        .order('sort_order')

      if (vgError) {
        console.error('❌ Error getting voice groups:', vgError.message)
        continue
      }

      console.log(`\n   📊 Voice Groups (${voiceGroups?.length || 0}):`)
      voiceGroups?.forEach(vg => {
        console.log(`      - ${vg.display_name} (${vg.value}) [ID: ${vg.id}]`)
      })

      // Get voice types
      const { data: voiceTypes, error: vtError } = await supabase
        .from('list_of_values')
        .select('id, value, display_name, parent_id, sort_order')
        .eq('choir_id', choir.id)
        .eq('category', 'voice_type')
        .order('sort_order')

      if (vtError) {
        console.error('❌ Error getting voice types:', vtError.message)
        continue
      }

      console.log(`\n   🎯 Voice Types (${voiceTypes?.length || 0}):`)
      if (voiceTypes && voiceTypes.length > 0) {
        // Group voice types by their parent
        const typesByParent = new Map()
        const orphanTypes = []

        voiceTypes.forEach(vt => {
          if (vt.parent_id) {
            if (!typesByParent.has(vt.parent_id)) {
              typesByParent.set(vt.parent_id, [])
            }
            typesByParent.get(vt.parent_id).push(vt)
          } else {
            orphanTypes.push(vt)
          }
        })

        // Show hierarchical structure
        voiceGroups?.forEach(vg => {
          const childTypes = typesByParent.get(vg.id) || []
          if (childTypes.length > 0) {
            console.log(`      ▼ ${vg.display_name} (${vg.value})`)
            childTypes.forEach(vt => {
              console.log(`        └─ ${vt.display_name} (${vt.value}) [ID: ${vt.id}]`)
            })
          }
        })

        // Show orphan voice types (those without parents)
        if (orphanTypes.length > 0) {
          console.log(`      ⚠️  Voice Types without parents:`)
          orphanTypes.forEach(vt => {
            console.log(`        - ${vt.display_name} (${vt.value}) [ID: ${vt.id}]`)
          })
        }
      } else {
        console.log(`      (No voice types - using voice groups only)`)
      }

      // Validate structure
      console.log(`\n   ✅ Structure Analysis:`)
      
      const hasVoiceGroups = voiceGroups && voiceGroups.length > 0
      const hasVoiceTypes = voiceTypes && voiceTypes.length > 0
      
      if (!hasVoiceGroups) {
        console.log(`      ❌ No voice groups found - this is required!`)
        continue
      }

      console.log(`      ✅ Has ${voiceGroups.length} voice groups`)

      if (hasVoiceTypes) {
        const typesWithParents = voiceTypes.filter(vt => vt.parent_id).length
        const typesWithoutParents = voiceTypes.filter(vt => !vt.parent_id).length
        
        console.log(`      ✅ Has ${voiceTypes.length} voice types`)
        console.log(`      ✅ ${typesWithParents} voice types have parent groups`)
        
        if (typesWithoutParents > 0) {
          console.log(`      ⚠️  ${typesWithoutParents} voice types lack parent relationships`)
        }

        // Check if all parent IDs are valid
        const invalidParents = voiceTypes
          .filter(vt => vt.parent_id && !voiceGroups.some(vg => vg.id === vt.parent_id))
        
        if (invalidParents.length > 0) {
          console.log(`      ❌ ${invalidParents.length} voice types have invalid parent IDs`)
        } else if (typesWithParents > 0) {
          console.log(`      ✅ All voice types have valid parent relationships`)
        }
      } else {
        console.log(`      ✅ No voice types (valid for SATB configuration)`)
      }

      // Check members and their voice assignments
      const { data: members } = await supabase
        .from('members')
        .select(`
          id,
          voice_group_id,
          voice_type_id,
          user_profiles!inner(name)
        `)
        .eq('choir_id', choir.id)

      if (members && members.length > 0) {
        console.log(`\n   👥 Member Voice Assignments (${members.length} members):`)
        
        const membersWithGroups = members.filter(m => m.voice_group_id).length
        const membersWithTypes = members.filter(m => m.voice_type_id).length
        
        console.log(`      ✅ ${membersWithGroups}/${members.length} members have voice groups`)
        console.log(`      ✅ ${membersWithTypes}/${members.length} members have voice types`)
        
        // Validate that all voice group IDs are valid
        const invalidVoiceGroups = members
          .filter(m => m.voice_group_id && !voiceGroups.some(vg => vg.id === m.voice_group_id))
        
        if (invalidVoiceGroups.length > 0) {
          console.log(`      ❌ ${invalidVoiceGroups.length} members have invalid voice group IDs`)
        }

        // Validate that all voice type IDs are valid
        const invalidVoiceTypes = members
          .filter(m => m.voice_type_id && !voiceTypes?.some(vt => vt.id === m.voice_type_id))
        
        if (invalidVoiceTypes.length > 0) {
          console.log(`      ❌ ${invalidVoiceTypes.length} members have invalid voice type IDs`)
        }
      }

      console.log('\n' + '─'.repeat(80))
    }

    console.log('\n🎉 Voice relationship analysis complete!')

  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }
}

testVoiceRelationships()