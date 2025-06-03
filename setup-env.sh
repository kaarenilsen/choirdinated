#!/bin/bash

echo "🎼 ChorOS Environment Setup"
echo "=========================="
echo ""

# Function to read user input
read_input() {
    local prompt="$1"
    local var_name="$2"
    local is_secret="$3"
    
    if [ "$is_secret" = "true" ]; then
        echo -n "$prompt: "
        read -s value
        echo ""
    else
        echo -n "$prompt: "
        read value
    fi
    
    eval "$var_name='$value'"
}

echo "Please provide your Supabase project credentials:"
echo "(You can find these in your Supabase project settings → API)"
echo ""

# Get Supabase credentials
read_input "Supabase Project URL" SUPABASE_URL false
read_input "Supabase Anon Public Key" SUPABASE_ANON_KEY true
read_input "Supabase Service Role Key" SUPABASE_SERVICE_KEY true

echo ""
echo "Setting up database configuration..."
read_input "Database URL (from Supabase Settings → Database)" DATABASE_URL true

echo ""
echo "Generating auth secret..."
AUTH_SECRET=$(openssl rand -base64 32)

echo ""
echo "Creating environment files..."

# Create web-admin .env
cat > web-admin/.env << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# Database Configuration
DATABASE_URL=$DATABASE_URL

# Authentication
AUTH_SECRET=$AUTH_SECRET

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
EOF

# Create mobile-app .env
cat > mobile-app/.env << EOF
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=$SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Application Configuration
EXPO_PUBLIC_APP_NAME=ChorOS
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Development
NODE_ENV=development
EOF

# Create root .env
cat > .env << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# Database Configuration
DATABASE_URL=$DATABASE_URL

# Authentication
AUTH_SECRET=$AUTH_SECRET

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

echo ""
echo "✅ Environment files created successfully!"
echo ""
echo "Next steps:"
echo "1. Run 'cd web-admin && npm run db:generate' to generate database schema"
echo "2. Run 'cd web-admin && npm run db:migrate' to create database tables"
echo "3. Set up Supabase storage buckets and RLS policies"
echo "4. Start development with 'npm run dev:web' or 'npm run dev:mobile'"
echo ""
echo "🔒 Keep your service role key secure and never commit it to version control!"