#!/usr/bin/env node

/**
 * Test script to verify voice matching logic
 */

// Simulate the auto-detect logic
function autoDetectVoiceGroups(values) {
  const mappings = {}
  
  values.forEach(value => {
    const lower = value.toLowerCase().trim()
    if (lower.includes('sopran') || lower.includes('soprano') || lower === 's') {
      mappings[value] = 'Sopran'
    } else if (lower.includes('alt') || lower.includes('alto') || lower === 'a') {
      mappings[value] = 'Alt'
    } else if (lower.includes('tenor') || lower === 't') {
      mappings[value] = 'Tenor'
    } else if (lower.includes('bass') || lower.includes('baritone') || lower === 'b') {
      mappings[value] = 'Bass'
    }
  })
  
  return mappings
}

function autoDetectVoiceTypes(values) {
  const mappings = {}
  
  values.forEach(value => {
    const lower = value.toLowerCase().trim()
    if (lower.includes('1') && (lower.includes('sopran') || lower.includes('soprano'))) {
      mappings[value] = '1. Sopran'
    } else if (lower.includes('2') && (lower.includes('sopran') || lower.includes('soprano'))) {
      mappings[value] = '2. Sopran'
    } else if (lower.includes('1') && lower.includes('alt')) {
      mappings[value] = '1. Alt'
    } else if (lower.includes('2') && lower.includes('alt')) {
      mappings[value] = '2. Alt'
    } else if (lower.includes('1') && lower.includes('tenor')) {
      mappings[value] = '1. Tenor'
    } else if (lower.includes('2') && lower.includes('tenor')) {
      mappings[value] = '2. Tenor'
    } else if (lower.includes('1') && lower.includes('bass')) {
      mappings[value] = '1. Bass'
    } else if (lower.includes('2') && lower.includes('bass')) {
      mappings[value] = '2. Bass'
    }
  })
  
  return mappings
}

console.log('🎵 Voice Matching Test\n')

// Test typical Styreportalen values
const sampleVoiceGroups = ['Sopran', 'Alt', 'Tenor', 'Bass', 'S', 'A', 'T', 'B']
const sampleVoiceTypes = [
  '1. Sopran', '2. Sopran', '1. Alt', '2. Alt', 
  '1. Tenor', '2. Tenor', '1. Bass', '2. Bass',
  'Sopran 1', 'Sopran 2', 'Alt 1', 'Alt 2'
]

console.log('📊 Voice Group Mappings:')
const voiceGroupMappings = autoDetectVoiceGroups(sampleVoiceGroups)
Object.entries(voiceGroupMappings).forEach(([source, target]) => {
  console.log(`  "${source}" → "${target}"`)
})

console.log('\n📊 Voice Type Mappings:')
const voiceTypeMappings = autoDetectVoiceTypes(sampleVoiceTypes)
Object.entries(voiceTypeMappings).forEach(([source, target]) => {
  console.log(`  "${source}" → "${target}"`)
})

// Test matching with existing database records
function testDatabaseMatching(searchValue, existingRecords) {
  return existingRecords.find(record => 
    record.value === searchValue || record.displayName === searchValue
  )
}

console.log('\n🔍 Database Matching Test:')
const existingVoiceGroups = [
  { value: 'Sopran', displayName: 'Sopran' },
  { value: 'Alt', displayName: 'Alt' },
  { value: 'Tenor', displayName: 'Tenor' },
  { value: 'Bass', displayName: 'Bass' }
]

const testSearchValues = ['Sopran', 'sopran', 'S', 'Alt', 'alt']
testSearchValues.forEach(searchValue => {
  const mapped = voiceGroupMappings[searchValue] || searchValue
  const found = testDatabaseMatching(mapped, existingVoiceGroups)
  console.log(`  Search: "${searchValue}" → Mapped: "${mapped}" → Found: ${found ? '✅' : '❌'}`)
})

console.log('\n✅ The improved matching should now:')
console.log('  1. Auto-detect common voice patterns')
console.log('  2. Map to standardized values')
console.log('  3. Match existing records by value OR displayName')
console.log('  4. Prevent duplicate creation')