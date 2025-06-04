#!/usr/bin/env node

/**
 * Script to list all choirs in the system
 * 
 * Usage: node scripts/list-choirs.cjs
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

async function listChoirs() {
  try {
    console.log('🎪 Listing all choirs in the system...\n')

    // Get all choirs with member counts
    const { data: choirs, error: choirsError } = await supabase
      .from('choirs')
      .select(`
        id,
        name,
        description,
        organization_type,
        founded_year,
        website,
        created_at,
        members!inner(id)
      `)
      .order('created_at', { ascending: false })

    if (choirsError) {
      console.error('❌ Failed to get choirs:', choirsError.message)
      process.exit(1)
    }

    if (!choirs || choirs.length === 0) {
      console.log('📭 No choirs found in the system')
      return
    }

    console.log(`Found ${choirs.length} choir(s):\n`)

    for (let i = 0; i < choirs.length; i++) {
      const choir = choirs[i]
      const memberCount = choir.members.length

      console.log(`${i + 1}. ${choir.name}`)
      console.log(`   📊 ID: ${choir.id}`)
      console.log(`   👥 Members: ${memberCount}`)
      console.log(`   📝 Description: ${choir.description || 'No description'}`)
      console.log(`   🏢 Type: ${choir.organization_type || 'Not specified'}`)
      console.log(`   🗓️  Founded: ${choir.founded_year || 'Not specified'}`)
      console.log(`   🌐 Website: ${choir.website || 'No website'}`)
      console.log(`   📅 Created: ${choir.created_at}`)
      
      // Get recent events count
      const { data: events } = await supabase
        .from('events')
        .select('id')
        .eq('choir_id', choir.id)

      console.log(`   📅 Events: ${events?.length || 0}`)

      console.log('')
    }

    console.log('💡 Commands:')
    console.log('   Preview deletion: node scripts/preview-choir-deletion.cjs <choir-id>')
    console.log('   Delete choir:     node scripts/delete-choir.cjs <choir-id>')

  } catch (error) {
    console.error('💥 Failed to list choirs:', error.message)
    process.exit(1)
  }
}

listChoirs()