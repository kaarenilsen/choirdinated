# Supabase Setup Guide for ChorOS

This guide will help you set up your Supabase project for the ChorOS choir management system.

## Step 1: Create Supabase Project

1. **Go to [supabase.com](https://supabase.com)** and sign up/sign in
2. **Click "New Project"**
3. **Fill in project details:**
   - Name: `choirdinated` or `choros-production`
   - Database Password: Generate a strong password (save this!)
   - Region: Choose Europe (West) for Norwegian users
   - Pricing Plan: Start with Free tier

4. **Wait for project creation** (takes 2-3 minutes)

## Step 2: Get Your Credentials

1. **Go to Settings → API** in your Supabase dashboard
2. **Copy these values:**
   - Project URL
   - `anon public` key
   - `service_role secret` key ⚠️ (keep this secure!)

3. **Go to Settings → Database** 
4. **Copy the connection string** (under "Connection string" → "Nodejs")

## Step 3: Configure Environment Variables

Run the setup script in your project root:

```bash
./setup-env.sh
```

This will prompt you for your Supabase credentials and automatically create the necessary `.env` files.

**Alternatively, manually create the environment files:**

### web-admin/.env
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_connection_string
AUTH_SECRET=your_generated_auth_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### mobile-app/.env
```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_APP_NAME=ChorOS
EXPO_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=development
```

## Step 4: Set Up Database Schema

1. **Generate and run migrations:**
   ```bash
   cd web-admin
   npm run db:generate
   npm run db:migrate
   ```

2. **Run SQL setup scripts in Supabase SQL Editor:**
   
   Go to your Supabase dashboard → SQL Editor and run these files in order:
   
   a. **Authentication Setup** (`supabase/sql/01-auth-setup.sql`)
   - Creates user profiles table
   - Sets up authentication triggers
   - Enables basic RLS

   b. **Storage Setup** (`supabase/sql/02-storage-setup.sql`)
   - Creates storage buckets for files
   - Sets up storage policies
   - Configures file upload permissions

   c. **RLS Policies** (`supabase/sql/03-rls-policies.sql`)
   - Enables Row Level Security on all tables
   - Creates comprehensive security policies
   - Sets up user access controls

## Step 5: Configure Authentication

1. **Go to Authentication → Settings** in Supabase dashboard

2. **Configure Site URL:**
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

3. **Add Redirect URLs:**
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`

4. **Email Templates (Optional):**
   - Customize welcome email
   - Password reset email
   - Email change confirmation

5. **Social Providers (Optional):**
   - Google OAuth
   - Apple OAuth
   - GitHub OAuth

## Step 6: Set Up Storage

The SQL scripts create these storage buckets:

- **`sheet-music-files`** - PDF and MusicXML files (private)
- **`audio-files`** - MP3, WAV practice files (private)
- **`avatars`** - User profile pictures (public)
- **`choir-logos`** - Choir logos and branding (public)

File size limits:
- Sheet music: 50MB
- Audio files: 100MB
- Images: 5MB

## Step 7: Test the Setup

1. **Start the web admin:**
   ```bash
   cd web-admin
   npm run dev
   ```

2. **Start the mobile app:**
   ```bash
   cd mobile-app
   npm start
   ```

3. **Test database connection:**
   ```bash
   cd web-admin
   npm run db:studio
   ```

## Step 8: Seed Default Data (Optional)

You can create a choir and seed default values by running:

```bash
cd web-admin
npm run seed-data
```

This will create:
- Default membership types
- Default event types and statuses
- Voice configurations (SATB, SSAATTBB, SMATBB)
- Norwegian holidays for current year

## Security Checklist

- ✅ RLS enabled on all tables
- ✅ User profiles linked to auth.users
- ✅ Storage policies configured
- ✅ Service role key kept secure
- ✅ Environment variables not committed to git
- ✅ CORS settings configured
- ✅ Authentication redirects set up

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL format
- Check if IP is allowlisted (Supabase → Settings → Database → Network restrictions)
- Ensure password is URL-encoded

### Authentication Issues
- Check Site URL and Redirect URLs
- Verify anon key is correct
- Check middleware configuration

### Storage Issues
- Verify bucket names match code
- Check storage policies
- Ensure file types are allowed

### RLS Issues
- Check if policies are applied to all tables
- Verify helper functions are created
- Test with different user roles

## Production Deployment

For production deployment:

1. **Update environment variables** with production URLs
2. **Configure custom domain** in Supabase settings
3. **Set up database backups**
4. **Configure monitoring** and alerts
5. **Review and audit** all RLS policies
6. **Set up edge functions** for advanced features

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- ChorOS GitHub Issues: [Create an issue]
- Supabase Community: https://github.com/supabase/supabase/discussions