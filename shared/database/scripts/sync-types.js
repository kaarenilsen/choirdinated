#!/usr/bin/env node

const { execSync } = require('child_process');
const { writeFileSync, readFileSync } = require('fs');
const path = require('path');

async function syncTypes() {
  console.log('🔄 Syncing database types from Supabase...');
  
  try {
    // Generate types from Supabase
    console.log('Generating types...');
    const types = execSync('supabase gen types typescript --project-id uabjpfgamdkctrvfwnuq', {
      encoding: 'utf8',
      cwd: path.resolve(__dirname, '../../../')
    });
    
    // Add header comment
    const header = `// Generated database types from Supabase
// This file is auto-generated - do not edit manually
// Run \`npm run sync-types\` to update
// Generated at: ${new Date().toISOString()}

`;
    
    const finalTypes = header + types;
    
    // Write to types file
    const typesPath = path.resolve(__dirname, '../src/types.ts');
    writeFileSync(typesPath, finalTypes);
    
    console.log('✅ Types synced successfully!');
    console.log(`📝 Updated: ${typesPath}`);
    
    // Build the package
    console.log('🔨 Building shared database package...');
    execSync('npm run build', { 
      cwd: path.resolve(__dirname, '../'),
      stdio: 'inherit'
    });
    
    console.log('✅ Database package built successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update web-admin: cd ../../web-admin && npm install');
    console.log('2. Update mobile-app: cd ../../mobile-app && npm install');
    
  } catch (error) {
    console.error('❌ Error syncing types:', error.message);
    process.exit(1);
  }
}

syncTypes();