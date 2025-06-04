#!/usr/bin/env node

/**
 * Script to test the import API endpoint
 * This helps debug the actual import process
 */

const { config } = require('dotenv')
const path = require('path')

// Load environment variables
const envPath = path.join(__dirname, '../web-admin/.env.local')
config({ path: envPath })

async function testImportAPI() {
  try {
    console.log('🧪 Testing import API...\n')
    
    // Create a simple test dataset
    const testData = [
      {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        birthDate: '1990-01-01',
        voiceGroup: 'Sopran',
        membershipType: 'Fast medlem'
      }
    ]
    
    console.log('📤 Sending request to import API...')
    
    // Make request to the import API
    const response = await fetch('http://localhost:3000/api/members/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This won't have auth cookies, so it should fail gracefully
      },
      body: JSON.stringify({ data: testData })
    })
    
    const result = await response.text()
    
    console.log(`📥 Response status: ${response.status}`)
    console.log(`📄 Response body: ${result}`)
    
    if (!response.ok) {
      console.log('⚠️  Expected failure - no auth session in this test')
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection refused - make sure the dev server is running:')
      console.log('   npm run dev:web')
    } else {
      console.error('💥 Test failed:', error.message)
    }
  }
}

testImportAPI()