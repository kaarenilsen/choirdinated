/**
 * Script to fix orphaned member records that are missing user profiles
 * This happens when members are imported but user profiles aren't created properly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../web-admin/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeOrphanedMembers(choirId) {
  console.log(`\n🔍 Analyzing members for choir: ${choirId}\n`);

  // Get all members for the choir
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select(`
      id,
      user_profile_id,
      choir_id,
      voice_group_id,
      membership_type_id,
      created_at
    `)
    .eq('choir_id', choirId);

  if (membersError) {
    console.error('❌ Error fetching members:', membersError);
    return;
  }

  console.log(`📊 Total members found: ${members.length}`);

  // Get unique user_profile_ids
  const userProfileIds = [...new Set(members.filter(m => m.user_profile_id).map(m => m.user_profile_id))];
  console.log(`👤 Unique user_profile_ids: ${userProfileIds.length}`);

  // Check which user profiles exist
  const { data: existingProfiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id')
    .in('id', userProfileIds);

  if (profilesError) {
    console.error('❌ Error fetching user profiles:', profilesError);
    return;
  }

  const existingProfileIds = new Set(existingProfiles.map(p => p.id));
  console.log(`✅ Existing user profiles: ${existingProfiles.length}`);

  // Find orphaned members
  const orphanedMembers = members.filter(m => 
    m.user_profile_id && !existingProfileIds.has(m.user_profile_id)
  );
  console.log(`⚠️  Orphaned members (have user_profile_id but no profile): ${orphanedMembers.length}`);

  // Also check for members with null user_profile_id
  const nullProfileMembers = members.filter(m => !m.user_profile_id);
  console.log(`❓ Members with null user_profile_id: ${nullProfileMembers.length}`);

  // Check if these user_profile_ids exist in auth.users
  if (orphanedMembers.length > 0) {
    console.log('\n🔍 Checking if orphaned user_profile_ids exist in auth.users...');
    const orphanedIds = orphanedMembers.map(m => m.user_profile_id);
    
    // Get auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
    } else {
      const authUserIds = new Set(authUsers.users.map(u => u.id));
      const existingInAuth = orphanedIds.filter(id => authUserIds.has(id));
      console.log(`🔐 Orphaned IDs that exist in auth.users: ${existingInAuth.length}`);
      
      if (existingInAuth.length > 0) {
        console.log('\n💡 These users exist in auth but not in user_profiles table.');
        console.log('   The database trigger might have failed to create user_profiles.');
      }
    }
  }

  return {
    total: members.length,
    withProfiles: existingProfiles.length,
    orphaned: orphanedMembers.length,
    nullProfile: nullProfileMembers.length,
    members: members,
    orphanedMembers: orphanedMembers
  };
}

async function createMissingUserProfiles(choirId, dryRun = true) {
  console.log(`\n🔧 ${dryRun ? 'DRY RUN - ' : ''}Creating missing user profiles for choir: ${choirId}\n`);

  const analysis = await analyzeOrphanedMembers(choirId);
  if (!analysis) return;

  if (analysis.orphaned === 0) {
    console.log('✅ No orphaned members found!');
    return;
  }

  // Get auth users to match with orphaned members
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('❌ Error fetching auth users:', authError);
    return;
  }

  const authUserMap = new Map(authUsers.users.map(u => [u.id, u]));
  let created = 0;

  for (const member of analysis.orphanedMembers) {
    const authUser = authUserMap.get(member.user_profile_id);
    
    if (authUser) {
      console.log(`\n👤 Found auth user for member ${member.id}:`);
      console.log(`   Email: ${authUser.email}`);
      console.log(`   Created: ${authUser.created_at}`);
      
      const profileData = {
        id: authUser.id,
        email: authUser.email || `unknown-${authUser.id}@imported.local`,
        name: authUser.user_metadata?.name || 'Imported Member',
        birth_date: authUser.user_metadata?.birth_date || '1900-01-01',
        phone: authUser.user_metadata?.phone || null,
        emergency_contact: authUser.user_metadata?.emergency_contact || null,
        emergency_phone: authUser.user_metadata?.emergency_phone || null,
        is_active: true,
        created_at: authUser.created_at
      };

      if (!dryRun) {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert(profileData);

        if (insertError) {
          console.error(`   ❌ Failed to create profile: ${insertError.message}`);
        } else {
          console.log(`   ✅ Created user profile`);
          created++;
        }
      } else {
        console.log(`   📝 Would create profile with data:`, profileData);
      }
    } else {
      console.log(`\n⚠️  No auth user found for member ${member.id} with user_profile_id ${member.user_profile_id}`);
    }
  }

  console.log(`\n${dryRun ? 'Would have created' : 'Created'} ${created} user profiles`);
}

// CLI handling
const args = process.argv.slice(2);
const command = args[0];
const choirId = args[1];

if (!command || !choirId) {
  console.log(`
Usage:
  node fix-orphaned-members.cjs analyze <choir-id>     - Analyze orphaned members
  node fix-orphaned-members.cjs fix <choir-id>         - Fix orphaned members (dry run)
  node fix-orphaned-members.cjs fix <choir-id> --apply - Fix orphaned members (actually create profiles)

Example:
  node fix-orphaned-members.cjs analyze 98f6ab32-22fd-49a7-9097-18cc35688901
  node fix-orphaned-members.cjs fix 98f6ab32-22fd-49a7-9097-18cc35688901 --apply
`);
  process.exit(1);
}

async function main() {
  switch (command) {
    case 'analyze':
      await analyzeOrphanedMembers(choirId);
      break;
    case 'fix':
      const apply = args.includes('--apply');
      await createMissingUserProfiles(choirId, !apply);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(console.error);
