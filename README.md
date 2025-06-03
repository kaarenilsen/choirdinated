# Choirdinated - Professional Choir Management System

Choirdinated is a comprehensive choir management application designed for large symphonic choirs and opera organizations. The system consists of a mobile app for choir members and a web admin portal for management.

## Project Structure

This is a monorepo containing three main packages:

- **`web-admin/`** - Next.js web administration portal
- **`mobile-app/`** - React Native + Expo mobile application
- **`shared/`** - Shared TypeScript types and utilities

## Technology Stack

### Shared Backend
- **Supabase** - Authentication, database, real-time subscriptions, file storage
- **PostgreSQL** - Primary database with Row Level Security (RLS)
- **Drizzle ORM** - Type-safe database operations

### Web Admin Portal
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS + shadcn/ui** for styling
- **Drizzle ORM** for database operations
- **Vercel** deployment ready

### Mobile App
- **React Native + Expo** for cross-platform development
- **TypeScript** for type safety
- **Expo EAS** for building and deployment
- **Supabase client** for backend integration

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account
- (Optional) EAS CLI for mobile builds (`npm install -g eas-cli`)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd choirdinated
   npm install
   ```

2. **Install dependencies for all workspaces**
   ```bash
   cd web-admin && npm install
   cd ../mobile-app && npm install
   cd ../shared && npm install && npm run build
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

### Database Setup

1. **Create Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Get your project URL and anon key

2. **Run database migrations**
   ```bash
   cd web-admin
   npm run db:generate
   npm run db:migrate
   ```

3. **Set up Row Level Security (RLS)**
   - Enable RLS on all tables via Supabase dashboard
   - Configure storage buckets for file uploads

### Development

**Start web admin portal:**
```bash
npm run dev:web
# Accessible at http://localhost:3000
```

**Start mobile app:**
```bash
npm run dev:mobile
# Follow Expo CLI instructions to run on device/simulator
```

**Database management:**
```bash
npm run db:studio  # Opens Drizzle Studio for database inspection
```

## Core Features

### Member Management
- ✅ Comprehensive member lifecycle tracking
- ✅ Voice group/type assignments (SATB, SSAATTBB, SMATBB)
- ✅ Membership periods and leave management
- ✅ Emergency contact information

### Event Management
- ✅ Calendar with recurring events
- ✅ Attendance tracking (intention + actual)
- ✅ Holiday integration
- ✅ Calendar synchronization (iCal feeds)

### Sheet Music & Audio
- ✅ Digital sheet music archive
- ✅ Voice-specific audio files
- ✅ Setlist management
- ✅ Practice material organization

### Communication
- ✅ Targeted info feed (by voice group, membership type)
- ✅ Group chats per voice section
- ✅ Push notifications
- ✅ Member messaging

### Admin Features
- ✅ Role-based access control
- ✅ Configurable List of Values system
- ✅ Analytics and reporting
- ✅ Bulk operations

## Configuration

### Voice Configurations

The system supports multiple choir voice configurations:

- **SATB** - Traditional 4-part choir
- **SSAATTBB** - Symphonic 8-part choir with voice groups
- **SMATBB** - Operatic 6-part choir

### List of Values

Configurable categories include:
- User roles
- Voice types and groups
- Event types and statuses
- Membership types

## Deployment

### Web Admin (Vercel)
```bash
cd web-admin
vercel --prod
```

### Mobile App (EAS)
```bash
cd mobile-app
eas build --platform all
eas submit --platform all
```

## Project Goals

- **Target Market**: Large symphonic choirs and opera choirs
- **Competitors**: ChoirMate, Styreportalen
- **Languages**: English codebase, Norwegian UI
- **Focus**: Professional orchestral integration and advanced features

## Contributing

This is a professional choir management system designed for large-scale deployment. Please follow the established patterns for TypeScript, database schema, and component structure.

## License

Proprietary - All rights reserved.