# Choirdinated - Choir Management System

**Target**: Large symphonic/opera choirs  
**Tech Stack**: Next.js + Drizzle ORM (Web), React Native + Expo (Mobile), Supabase  
**Domain**: English | **UI**: Norwegian  
**Supabase Project**: `uabjpfgamdkctrvfwnuq`

## Critical Security Requirements

**DATA ISOLATION**: It is absolutely critical that users NEVER see any data belonging to choirs they do not belong to. All queries, views, and API endpoints MUST enforce strict choir-level data isolation. This is a fundamental security requirement that must be enforced at every level:
- Database queries must ALWAYS filter by choir_id
- API endpoints must validate choir membership before returning ANY data
- Row Level Security (RLS) policies must enforce choir boundaries
- No cross-choir data leakage under any circumstances

## Architecture Overview

### Applications
1. **Web Admin Portal** - Next.js 14+, TypeScript, Drizzle ORM, shadcn/ui, Vercel
2. **Mobile Member App** - React Native + Expo, TypeScript, Supabase client

## Key Features

### Member Management
- **Complete lifecycle tracking** with membership periods and history
- **Leave management** with approval workflow (maternity, work travel, etc.)
- **Voice assignment** (required voice group + optional voice type)
- **System access control** based on membership type
- **Birth date required** for all members
- **Emergency contacts** and profile management

### Voice Organization
- **Configurable voice structures**:
  - **SATB**: Traditional four-part
  - **SSAATTBB**: Symphonic with 1st/2nd divisions
  - **SMATBB**: Operatic (Soprano, Mezzo, Alto, Tenor, Baritone, Bass)
- **Hierarchical**: Voice groups contain voice types
  - When targeting "Soprano", automatically includes "1. Soprano" and "2. Soprano"
  - Voice types inherit all permissions and targeting from their parent voice group
- **Dynamic targeting** for events and communications

### Event & Attendance System
- **Dual-phase attendance**: Member intention + Group leader recording
- **Smart targeting** by membership type, voice group/type
- **Leave integration** - excludes members on approved leave
- **Recurring events** with holiday filtering
- **Calendar sync** (iCal/vCal feeds)
- **Opt-in vs opt-out** attendance modes

### Web Admin Portal
- **Member registration** with user profile creation
- **Leave request approval** dashboard
- **List of Values configuration** (roles, voice types, event types)
- **Google Calendar-style** event management
- **Attendance analytics** with voice group breakdown
- **Member history** and period tracking

### Mobile Member App
- **"My Page"** with complete membership history
- **Leave request** functionality
- **Event attendance** registration with reasons
- **Voice group communications** and targeted info feed
- **Group leader tools** for attendance recording (swipe interface)

## Business Rules

### Membership Lifecycle
1. **Registration** creates user profile + member record + initial period
2. **Start dates** can be past/present/future - system access controlled accordingly
3. **Quitting** immediately deactivates system access
4. **Rejoining** creates new membership period, preserves history
5. **Never delete** members - only change status

### Leave Management
1. Members **apply via mobile app** with dates and reason
2. **Group leaders/conductors** approve requests
3. **Active leaves** exclude members from event attendance expectations
4. **Return tracking** with expected vs actual dates

### Event Targeting
1. **include_all_active=true**: All active members see event
2. **Specific targeting**: Select membership types, voice groups, voice types
3. **Leave impact**: Show unavailable count separately
4. **Group leader view**: Attendance for their voice section only

## Database Migration Guidelines

**CRITICAL**: All database changes MUST follow this exact workflow to maintain consistency across the project.

### Migration Workflow (MANDATORY)

1. **Always use Supabase migration system**
   ```bash
   # Create new migration
   supabase migration new <descriptive_name>
   
   # Edit the generated SQL file in supabase/migrations/
   # Add your schema changes (CREATE TABLE, ALTER TABLE, etc.)
   ```

2. **Supabase migrations are global to the project**
   - All schema changes affect the entire database
   - Migrations run in chronological order
   - Never edit existing migration files after they're applied

3. **Always run migrations with Supabase client**
   ```bash
   # Apply pending migrations
   supabase db push
   
   # OR for local development
   supabase migration up
   ```

