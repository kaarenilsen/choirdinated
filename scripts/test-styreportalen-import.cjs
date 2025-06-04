#!/usr/bin/env node

/**
 * Script to test Styreportalen import with sample data
 * This demonstrates how unmapped fields are stored in additional_data
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
  console.error('❌ Error: Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Sample Styreportalen data structure
const sampleStyreportalenData = [
  {
    "Fornavn": "Kari",
    "Etternavn": "Nordmann",
    "E-post": "kari.nordmann@example.com",
    "Mobil": "12345678",
    "Fødselsdato": "15. mai 1985",
    "Avdeling": "Sopran",  // This becomes voiceGroup
    "Gruppe": "1. Sopran",  // This becomes voiceType
    "Medlemskapstype": "Fast medlem",
    "Status": "Aktiv",
    "Registreringsdato": "1. jan. 2020",
    "Adresse": "Storgata 1",
    "Postnummer": "0001",
    "Sted": "Oslo",
    "Pårørende navn og telefonnr": "Ola Nordmann, 87654321",
    // Unmapped fields from Styreportalen:
    "Medlemsnummer": "2020-001",
    "Stemmeprøvedato": "15. des. 2019",
    "Betalt kontingent": "Ja",
    "Merknader": "Solist erfaring",
    "Instagram": "@karinordmann",
    "Allergier": "Nøtter",
    "T-skjorte størrelse": "M"
  },
  {
    "Fornavn": "Per",
    "Etternavn": "Hansen",
    "E-post": "per.hansen@example.com",
    "Mobil": "98765432",
    "Fødselsdato": "22. okt. 1978",
    "Avdeling": "Bass",
    "Gruppe": "2. Bass",
    "Medlemskapstype": "Fast medlem",
    "Status": "Aktiv",
    "Registreringsdato": "15. aug. 2018",
    "Adresse": "Lillegata 5",
    "Postnummer": "0002",
    "Sted": "Oslo",
    "Pårørende navn og telefonnr": "Anne Hansen, 11223344",
    // Unmapped fields:
    "Medlemsnummer": "2018-045",
    "Stemmeprøvedato": "1. aug. 2018",
    "Betalt kontingent": "Ja",
    "Merknader": "Tidligere korerfaring fra Bergen",
    "Parkering": "Trenger parkeringsplass",
    "Uniformsstørrelse": "XL"
  }
]

async function demonstrateImport() {
  console.log('🎵 Styreportalen Import Test\n')
  console.log('This script demonstrates how unmapped fields are handled.')
  console.log('────────────────────────────────────────────────────\n')

  // Show sample data structure
  console.log('📊 Sample Styreportalen member:')
  console.log(JSON.stringify(sampleStyreportalenData[0], null, 2))
  console.log('\n────────────────────────────────────────────────────\n')

  // Show field mapping
  console.log('🔄 Field Mapping (Styreportalen → Choirdinated):')
  console.log('  Avdeling → voiceGroup (Stemmegruppe)')
  console.log('  Gruppe → voiceType (Stemmetype)')
  console.log('  [Other standard fields mapped directly]\n')

  // Identify unmapped fields
  const standardFields = [
    'Fornavn', 'Etternavn', 'E-post', 'Mobil', 'Fødselsdato',
    'Avdeling', 'Gruppe', 'Medlemskapstype', 'Status',
    'Registreringsdato', 'Adresse', 'Postnummer', 'Sted',
    'Pårørende navn og telefonnr'
  ]

  const unmappedFields = Object.keys(sampleStyreportalenData[0])
    .filter(field => !standardFields.includes(field))

  console.log('📦 Unmapped fields that will be stored in additional_data:')
  unmappedFields.forEach(field => {
    console.log(`  • ${field}`)
  })
  console.log('\n────────────────────────────────────────────────────\n')

  // Show how it would be stored
  console.log('💾 How data will be stored in the database:\n')
  console.log('members table:')
  console.log('  - Standard fields mapped to columns')
  console.log('  - additional_data column contains:')
  console.log(JSON.stringify({
    _importSource: 'styreportalen',
    _importDate: new Date().toISOString(),
    ...unmappedFields.reduce((acc, field) => {
      acc[field] = sampleStyreportalenData[0][field]
      return acc
    }, {})
  }, null, 2))

  console.log('\n────────────────────────────────────────────────────\n')
  console.log('✅ Benefits of storing unmapped fields:')
  console.log('  1. No data loss during import')
  console.log('  2. Can configure custom fields later')
  console.log('  3. Preserve system-specific metadata')
  console.log('  4. Enable future features based on this data')
  
  // Check if we can query members with additional_data
  try {
    const { data: members, error } = await supabase
      .from('members')
      .select('id, additional_data')
      .not('additional_data', 'is', null)
      .limit(5)

    if (!error && members && members.length > 0) {
      console.log('\n📊 Existing members with additional_data:')
      members.forEach(member => {
        console.log(`\nMember ${member.id}:`)
        console.log(JSON.stringify(member.additional_data, null, 2))
      })
    }
  } catch (err) {
    console.log('\n⚠️  Could not query existing members')
  }
}

demonstrateImport()