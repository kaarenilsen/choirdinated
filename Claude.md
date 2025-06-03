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

### Core Domain Model

```typescript
// Member Management - Core Entity
interface Member {
  id: string
  user_profile_id: string
  choir_id: string
  membership_type_id: string
  voice_group_id: string // Required
  voice_type_id?: string // Optional subdivision
  birth_date: Date // Required
  notes?: string
}

interface MembershipPeriod {
  id: string
  member_id: string
  start_date: Date
  end_date?: Date // null if active
  membership_type_id: string
  voice_group_id: string
  voice_type_id?: string
  end_reason?: string
}

interface MembershipLeave {
  id: string
  member_id: string
  leave_type: string // 'maternity', 'work_travel', 'illness', 'personal'
  start_date: Date
  expected_return_date?: Date
  actual_return_date?: Date
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed'
  approved_by?: string
}

interface MembershipType {
  id: string
  choir_id: string
  name: string
  display_name: string
  is_active_membership: boolean // Included in "all" communications
  can_access_system: boolean // System access control
  can_vote: boolean
  sort_order: number
}

// Events & Attendance
interface Event {
  id: string
  title: string
  type_id: string
  status_id: string
  start_time: timestamp
  end_time: timestamp
  location: string
  attendance_mode: 'opt_in' | 'opt_out'
  target_membership_types: string[]
  target_voice_groups: string[]
  target_voice_types: string[]
  include_all_active: boolean
  is_recurring: boolean
  recurrence_rule?: RecurrenceRule
  exclude_holidays: boolean
}

interface EventAttendance {
  id: string
  event_id: string
  member_id: string
  intended_status: 'attending' | 'not_attending' | 'tentative' | 'not_responded'
  intended_reason?: string
  actual_status?: 'present' | 'absent' | 'late'
  marked_by?: string // Group leader
  marked_at?: timestamp
}

// List of Values - Dynamic Configuration
interface ListOfValues {
  id: string
  choir_id: string
  category: 'user_role' | 'voice_type' | 'voice_group' | 'event_type' | 'event_status'
  value: string
  display_name: string
  is_active: boolean
  sort_order: number
  parent_id?: string // For voice_type -> voice_group hierarchy
}
```

## Database Schema (Drizzle ORM)

```typescript
// Core Tables
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  birthDate: date('birth_date').notNull(),
  phone: text('phone'),
  emergencyContact: text('emergency_contact'),
  emergencyPhone: text('emergency_phone'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
})

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userProfileId: uuid('user_profile_id').references(() => userProfiles.id).notNull(),
  choirId: uuid('choir_id').references(() => choirs.id).notNull(),
  membershipTypeId: uuid('membership_type_id').references(() => membershipTypes.id).notNull(),
  voiceGroupId: uuid('voice_group_id').references(() => listOfValues.id).notNull(),
  voiceTypeId: uuid('voice_type_id').references(() => listOfValues.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
})

export const membershipPeriods = pgTable('membership_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  membershipTypeId: uuid('membership_type_id').references(() => membershipTypes.id).notNull(),
  voiceGroupId: uuid('voice_group_id').references(() => listOfValues.id).notNull(),
  voiceTypeId: uuid('voice_type_id').references(() => listOfValues.id),
  endReason: text('end_reason'),
  createdAt: timestamp('created_at').defaultNow()
})

export const membershipLeaves = pgTable('membership_leaves', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  leaveType: text('leave_type').notNull(),
  startDate: date('start_date').notNull(),
  expectedReturnDate: date('expected_return_date'),
  actualReturnDate: date('actual_return_date'),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('pending'),
  approvedBy: uuid('approved_by').references(() => userProfiles.id),
  approvedAt: timestamp('approved_at')
})

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  choirId: uuid('choir_id').references(() => choirs.id),
  title: text('title').notNull(),
  typeId: uuid('type_id').references(() => listOfValues.id),
  statusId: uuid('status_id').references(() => listOfValues.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  location: text('location').notNull(),
  attendanceMode: text('attendance_mode').notNull().default('opt_out'),
  targetMembershipTypes: jsonb('target_membership_types').default('[]'),
  targetVoiceGroups: jsonb('target_voice_groups').default('[]'),
  targetVoiceTypes: jsonb('target_voice_types').default('[]'),
  includeAllActive: boolean('include_all_active').default(true),
  isRecurring: boolean('is_recurring').default(false),
  excludeHolidays: boolean('exclude_holidays').default(true),
  createdBy: uuid('created_by').references(() => userProfiles.id)
})

export const eventAttendance = pgTable('event_attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id),
  memberId: uuid('member_id').references(() => members.id),
  intendedStatus: text('intended_status').notNull().default('not_responded'),
  intendedReason: text('intended_reason'),
  actualStatus: text('actual_status'),
  markedBy: uuid('marked_by').references(() => userProfiles.id),
  markedAt: timestamp('marked_at'),
  memberResponseAt: timestamp('member_response_at')
})
```

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

## Development Guidelines

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