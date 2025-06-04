#!/usr/bin/env node

/**
 * Test script for improved Styreportalen import with better voice matching
 */

console.log('🎵 Improved Styreportalen Import Test\n')

// Sample problematic data that would create duplicates
const problematicData = [
  {
    "Fornavn": "Kari",
    "Etternavn": "Nordmann", 
    "E-post": "kari@example.com",
    "Avdeling": "Sopran",     // Should map to existing "Sopran"
    "Gruppe": "1. Sopran"     // Should map to existing "1. Sopran"
  },
  {
    "Fornavn": "Per",
    "Etternavn": "Hansen",
    "E-post": "per@example.com", 
    "Avdeling": "SOPRAN",     // Different case - should still match "Sopran"
    "Gruppe": "1. sopran"     // Different case - should still match "1. Sopran"
  },
  {
    "Fornavn": "Anne",
    "Etternavn": "Olsen",
    "E-post": "anne@example.com",
    "Avdeling": "S",          // Abbreviation - should map to "Sopran"
    "Gruppe": "Sopran 1"      // Different format - should map to "1. Sopran"
  }
]

// Simulate the auto-detect value mapping
function simulateValueMapping(data) {
  const mappings = {
    voiceGroup: {},
    voiceType: {}
  }
  
  // Auto-detect voice groups
  const voiceGroups = [...new Set(data.map(row => row.Avdeling))]
  voiceGroups.forEach(value => {
    const lower = value.toLowerCase().trim()
    if (lower.includes('sopran') || lower.includes('soprano') || lower === 's') {
      mappings.voiceGroup[value] = 'Sopran'
    } else if (lower.includes('alt') || lower.includes('alto') || lower === 'a') {
      mappings.voiceGroup[value] = 'Alt'
    } else if (lower.includes('tenor') || lower === 't') {
      mappings.voiceGroup[value] = 'Tenor'
    } else if (lower.includes('bass') || lower.includes('baritone') || lower === 'b') {
      mappings.voiceGroup[value] = 'Bass'
    }
  })
  
  // Auto-detect voice types
  const voiceTypes = [...new Set(data.map(row => row.Gruppe))]
  voiceTypes.forEach(value => {
    const lower = value.toLowerCase().trim()
    if (lower.includes('1') && (lower.includes('sopran') || lower.includes('soprano'))) {
      mappings.voiceType[value] = '1. Sopran'
    } else if (lower.includes('2') && (lower.includes('sopran') || lower.includes('soprano'))) {
      mappings.voiceType[value] = '2. Sopran'
    } else if (lower.includes('1') && lower.includes('alt')) {
      mappings.voiceType[value] = '1. Alt'
    } else if (lower.includes('2') && lower.includes('alt')) {
      mappings.voiceType[value] = '2. Alt'
    }
  })
  
  return mappings
}

// Simulate case-insensitive database matching
function simulateDbMatching(searchValue, existingRecords) {
  return existingRecords.find(record => 
    record.value?.toLowerCase() === searchValue?.toLowerCase() ||
    record.displayName?.toLowerCase() === searchValue?.toLowerCase()
  )
}

console.log('📊 Sample Problematic Data:')
problematicData.forEach((row, i) => {
  console.log(`${i + 1}. ${row.Fornavn} ${row.Etternavn}: Avdeling="${row.Avdeling}", Gruppe="${row.Gruppe}"`)
})

console.log('\n🔄 Auto-detect Value Mappings:')
const valueMappings = simulateValueMapping(problematicData)
console.log('Voice Groups:', valueMappings.voiceGroup)
console.log('Voice Types:', valueMappings.voiceType)

console.log('\n🎯 After Value Mapping Applied:')
const mappedData = problematicData.map(row => ({
  ...row,
  voiceGroup: valueMappings.voiceGroup[row.Avdeling] || row.Avdeling,
  voiceType: valueMappings.voiceType[row.Gruppe] || row.Gruppe
}))

mappedData.forEach((row, i) => {
  console.log(`${i + 1}. ${row.Fornavn}: voiceGroup="${row.voiceGroup}", voiceType="${row.voiceType}"`)
})

console.log('\n🔍 Database Matching Test:')
const existingRecords = [
  { value: 'Sopran', displayName: 'Sopran' },
  { value: '1. Sopran', displayName: '1. Sopran' },
  { value: 'Alt', displayName: 'Alt' },
  { value: '1. Alt', displayName: '1. Alt' }
]

console.log('Existing voice records:', existingRecords.map(r => r.value))

mappedData.forEach((row, i) => {
  const voiceGroupMatch = simulateDbMatching(row.voiceGroup, existingRecords)
  const voiceTypeMatch = simulateDbMatching(row.voiceType, existingRecords)
  
  console.log(`${i + 1}. ${row.Fornavn}:`)
  console.log(`   voiceGroup "${row.voiceGroup}" → ${voiceGroupMatch ? '✅ Found' : '❌ Would create new'}`)
  console.log(`   voiceType "${row.voiceType}" → ${voiceTypeMatch ? '✅ Found' : '❌ Would create new'}`)
})

console.log('\n✅ Improvements Made:')
console.log('  1. Auto-detect maps variations to standard values')
console.log('  2. Case-insensitive database matching prevents duplicates')
console.log('  3. Checks both value AND displayName fields')
console.log('  4. Handles abbreviations (S → Sopran)')
console.log('  5. Handles format variations (Sopran 1 → 1. Sopran)')
console.log('  6. All three test members now map to same voice group/type')

console.log('\n🚀 Expected Result:')
console.log('  - No duplicate voice groups or types created')
console.log('  - All members properly assigned to existing records')
console.log('  - Value mappings preserved in UI for user review')