4. **Sync Drizzle ORM model with database (MANDATORY)**
   ```bash
   # Navigate to shared/database
   cd shared/database
   
   # Regenerate types from live database
   npm run db:generate-types
   
   # Update Drizzle schema to match database
   # Manually sync src/types.ts with new database schema
   ```

5. **Build and install shared database module**
   ```bash
   # Build the shared database package
   cd shared/database
   npm run build
   
   # Install in both applications
   cd ../../web-admin
   npm install
   
   cd ../mobile-app  
   npm install
   ```

6. **Rebuild applications and fix compile errors**
   ```bash
   # Build web-admin and fix TypeScript errors
   cd web-admin
   npm run build
   # Fix any compilation errors from ORM model changes
   
   # Build mobile-app and fix TypeScript errors  
   cd ../mobile-app
   npm run build
   # Fix any compilation errors from ORM model changes
   ```

### Migration Best Practices

- **Test migrations locally first** using `supabase db reset` and `supabase migration up`
- **Always backup production** before applying migrations
- **Include RLS policies** in migration files when adding new tables
- **Maintain data isolation** - all new tables must include `choir_id` and appropriate RLS
- **Never break existing queries** - use backward-compatible changes when possible
- **Document breaking changes** in migration comments

### Example Migration Workflow

```sql
-- supabase/migrations/20250604120000_add_task_management.sql

-- Add task management tables
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  choir_id UUID NOT NULL REFERENCES choirs(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES user_profiles(id),
  due_date TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for data isolation
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access tasks from their choirs"
ON tasks FOR ALL
USING (choir_id IN (SELECT get_user_choir_ids()));
```

## Development Guidelines

### Database Query Guidelines (CRITICAL)

**ALWAYS use Drizzle ORM for database queries in the web-admin application**

- **Web Admin Portal**: MUST use Drizzle ORM for all database operations
- **Mobile App**: Use Supabase client (React Native environment)
- **API Routes**: Use Drizzle ORM for server-side database queries

**Why Drizzle ORM is mandatory for web-admin:**
- Type safety prevents runtime errors
- Complex joins are properly handled (LEFT JOIN vs INNER JOIN)
- Better handling of nullable relationships
- Consistent query patterns across the application
- Compile-time validation of schema changes

**Common anti-pattern to avoid:**
```typescript
// ❌ DON'T: Direct Supabase queries in web-admin
const { data } = await supabase
  .from('members')
  .select('*, user_profiles(*)')
  .eq('choir_id', choirId)

// ✅ DO: Use Drizzle ORM in API routes
const membersData = await db
  .select({
    member: members,
    userProfile: userProfiles,
  })
  .from(members)
  .leftJoin(userProfiles, eq(members.userProfileId, userProfiles.id))
  .where(eq(members.choirId, choirId))
```

**Implementation pattern:**
1. Create API routes using Drizzle ORM for database access
2. Client components fetch from API routes (not direct DB access)
3. Use proper authentication in API routes via Supabase auth helpers

### Code Organization
```
web-admin/
├── app/(dashboard)/
│   ├── members/        # Member management
│   ├── events/         # Event planning & attendance
│   ├── settings/       # List of Values configuration
├── lib/drizzle/
│   ├── queries/        # Type-safe database operations
│   └── schema.ts       # Database schema
└── components/ui/      # shadcn/ui components

mobile-app/
├── src/screens/
│   ├── members/        # My Page, profile, history
│   ├── events/         # Event list, attendance
│   ├── attendance/     # Group leader tools
└── src/services/       # Supabase integration
```

### Key Queries
```typescript
// Get current active members with voice assignments
export const getCurrentActiveMembers = async (choirId: string) => {
  return await db.select(/* member, userProfile, voiceGroup, voiceType */)
    .from(members)
    .innerJoin(membershipTypes, eq(membershipTypes.canAccessSystem, true))
    .where(eq(members.choirId, choirId))
}

// Calculate event attendance expectations excluding leaves
export const calculateEventAttendanceExpectation = async (eventId: string) => {
  // Get eligible members based on event targeting
  // Exclude members on approved leave during event
  // Return expected counts by voice group
}

// Member onboarding workflow
export const admitNewMember = async (memberData) => {
  return await db.transaction(async (tx) => {
    // Create user profile
    // Create member record  
    // Create initial membership period
  })
}
```

This system provides enterprise-level member management specifically designed for large symphonic and opera choirs, with complete flexibility for voice organization and sophisticated attendance tracking.