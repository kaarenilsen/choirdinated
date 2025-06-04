# Choirdinated Administrative Scripts

This directory contains administrative scripts for managing the Choirdinated application.

## 🔐 Authentication & User Management

### `reset-user-password-simple.cjs`
Resets user passwords using Supabase Admin API. Useful for:
- Helping users who are locked out of their accounts
- Administrative password resets
- Testing purposes

```bash
node scripts/reset-user-password-simple.cjs <user-id-or-email> <new-password>
```

### `test-auth-helper.cjs`
Tests auth helper functionality for debugging authentication issues.
```bash
node scripts/test-auth-helper.cjs
```

### `test-auth-import.cjs`
Tests the enhanced member import functionality that creates auth users and user profiles.
```bash
node scripts/test-auth-import.cjs
```

## 👥 Member Management

### `test-member-import.cjs`
Tests member import functionality by creating test user profiles and member records.
```bash
node scripts/test-member-import.cjs
```

### `test-import-api.cjs`
Tests the import API endpoint directly.
```bash
node scripts/test-import-api.cjs
```

## 🎪 Choir Management

### `list-choirs.cjs`
Lists all choirs in the system with member counts and basic information.
```bash
node scripts/list-choirs.cjs
```

### `preview-choir-deletion.cjs` ⚠️
**SAFE PREVIEW** - Shows what would be deleted when removing a choir, without actually deleting anything.
```bash
node scripts/preview-choir-deletion.cjs <choir-id>
```

### `delete-choir.cjs` ⚠️ **DANGEROUS**
**PERMANENTLY DELETES** a choir and all associated data. This action cannot be undone!

**Smart User Deletion Logic:**
- Users with **only** membership in the target choir → **COMPLETELY DELETED** (auth user + profile)
- Users with memberships in **other choirs** → **PRESERVED** (only choir-specific data deleted)

```bash
node scripts/delete-choir.cjs <choir-id>
```

#### What gets deleted:
1. **Choir-specific data:**
   - Events and attendance records
   - Membership types and voice configurations
   - List of values (voice groups, event types, etc.)

2. **Member records:**
   - Member records for this choir
   - Membership periods and leave records

3. **User accounts (conditional):**
   - User profiles and Supabase auth users **ONLY** if they have no other active choir memberships
   - Users with memberships in other choirs are preserved

#### Safety Features:
- 10-second confirmation delay before deletion
- Detailed analysis of what will be deleted
- Shows which users will be deleted vs. preserved
- UUID validation for choir ID
- Comprehensive error handling

## 🧪 Database Testing & Diagnostics

### `check-db-status.cjs`
Verifies database state and user-choir relationships.
```bash
node scripts/check-db-status.cjs
```

### `test-voice-relationships.cjs`
Tests and analyzes voice type and voice group hierarchical relationships in choirs.
```bash
node scripts/test-voice-relationships.cjs
```

### `fix-voice-relationships.cjs`
Fixes inconsistent voice relationships by consolidating duplicates and establishing proper parent-child hierarchies.
```bash
node scripts/fix-voice-relationships.cjs <choir-id>
```

---

## 📋 Usage Examples

### 1. Safe Choir Analysis
```bash
# List all choirs to find the one you want to analyze
node scripts/list-choirs.cjs

# Preview what would happen if you deleted a specific choir
node scripts/preview-choir-deletion.cjs b382609e-c3f8-4af4-ac9f-ea6560f5bca4
```

### 2. Choir Deletion (Production)
```bash
# Step 1: Always preview first!
node scripts/preview-choir-deletion.cjs <choir-id>

# Step 2: Review the output carefully

# Step 3: If you're absolutely sure, delete the choir
node scripts/delete-choir.cjs <choir-id>
```

### 3. Testing Member Import
```bash
# Test the auth user creation process
node scripts/test-auth-import.cjs

# Test member import API
node scripts/test-import-api.cjs
```

---

## ⚠️ Important Safety Notes

1. **Always use preview scripts first** before any destructive operations
2. **Backup your database** before running deletion scripts in production
3. **Verify choir IDs** using `list-choirs.cjs` before deletion
4. **Review member lists** carefully - deletion affects real user accounts
5. **Test in development** environment first

---

## 📖 Detailed Documentation

### Password Reset Script

### Prerequisites

1. **Environment Variables**: Make sure your `web-admin/.env.local` file contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Dependencies**: The script uses the same dependencies as the web-admin project, so make sure they're installed:
   ```bash
   cd web-admin
   npm install
   ```

### Usage

#### Option 1: Using User ID
```bash
node scripts/reset-user-password-simple.cjs <user-id> <new-password>
```

Example:
```bash
node scripts/reset-user-password-simple.cjs 123e4567-e89b-12d3-a456-426614174000 mynewpassword123
```

#### Option 2: Using Email Address
```bash
node scripts/reset-user-password-simple.cjs <email> <new-password>
```

Example:
```bash
node scripts/reset-user-password-simple.cjs user@example.com mynewpassword123
```

### How it Works

1. **Environment Check**: Validates that required Supabase credentials are available
2. **User Lookup**: 
   - If you provide a UUID, it uses it directly as the user ID
   - If you provide an email, it looks up the user ID first
3. **User Verification**: Checks that the user exists in Supabase Auth
4. **Password Update**: Uses the Supabase Admin API to set the new password
5. **Confirmation**: Displays success message with user details

### Security Notes

⚠️ **Important Security Considerations:**

- This script requires the **Service Role Key**, which has admin privileges
- Only run this script in secure environments
- Never expose the service role key in client-side code
- Consider logging password reset activities for audit purposes
- Ensure new passwords meet your security requirements

### Error Handling

The script handles common errors:
- Missing environment variables
- Invalid user ID or email
- User not found
- Password too short (minimum 6 characters)
- Supabase API errors

### Example Output

```
🔍 Looking up user by email: john@example.com
✅ Found user ID: 123e4567-e89b-12d3-a456-426614174000
🔄 Resetting password for user: 123e4567-e89b-12d3-a456-426614174000
👤 Found user: john@example.com
✅ Password reset successfully!
📧 User email: john@example.com
🆔 User ID: 123e4567-e89b-12d3-a456-426614174000
📅 Updated at: 2024-01-15T10:30:45.123Z
```

### Troubleshooting

**"Missing required environment variables"**
- Check that your `.env.local` file exists in the `web-admin` directory
- Verify the environment variable names are correct
- Ensure the service role key has the correct permissions

**"User not found"**
- Double-check the user ID or email address
- Verify the user exists in your Supabase Auth dashboard

**"Failed to update password"**
- Check that your service role key has admin permissions
- Ensure the new password meets Supabase's password requirements

### Alternative Version

There's also an ES modules version (`reset-user-password.js`) that requires the `scripts/package.json` file. Both versions have identical functionality.

### Adding More Scripts

To add more administrative scripts:

1. Create a new `.js` file in this directory
2. Follow the same pattern for loading environment variables
3. Use the Supabase admin client for privileged operations
4. Add proper error handling and user feedback
5. Document the script in this README