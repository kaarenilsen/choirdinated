### Default List of Values Setup
```typescript
// lib/drizzle/migrations/seed-default-values.ts
export const seedDefaultListOfValues = async (choirId: string, configurationType: 'SATB' | 'SSAATTBB' | 'SMATBB' = 'SATB') => {
  const defaultValues: Partial<ListOfValues>[] = []

  // Default User Roles
  defaultValues.push(
    { choirId, category: 'user_role', value: 'admin', displayName: 'Administrator', sortOrder: 1 },
    { choirId, category: 'user_role', value: 'conductor', displayName: 'Dirigent', sortOrder: 2 },
    { choirId, category: 'user_role', value: 'assistant_conductor', displayName: 'Assisterende Dirigent', sortOrder: 3 },
    { choirId, category: 'user_role', value: 'section_leader', displayName: 'Stemmeleder', sortOrder: 4 },
    { choirId, category: 'user_role', value: 'member', displayName: 'Medlem', sortOrder: 5 },
    { choirId, category: 'user_role', value: 'guest', displayName: 'Gjest', sortOrder: 6 }
  )

  // Default Event Types
  defaultValues.push(
    { choirId, category: 'event_type', value: 'rehearsal', displayName: 'Øvelse', sortOrder: 1 },
    { choirId, category: 'event_type', value: 'concert', displayName: 'Konsert', sortOrder: 2 },
    { choirId, category: 'event_type', value: 'recording', displayName: 'Innspilling', sortOrder: 3 },
    { choirId, category: 'event_type', value: 'workshop', displayName: 'Workshop', sortOrder: 4 },
    { choirId, category: 'event_type', value: 'meeting', displayName: 'Møte', sortOrder: 5 },
    { choirId, category: 'event_type', value: 'social', displayName: 'Sosialt arrangement', sortOrder: 6 }
  )

  // Default Event Statuses
  defaultValues.push(
    { choirId, category: 'event_status', value: 'scheduled', displayName: 'Planlagt', sortOrder: 1 },
    { choirId, category: 'event_status', value: 'confirmed', displayName: 'Bekreftet', sortOrder: 2 },
    { choirId, category: 'event_status', value: 'cancelled', displayName: 'Avlyst', sortOrder: 3 },
    { choirId, category: 'event_status', value: 'completed', displayName: 'Gjennomført', sortOrder: 4 },
    { choirId, category: 'event_status', value: 'postponed', displayName: 'Utsatt', sortOrder: 5 }
  )

  // Voice configuration based on choir type
  switch (configurationType) {
    case 'SATB':
      // Traditional SATB
      defaultValues.push(
        { choirId, category: 'voice_type', value: 'soprano', displayName: 'Sopran', sortOrder: 1 },
        { choirId, category: 'voice_type', value: 'alto', displayName: 'Alt', sortOrder: 2 },
        { choirId, category: 'voice_type', value: 'tenor', displayName: 'Tenor', sortOrder: 3 },
        { choirId, category: 'voice_type', value: 'bass', displayName: 'Bass', sortOrder: 4 }
      )
      break

    case 'SSAATTBB':
      // Symphonic SSAATTBB with voice groups
      const voiceGroups = [
        { choirId, category: 'voice_group', value: 'soprano', displayName: 'Sopran', sortOrder: 1 },
        { choirId, category: 'voice_group', value: 'alto', displayName: 'Alt', sortOrder: 2 },
        { choirId, category: 'voice_group', value: 'tenor', displayName: 'Tenor', sortOrder: 3 },
        { choirId, category: 'voice_group', value: 'bass', displayName: 'Bass', sortOrder: 4 }
      ]
      
      // Insert voice groups first to get their IDs
      const insertedGroups = await db.insert(listOfValues).values(voiceGroups).returning()
      
      // Voice types within groups
      defaultValues.push(
        { choirId, category: 'voice_type', value: 'soprano_1', displayName: '1. Sopran', sortOrder: 1, parentId: insertedGroups[0].id },
        { choirId, category: 'voice_type', value: 'soprano_2', displayName: '2. Sopran', sortOrder: 2, parentId: insertedGroups[0].id },
        { choirId, category: 'voice_type', value: 'alto_1', displayName: '1. Alt', sortOrder: 3, parentId: insertedGroups[1].id },
        { choirId, category: 'voice_type', value: 'alto_2', displayName: '2. Alt', sortOrder: 4, parentId: insertedGroups[1].id },
        { choirId, category: 'voice_type', value: 'tenor_1', displayName: '1. Tenor', sortOrder: 5, parentId: insertedGroups[2].id },
        { choirId, category: 'voice_type', value: 'tenor_2', displayName: '2. Tenor', sortOrder: 6, parentId: insertedGroups[2].id },
        { choirId, category: 'voice_type', value: 'bass_1', displayName: '1. Bass', sortOrder: 7, parentId: insertedGroups[3].id },
        { choirId, category: 'voice_type', value: 'bass_2', displayName: '2. Bass', sortOrder: 8, parentId: insertedGroups[3].id }
      )
      break

    case 'SMATBB':
      // Operatic SMATBB
      defaultValues.push(
        { choirId, category: 'voice_type', value: 'soprano', displayName: 'Sopran', sortOrder: 1 },
        { choirId, category: 'voice_type', value: 'mezzo', displayName: 'Mezzosopran', sortOrder: 2 },
        { choirId, category: 'voice_type', value: 'alto', displayName: 'Alt', sortOrder: 3 },
        { choirId, category: 'voice_type', value: 'tenor', displayName: 'Tenor', sortOrder: 4 },
        { choirId, category: 'voice_type', value: 'baritone', displayName: 'Baryton', sortOrder: 5 },
        { choirId, category: 'voice_type', value: 'bass', displayName: 'Bass', sortOrder: 6 }
      )
      break
  }

  // Insert all remaining values
  if (defaultValues.length > 0) {
    await db.insert(listOfValues).values(defaultValues)
  }
}

// lib/utils/calendar-sync.ts
export const generateICalFeed = (events: Event[]): string => {
  const now = new Date()
  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ChorOS//ChorOS Calendar//NO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:ChorOS - Kor Kalender',
    'X-WR-TIMEZONE:Europe/Oslo',
    'X-WR-CALDESC:Kalender for korøvelser og konserter'
  ]

  events.forEach(event => {
    const startDate = formatICalDate(event.start_time)
    const endDate = formatICalDate(event.end_time)
    const uid = `${event.id}@choros.app`
    const dtstamp = formatICalDate(now)

    ical.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${escapeICalText(event.title)}`,
      `DESCRIPTION:${escapeICalText(event.description || '')}`,
      `LOCATION:${escapeICalText(event.location)}`,
      `STATUS:${event.status?.toUpperCase() || 'CONFIRMED'}`,
      'END:VEVENT'
    )
  })

  ical.push('END:VCALENDAR')
  return ical.join('\r\n')
}

const formatICalDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

const escapeICalText = (text: string): string => {
  return text.replace(/[\\,;]/g, '\\# lib/drizzle/migrations/seed-default-values.ts
export const seedDefaultListOfValues = async (choirId: string, configurationType: 'SATB' | 'SSAATTBB' | 'SMATBB' = 'SATB') => {
  const defaultValues: Partial<ListOfValues>[] = []

  // Default User Roles
  defaultValues.push(
    { choirId, category: 'user_role', value: 'admin', displayName: 'Administrator', sortOrder: 1 },
    { choirId, category: 'user_role', value: 'conductor', displayName: 'Dirigent', sortOrder: 2 },
    { choirId, category: 'user_role', value: 'assistant_conductor', displayName: 'Assisterende Dirigent', sortOrder: 3 },
    { choirId, category: 'user_role', value: 'section_leader', displayName: 'Stemmeleder', sortOrder: 4 },
    { choirId, category: 'user_role', value: 'member', displayName: 'Medlem', sortOrder: 5 },
    { choirId, category: 'user_role', value: 'guest', displayName: 'Gjest', sortOrder: 6 }
  )

  // Default Event Types
  defaultValues.push(
    { choirId, category: 'event_type', value: 'rehearsal', displayName: 'Øvelse', sortOrder: 1 },
    { choirId, category: 'event_type', value: 'concert', displayName: 'Konsert', sortOrder: 2 },
    { choirId, category: 'event_type', value: 'recording', displayName: 'Innspilling', sortOrder: 3 },
    { choirId, category: 'event_type', value: 'workshop', displayName: 'Workshop', sortOrder: 4 },
    { choirId, category: 'event_type', value: 'meeting', displayName: 'Møte', sortOrder: 5 },
    { choirId, category: 'event_type', value: 'social', displayName: 'Sosialt arrangement', sortOrder: 6 }
  )

  // Default Event Statuses
  defaultValues.push(
    { choirId, category: 'event_status', value: 'scheduled', displayName: 'Planlagt', sortOrder: 1 },
    { choirId, category: 'event_status', value: 'confirmed', displayName: 'Bekreftet', sortOrder: 2 },
    { choirId, category: 'event_status', value: 'cancelled', displayName: 'Avlyst', sortOrder: 3 },
    { choirId, category: 'event_status', value: 'completed', displayName: 'Gjennomført', sortOrder: 4 },
    { choirId, category: 'event_status', value: 'postponed', displayName: 'Utsatt', sortOrder: 5 }
  )

  // Voice configuration based on choir type
  switch (configurationType) {
    case 'SATB':
      // Traditional SATB
      defaultValues.push(
        { choirId, category: 'voice_type', value: 'soprano', displayName: 'Sopran', sortOrder: 1 },
        { choirId, category: 'voice_type', value: 'alto', displayName: 'Alt', sortOrder: 2 },
        { choirId, category: 'voice_type', value: 'tenor', displayName: 'Tenor', sortOrder: 3 },
        { choirId, category: 'voice_type', value: 'bass', displayName: 'Bass', sortOrder: 4 }
      )
      break

    case 'SSAATTBB':
      // Symphonic SSAATTBB with voice groups
      const voiceGroups = [
        { id: 'soprano_group', choirId, category: 'voice_group', value: 'soprano', displayName: 'Sopran', sortOrder: 1 },
        { id: 'alto_group', choirId, category: 'voice_group', value: 'alto', displayName: 'Alt', sortOrder: 2 },
        { id: 'tenor_group', choirId, category: 'voice_group', value: 'tenor', displayName: 'Tenor', sortOrder: 3 },
        { id: 'bass_group', choirId, category: 'voice_group', value: 'bass', displayName: 'Bass', sortOrder: 4 }
      ]
      defaultValues.push(...voiceGroups)

      // Voice types within groups
      defaultValues.push(
        { choirId, category: 'voice_type', value: 'soprano_1', displayName: '1. Sopran', sortOrder: 1, parentId: 'soprano_group' },
        { choirId, category: 'voice_type', value: 'soprano_2', displayName: '2. Sopran', sortOrder: 2, parentId: 'soprano_group' },
        { choirId, category: 'voice_type', value: 'alto_1', displayName: '1. Alt', sortOrder: 3, parentId: 'alto_group' },
        { choirId, category: 'voice_type', value: 'alto_2', displayName: '2. Alt', sortOrder: 4, parentId: 'alto_group' },
        { choirId, category: 'voice_type', value: 'tenor_1', displayName: '1. Tenor', sortOrder: 5, parentId: 'tenor_group' },
        { choirId, category: 'voice_type', value: 'tenor_2', displayName: '2. Tenor', sortOrder: 6, parentId: 'tenor_group' },
        { choirId, category: 'voice_type', value: 'bass_1', displayName: '1. Bass', sortOrder: 7, parentId: 'bass_group' },
        { choirId, category: 'voice_type', value: 'bass_2', displayName: '2. Bass', sortOrder').replace(/\n/g, '\\n')
}

// lib/utils/recurring-events.ts
export const getNextRecurrence = (currentDate: Date, rule: RecurrenceRule): Date => {
  const nextDate = new Date(currentDate)
  
  switch (rule.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + rule.interval)
      break
    case 'weekly':
      if (rule.days_of_week && rule.days_of_week.length > 0) {
        // Find next occurrence on specified days
        const currentDay = nextDate.getDay()
        const validDays = rule.days_of_week.sort((a, b) => a - b)
        
        let nextDay = validDays.find(day => day > currentDay)
        if (!nextDay) {
          // Move to next week and use first valid day
          nextDay = validDays[0]
          nextDate.setDate(nextDate.getDate() + (7 - currentDay + nextDay))
        } else {
          nextDate.setDate(nextDate.getDate() + (nextDay - currentDay))
        }
      } else {
        nextDate.setDate(nextDate.getDate() + (7 * rule.interval))
      }
      break
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + rule.interval)
      break
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + rule.interval)
      break
  }
  
  return nextDate
}

export const isHoliday = (date: Date, holidays: Holiday[]): boolean => {
  const dateString = date.toDateString()
  return holidays.some(holiday => 
    holiday.is_active && new Date(holiday.date).toDateString() === dateString
  )
}

// API Routes for Calendar Integration
// app/api/calendar/[choirId]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { choirId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') // Optional user-specific filtering
    
    const events = await generateCalendarFeed(params.choirId, userId || undefined)
    const icalContent = generateICalFeed(events)
    
    return new Response(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="choir-calendar.ics"',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    })
  } catch (error) {
    return Response.json({ error: 'Failed to generate calendar feed' }, { status: 500 })
  }
}
```

### Holiday Integration Setup
```typescript
// lib/drizzle/queries/holidays.ts
export const seedNorwegianHolidays = async (year: number = new Date().getFullYear()) => {
  const holidays = [
    { name: 'Nyttårsdag', date: new Date(year, 0, 1), region: 'NO' },
    { name: 'Skjærtorsdag', date: getEasterDate(year, -3), region: 'NO' },
    { name: 'Langfredag', date: getEasterDate(year, -2), region: 'NO' },
    { name: 'Første påskedag', date: getEasterDate(year, 0), region: 'NO' },
    { name: 'Andre påskedag', date: getEasterDate(year, 1), region: 'NO' },
    { name: 'Arbeidernes dag', date: new Date(year, 4, 1), region: 'NO' },
    { name: 'Grunnlovsdag', date: new Date(year, 4, 17), region: 'NO' },
    { name: 'Kristi himmelfartsdag', date: getEasterDate(year, 39), region: 'NO' },
    { name: 'Første pinsedag', date: getEasterDate(year, 49), region: 'NO' },
    { name: 'Andre pinsedag', date: getEasterDate(year, 50), region: 'NO' },
    { name: 'Julaften', date: new Date(year, 11, 24), region: 'NO' },
    { name: 'Første juledag', date: new Date(year, 11, 25), region: 'NO' },
    { name: 'Andre juledag', date: new Date(year, 11, 26), region: 'NO' },
    { name: 'Nyttårsaften', date: new Date(year, 11, 31), region: 'NO' }
  ]

  return await db.insert(holidaysTable).values(
    holidays.map(holiday => ({
      ...holiday,
      isActive: true
    }))
  ).onConflictDoNothing()
}

// Easter calculation for Norwegian holidays
const getEasterDate = (year: number, offset: number = 0): Date => {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  const easterDate = new Date(year, month - 1, day)
  easterDate.setDate(easterDate.getDate() + offset)
  return easterDate
}
```# Choir Management Application (ChorOS)

**Target Market**: Large symphonic choirs and opera choirs affiliated with symphony orchestras and national operas  
**Competitors**: Choirmate, Styreportalen  
**Domain Language**: English  
**UI Language**: Norwegian  

## Project Structure

This project consists of two main applications sharing a single Supabase backend:

1. **Mobile App** (React Native + Expo) - Member-focused
2. **Web Admin Portal** (Next.js) - Management-focused

### Technology Stack

**Shared Backend:**
- Supabase (Project ID: `uabjpfgamdkctrvfwnuq`)
- Supabase Auth for authentication
- PostgreSQL database
- Real-time subscriptions
- File storage for sheet music and audio

**Mobile App:**
- React Native + Expo
- TypeScript
- Supabase client
- Push notifications via Expo
- Audio playback capabilities
- PDF viewer for sheet music

**Web Admin Portal:**
- Next.js 14+ (App Router)
- TypeScript
- Drizzle ORM for type-safe database operations
- Tailwind CSS + shadcn/ui
- Supabase client (auth & real-time)
- File upload/management
- Based on `nextjs/saas-starter` template
- Deployed on Vercel

## Core Domain Entities

## Core Domain Entities

### Member Management System
```typescript
interface Member {
  id: string
  user_profile_id: string // Links to user authentication
  choir_id: string
  membership_type_id: string // References list_of_values for membership types
  voice_group_id: string // References list_of_values (required)
  voice_type_id?: string // References list_of_values (optional, for subdivisions)
  birth_date: Date // Required field
  phone?: string
  emergency_contact?: string
  emergency_phone?: string
  notes?: string
  created_at: timestamp
  updated_at: timestamp
}

interface MembershipPeriod {
  id: string
  member_id: string
  start_date: Date // When they started/returned to choir
  end_date?: Date // When they left (null if currently active)
  membership_type_id: string // Their role during this period
  voice_group_id: string // Voice group during this period
  voice_type_id?: string // Voice type during this period (can change)
  end_reason?: string // Why they left (if applicable)
  notes?: string
  created_at: timestamp
}

interface MembershipLeave {
  id: string
  member_id: string
  leave_type: string // 'maternity', 'work_travel', 'illness', 'personal', 'other'
  start_date: Date
  expected_return_date?: Date
  actual_return_date?: Date
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed'
  requested_at: timestamp
  approved_by?: string // User ID of approver
  approved_at?: timestamp
  notes?: string
}

interface MembershipType {
  id: string
  choir_id: string
  name: string
  display_name: string
  is_active_membership: boolean // If true, included in "all members" communications
  can_access_system: boolean // If false, user account is deactivated
  can_vote: boolean // For polls and decisions
  sort_order: number
  description?: string
  created_at: timestamp
}

// Default membership types configuration
const DEFAULT_MEMBERSHIP_TYPES = [
  { name: 'active_member', display_name: 'Aktivt medlem', is_active_membership: true, can_access_system: true, can_vote: true },
  { name: 'member_on_leave', display_name: 'Medlem i permisjon', is_active_membership: false, can_access_system: true, can_vote: false },
  { name: 'former_member', display_name: 'Tidligere medlem', is_active_membership: false, can_access_system: false, can_vote: false },
  { name: 'conductor', display_name: 'Dirigent', is_active_membership: true, can_access_system: true, can_vote: true },
  { name: 'rehearsal_aid', display_name: 'Repetitør', is_active_membership: true, can_access_system: true, can_vote: false },
  { name: 'voice_coach', display_name: 'Stemmetrener', is_active_membership: true, can_access_system: true, can_vote: false },
  { name: 'honorary_member', display_name: 'Æresmedlem', is_active_membership: false, can_access_system: true, can_vote: true }
]
```

### Enhanced User Profile
```typescript
interface UserProfile {
  id: string // Links to Supabase auth.users
  email: string
  name: string
  birth_date: Date // Required field
  phone?: string
  avatar_url?: string
  emergency_contact?: string
  emergency_phone?: string
  is_active: boolean // Controlled by membership status
  created_at: timestamp
  last_login?: timestamp
}
```

### Choir Organization & Configuration
```typescript
interface Choir {
  id: string
  name: string
  description?: string
  organization_type: 'opera' | 'symphony' | 'independent'
  founded_year?: number
  website?: string
  logo_url?: string
  settings: ChoirSettings
}

interface ChoirSettings {
  allow_member_messaging: boolean
  require_attendance_tracking: boolean
  auto_archive_events_after_days: number
  notification_preferences: NotificationSettings
  calendar_public_url?: string // For calendar sync/subscription
  default_event_duration_minutes: number
  holiday_calendar_region: string // For filtering public holidays
}

// List of Values System for Dynamic Configuration
interface ListOfValues {
  id: string
  choir_id: string
  category: 'user_role' | 'voice_type' | 'voice_group' | 'event_type' | 'event_status'
  value: string
  display_name: string
  description?: string
  is_active: boolean
  sort_order: number
  parent_id?: string // For hierarchical relationships (voice_type -> voice_group)
  metadata?: Record<string, any> // Additional configuration per value
}

// Voice Type Configuration Examples:
// Traditional SATB:
// - { category: 'voice_group', value: 'soprano', display_name: 'Soprano' }
// - { category: 'voice_group', value: 'alto', display_name: 'Alto' }
// - { category: 'voice_type', value: 'soprano', display_name: 'Soprano', parent_id: 'soprano_group_id' }

// Symphonic SSAATTBB:
// - { category: 'voice_group', value: 'soprano', display_name: 'Soprano' }
// - { category: 'voice_type', value: 'soprano_1', display_name: '1. Soprano', parent_id: 'soprano_group_id' }
// - { category: 'voice_type', value: 'soprano_2', display_name: '2. Soprano', parent_id: 'soprano_group_id' }

// Operatic SMATBB:
// - { category: 'voice_type', value: 'soprano', display_name: 'Soprano' }
// - { category: 'voice_type', value: 'mezzo', display_name: 'Mezzo-Soprano' }
// - { category: 'voice_type', value: 'alto', display_name: 'Alto' }
// - { category: 'voice_type', value: 'tenor', display_name: 'Tenor' }
// - { category: 'voice_type', value: 'baritone', display_name: 'Baritone' }
// - { category: 'voice_type', value: 'bass', display_name: 'Bass' }
```

### Enhanced Events & Attendance System
```typescript
interface Event {
  id: string
  title: string
  description?: string
  type_id: string // References list_of_values for event types
  status_id: string // References list_of_values for event status
  start_time: timestamp
  end_time: timestamp
  location: string
  setlist_id?: string
  attendance_mode: 'opt_in' | 'opt_out' // Members must register OR automatically attending
  target_membership_types: string[] // Which membership types should see this event
  target_voice_groups: string[] // Which voice groups should see this event
  target_voice_types: string[] // Which voice types should see this event
  include_all_active: boolean // If true, all active members see this regardless of specific targeting
  notes?: string
  created_by: string
  is_recurring: boolean
  recurrence_rule?: RecurrenceRule
  parent_event_id?: string
  exclude_holidays: boolean
  calendar_sync_enabled: boolean
  created_at: timestamp
}

interface EventAttendance {
  id: string
  event_id: string
  member_id: string // Links to Member, not User directly
  intended_status: 'attending' | 'not_attending' | 'tentative' | 'not_responded'
  intended_reason?: string // Why they can't attend (if not_attending)
  actual_status?: 'present' | 'absent' | 'late' // Recorded by group leader
  marked_by?: string // Group leader who recorded actual attendance
  marked_at?: timestamp
  member_response_at?: timestamp
  notes?: string
}

interface AttendanceExpectation {
  id: string
  event_id: string
  expected_total: number // Total expected based on active members
  on_leave_count: number // How many are on approved leave
  voice_group_breakdown: Record<string, {
    expected: number
    on_leave: number
  }>
  calculated_at: timestamp
}
```

### Sheet Music Archive
```typescript
interface SheetMusic {
  id: string
  title: string
  composer: string
  arranger?: string
  key_signature?: string
  time_signature?: string
  duration_minutes?: number
  difficulty_level: 1 | 2 | 3 | 4 | 5
  language: string
  genre?: string
  file_url: string
  file_type: 'pdf' | 'musicxml' | 'other'
  file_size_bytes: number
  uploaded_by: string
  uploaded_at: timestamp
  is_public: boolean
}

interface AudioFile {
  id: string
  sheet_music_id: string
  title: string
  voice_type_id?: string // References list_of_values for voice types
  voice_group_id?: string // References list_of_values for voice groups
  file_url: string
  duration_seconds: number
  file_size_bytes: number
  uploaded_by: string
  uploaded_at: timestamp
}

interface Setlist {
  id: string
  title: string
  description?: string
  created_by: string
  created_at: timestamp
  is_active: boolean
}

interface SetlistItem {
  id: string
  setlist_id: string
  sheet_music_id: string
  order_index: number
  notes?: string
}
```

### Enhanced Communication System
```typescript
interface InfoFeed {
  id: string
  title: string
  content: string
  author_id: string
  published_at: timestamp
  is_pinned: boolean
  target_membership_types: string[] // Which membership types should see this
  target_voice_groups: string[] // Which voice groups should see this
  target_voice_types: string[] // Which voice types should see this
  include_all_active: boolean // If true, all active members see this
  allows_comments: boolean
}

interface Chat {
  id: string
  name?: string
  type: 'direct' | 'group' | 'voice_section'
  voice_type_id?: string // For voice section chats
  voice_group_id?: string // For voice group chats
  membership_type_ids?: string[] // For role-based chats (e.g., group leaders)
  created_by: string
  created_at: timestamp
  is_active: boolean
}
```

## Mobile App Features

### Authentication & Onboarding
- Supabase Auth integration (email/password)
- User profile setup with voice type selection
- Secure token management
- Biometric login support (where available)

## Mobile App Features

### Member-Focused Dashboard
- **Upcoming events** with attendance status and deadlines
- **Personal attendance history** and statistics
- **Leave requests** status and history
- **Voice group announcements** and targeted info feed
- **Quick access** to current setlists and practice materials
- **My membership history** view with all periods and roles

### Member Profile & History ("My Page")
- **Personal information** management (birth date, contact info, emergency contacts)
- **Complete membership history** display:
  - All membership periods with start/end dates
  - Previous voice assignments
  - Leave periods with reasons and approvals
  - Role changes over time
- **Current status** overview (active, on leave, etc.)
- **Leave request functionality**:
  - Apply for leave with start/end dates
  - Select leave type (maternity, work travel, etc.)
  - Provide reason and expected return
  - Track approval status
- **Data correction** feedback form for membership history
- **Emergency contact** management

### Enhanced Events & Attendance
- **Event list** filtered by member's voice group/type and membership status
- **Attendance registration**:
  - Quick "attending/not attending" toggle
  - Reason field for non-attendance
  - Tentative option with notes
- **Leave impact** - events show if member is on approved leave
- **Group leader view** (for members with group leader role):
  - See attendance for their voice group
  - Swipe left/right attendance recording interface
  - Compare intended vs actual attendance
  - Mark late arrivals and no-shows

### Voice Group Communication
- **Voice group specific** info feed posts
- **Group chats** automatically created for each voice group
- **Group leader announcements** to their section
- **Cross-group messaging** for multi-section coordination
- **Leave notifications** to group leaders when members apply for leave

## Web Admin Portal Features

### Authentication & Access Control
- Supabase Auth integration
- Role-based access control (RBAC)
- Session management
- Password reset functionality

## Web Admin Portal Features

### Authentication & Access Control
- Supabase Auth integration
- Role-based access control (RBAC) using configurable List of Values
- Session management
- Password reset functionality

### Dashboard & Analytics
- **Member statistics** (active, by voice type/group)
- **Attendance analytics** with charts
- **Event participation** trends
- **Sheet music usage** statistics
- **Recent activity** feed
- **Quick actions** panel

### Enhanced Member Management
- **Comprehensive member registration** with user profile creation
- **Membership lifecycle** tracking with periods and transitions
- **Advanced search and filtering** by membership type, voice group/type, status
- **Bulk operations** (import, export, status changes)
- **Member admission workflow**:
  - Register new member with start date (past, present, or future)
  - Create linked user profile
  - Assign voice group (required) and voice type (optional)
  - Set initial membership type
  - Automatic system access control based on membership type
- **Membership history management**:
  - View complete member journey
  - Track all periods of membership
  - Record reasons for leaving/returning
  - Voice assignment changes over time
- **Leave management dashboard**:
  - Pending leave requests requiring approval
  - Active leaves with expected return dates
  - Leave history and patterns
  - Bulk approval/rejection capabilities
- **Voice group leadership tools**:
  - Assign group leaders to voice sections
  - Group leader attendance recording interface
  - Voice group specific communications
- **Data integrity features**:
  - Member feedback system for data corrections
  - Audit trail of all changes
  - Conflict detection for overlapping periods

### Advanced Event Management
- **Smart event targeting** based on membership types and voice assignments
- **Attendance expectation calculation**:
  - Automatic calculation of expected attendance
  - Exclude members on approved leave
  - Voice group breakdown of availability
- **Dual attendance system**:
  - Member intention registration (opt-in/opt-out)
  - Group leader actual attendance recording
  - Comparison and discrepancy reporting
- **Leave integration**:
  - Events automatically show leave impact
  - Expected vs available member counts
  - Voice group availability reports
- **Group leader workflow**:
  - Mobile swipe interface for attendance
  - See member intentions vs reality
  - Late/early departure tracking
  - Notes on attendance issues

### Event Management
- **Event creation wizard** with templates
- **Google Calendar-style interface** with drag-and-drop functionality
- **Recurring event creation** with recurrence rules (daily, weekly, monthly)
- **Holiday filtering** integration (automatically skip public holidays)
- **Copy/duplicate event** feature for easy rescheduling
- **Setlist assignment** to events
- **Attendance tracking** and reporting
- **Event templates** for rehearsals, concerts, recordings
- **Mass email/notifications** to attendees
- **Location management** with saved venues
- **Equipment/resource** planning
- **Calendar synchronization** (iCal/vCal export for phone/desktop calendars)

### Sheet Music Archive
- **Upload interface** with drag-and-drop
- **Metadata management** (composer, key, etc.)
- **Audio file attachment** to sheet music with voice type/group assignment
- **Bulk operations** (tag, organize, delete)
- **Version control** for sheet music updates
- **Access permissions** per piece
- **Usage analytics** per piece
- **Integration with IMSLP** for public domain works

### Setlist Management
- **Drag-and-drop** setlist builder
- **Template creation** for different event types
- **Repertoire planning** with difficulty progression
- **Performance history** tracking
- **Audio compilation** for entire setlists (by voice type/group)
- **Export functionality** (PDF programs, etc.)

### Communication Management
- **Info feed post editor** with rich text
- **Audience targeting** (roles, voice types, voice groups)
- **Scheduled publishing**
- **Engagement analytics** (views, comments)
- **Message moderation** tools
- **Broadcast messaging** capabilities

### Settings & Configuration
- **Choir profile** management
- **List of Values configuration** for:
  - User roles (admin, conductor, member, etc.)
  - Voice types and groups (SATB, SSAATTBB, SMATBB)
  - Event types (rehearsal, concert, recording, etc.)
  - Event statuses (scheduled, confirmed, cancelled, etc.)
- **Voice type hierarchy** setup (voice groups containing voice types)
- **Holiday calendar** configuration by region
- **Notification** templates and preferences
- **Integration settings** (calendar sync URLs, email)
- **Calendar export** settings (public iCal feeds)
- **Backup and export** tools
- **Audit logs** and activity tracking

### Calendar Features
- **Google Calendar-style UI** with month/week/day views
- **Drag-and-drop** event scheduling and rescheduling
- **Recurring event templates** with smart scheduling
- **Holiday integration** (automatically skip Easter, Christmas, etc.)
- **Public calendar feeds** (iCal/vCal format) for member phone/desktop sync
- **Event duplication** with bulk editing capabilities
- **Resource scheduling** (rooms, equipment)
- **Conflict detection** for overlapping events
- **Multi-choir calendar** view for organizations with multiple choirs

## Competitive Feature Parity

### ChoirMate Features Covered
- ✅ Practice lists (Setlists with audio)
- ✅ Sheet music with annotations
- ✅ Audio files per voice type
- ✅ Calendar with attendance tracking
- ✅ Member management with roles
- ✅ Messaging system
- ✅ Push notifications
- ✅ Polls/voting (via info feed comments)
- ✅ Web portal for administration

### Styreportalen Features Covered
- ✅ Member registry with flexibility
- ✅ Communication platform
- ✅ Document archive (sheet music)
- ✅ Calendar and meeting management
- ✅ Mobile app (Tutti equivalent)
- ✅ Role-based access control
- ✅ Reporting capabilities

### Advanced Features (Beyond Competitors)
- 🆕 **Professional orchestral integration**
- 🆕 **Advanced sheet music synchronization** with audio
- 🆕 **Multi-language support** (English domain/Norwegian UI)
- 🆕 **Real-time collaboration** on setlists
- 🆕 **Performance analytics** and progress tracking
- 🆕 **Integration capabilities** with professional music software
- 🆕 **Advanced attendance** and participation reporting
- 🆕 **Repertoire difficulty progression** planning
- 🆕 **Configurable List of Values** system for complete customization
- 🆕 **Hierarchical voice organization** (voice groups with voice types)
- 🆕 **Smart recurring events** with holiday filtering
- 🆕 **Calendar synchronization** (iCal/vCal feeds for phones/desktops)
- 🆕 **Multi-choir voice configurations** (SATB, SSAATTBB, SMATBB)
- 🆕 **Event duplication and templating** for efficient planning
- 🆕 **Public calendar feeds** for member calendar integration

## Database Schema Design

### Drizzle ORM Schema Definition
```typescript
// lib/drizzle/schema.ts
import { pgTable, uuid, text, boolean, timestamp, integer, jsonb, bigint, date } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Core User and Member Tables
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey(), // Links to Supabase auth.users
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  birthDate: date('birth_date').notNull(), // Required field
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  emergencyContact: text('emergency_contact'),
  emergencyPhone: text('emergency_phone'),
  isActive: boolean('is_active').default(true), // Controlled by membership status
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login')
})

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userProfileId: uuid('user_profile_id').references(() => userProfiles.id).notNull(),
  choirId: uuid('choir_id').references(() => choirs.id).notNull(),
  membershipTypeId: uuid('membership_type_id').references(() => membershipTypes.id).notNull(),
  voiceGroupId: uuid('voice_group_id').references(() => listOfValues.id).notNull(),
  voiceTypeId: uuid('voice_type_id').references(() => listOfValues.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const membershipTypes = pgTable('membership_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  choirId: uuid('choir_id').references(() => choirs.id).notNull(),
  name: text('name').notNull(), // Internal key like 'active_member'
  displayName: text('display_name').notNull(), // User-facing name like 'Aktivt medlem'
  isActiveMembership: boolean('is_active_membership').default(true),
  canAccessSystem: boolean('can_access_system').default(true),
  canVote: boolean('can_vote').default(true),
  sortOrder: integer('sort_order').default(0),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow()
})

export const membershipPeriods = pgTable('membership_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'), // null if currently active
  membershipTypeId: uuid('membership_type_id').references(() => membershipTypes.id).notNull(),
  voiceGroupId: uuid('voice_group_id').references(() => listOfValues.id).notNull(),
  voiceTypeId: uuid('voice_type_id').references(() => listOfValues.id),
  endReason: text('end_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
})

export const membershipLeaves = pgTable('membership_leaves', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  leaveType: text('leave_type').notNull(), // 'maternity', 'work_travel', 'illness', 'personal', 'other'
  startDate: date('start_date').notNull(),
  expectedReturnDate: date('expected_return_date'),
  actualReturnDate: date('actual_return_date'),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected', 'active', 'completed'
  requestedAt: timestamp('requested_at').defaultNow(),
  approvedBy: uuid('approved_by').references(() => userProfiles.id),
  approvedAt: timestamp('approved_at'),
  notes: text('notes')
})

export const choirs = pgTable('choirs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  organizationType: text('organization_type').notNull(),
  foundedYear: integer('founded_year'),
  website: text('website'),
  logoUrl: text('logo_url'),
  settings: jsonb('settings').default('{}'),
  createdAt: timestamp('created_at').defaultNow()
})

// List of Values - Dynamic Configuration System
export const listOfValues = pgTable('list_of_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  choirId: uuid('choir_id').references(() => choirs.id),
  category: text('category').notNull(), // 'voice_type', 'voice_group', 'event_type', 'event_status'
  value: text('value').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  parentId: uuid('parent_id').references(() => listOfValues.id), // For hierarchical relationships
  metadata: jsonb('metadata').default('{}'), // Additional configuration
  createdAt: timestamp('created_at').defaultNow()
})

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  choirId: uuid('choir_id').references(() => choirs.id),
  title: text('title').notNull(),
  description: text('description'),
  typeId: uuid('type_id').references(() => listOfValues.id),
  statusId: uuid('status_id').references(() => listOfValues.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  location: text('location').notNull(),
  setlistId: uuid('setlist_id').references(() => setlists.id),
  attendanceMode: text('attendance_mode').notNull().default('opt_out'), // 'opt_in' | 'opt_out'
  targetMembershipTypes: jsonb('target_membership_types').default('[]'),
  targetVoiceGroups: jsonb('target_voice_groups').default('[]'),
  targetVoiceTypes: jsonb('target_voice_types').default('[]'),
  includeAllActive: boolean('include_all_active').default(true),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => userProfiles.id),
  isRecurring: boolean('is_recurring').default(false),
  recurrenceRule: jsonb('recurrence_rule'),
  parentEventId: uuid('parent_event_id').references(() => events.id),
  excludeHolidays: boolean('exclude_holidays').default(true),
  calendarSyncEnabled: boolean('calendar_sync_enabled').default(true),
  createdAt: timestamp('created_at').defaultNow()
})

export const eventAttendance = pgTable('event_attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id),
  memberId: uuid('member_id').references(() => members.id), // Links to Member, not User directly
  intendedStatus: text('intended_status').notNull().default('not_responded'), // 'attending', 'not_attending', 'tentative', 'not_responded'
  intendedReason: text('intended_reason'), // Why they can't attend
  actualStatus: text('actual_status'), // 'present', 'absent', 'late' - recorded by group leader
  markedBy: uuid('marked_by').references(() => userProfiles.id), // Group leader who recorded attendance
  markedAt: timestamp('marked_at'),
  memberResponseAt: timestamp('member_response_at'),
  notes: text('notes')
})

export const attendanceExpectations = pgTable('attendance_expectations', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id),
  expectedTotal: integer('expected_total').notNull(),
  onLeaveCount: integer('on_leave_count').notNull(),
  voiceGroupBreakdown: jsonb('voice_group_breakdown').notNull(), // Record<string, {expected: number, on_leave: number}>
  calculatedAt: timestamp('calculated_at').defaultNow()
})

export const holidays = pgTable('holidays', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  date: date('date').notNull(),
  region: text('region').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
})

// Relations
export const membersRelations = relations(members, ({ one, many }) => ({
  userProfile: one(userProfiles, {
    fields: [members.userProfileId],
    references: [userProfiles.id]
  }),
  choir: one(choirs, {
    fields: [members.choirId],
    references: [choirs.id]
  }),
  membershipType: one(membershipTypes, {
    fields: [members.membershipTypeId],
    references: [membershipTypes.id]
  }),
  voiceGroup: one(listOfValues, {
    fields: [members.voiceGroupId],
    references: [listOfValues.id],
    relationName: 'member_voice_group'
  }),
  voiceType: one(listOfValues, {
    fields: [members.voiceTypeId],
    references: [listOfValues.id],
    relationName: 'member_voice_type'
  }),
  membershipPeriods: many(membershipPeriods),
  membershipLeaves: many(membershipLeaves),
  eventAttendance: many(eventAttendance)
}))

export const membershipPeriodsRelations = relations(membershipPeriods, ({ one }) => ({
  member: one(members, {
    fields: [membershipPeriods.memberId],
    references: [members.id]
  }),
  membershipType: one(membershipTypes, {
    fields: [membershipPeriods.membershipTypeId],
    references: [membershipTypes.id]
  }),
  voiceGroup: one(listOfValues, {
    fields: [membershipPeriods.voiceGroupId],
    references: [listOfValues.id],
    relationName: 'period_voice_group'
  }),
  voiceType: one(listOfValues, {
    fields: [membershipPeriods.voiceTypeId],
    references: [listOfValues.id],
    relationName: 'period_voice_type'
  })
}))

export const membershipLeavesRelations = relations(membershipLeaves, ({ one }) => ({
  member: one(members, {
    fields: [membershipLeaves.memberId],
    references: [members.id]
  }),
  approver: one(userProfiles, {
    fields: [membershipLeaves.approvedBy],
    references: [userProfiles.id]
  })
}))

export const eventAttendanceRelations = relations(eventAttendance, ({ one }) => ({
  event: one(events, {
    fields: [eventAttendance.eventId],
    references: [events.id]
  }),
  member: one(members, {
    fields: [eventAttendance.memberId],
    references: [members.id]
  }),
  markedByUser: one(userProfiles, {
    fields: [eventAttendance.markedBy],
    references: [userProfiles.id]
  })
}))

// Additional existing relations for other tables...
```

### Drizzle Configuration
```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './lib/drizzle/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!
  },
  verbose: true,
  strict: true
} satisfies Config
```

### Database Connection Setup
```typescript
// lib/drizzle/db.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })

export type DbClient = typeof db
```

## API Design

### RESTful Endpoints Structure
```typescript
// Authentication (handled by Supabase Auth)
POST /auth/signup
POST /auth/signin
POST /auth/signout
POST /auth/reset-password

// User Management
GET    /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id

// Events
GET    /api/events
POST   /api/events
GET    /api/events/:id
PATCH  /api/events/:id
DELETE /api/events/:id
POST   /api/events/:id/attendance
PATCH  /api/events/:id/attendance/:userId

// Sheet Music
GET    /api/sheet-music
POST   /api/sheet-music
GET    /api/sheet-music/:id
PATCH  /api/sheet-music/:id
DELETE /api/sheet-music/:id
POST   /api/sheet-music/:id/audio

// Setlists
GET    /api/setlists
POST   /api/setlists
GET    /api/setlists/:id
PATCH  /api/setlists/:id
DELETE /api/setlists/:id

// Communication
GET    /api/info-feed
POST   /api/info-feed
GET    /api/chats
POST   /api/chats
GET    /api/chats/:id/messages
POST   /api/chats/:id/messages
```

### Real-time Subscriptions (Supabase)
```typescript
// Real-time event attendance updates
const attendanceSubscription = supabase
  .channel('event-attendance')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'event_attendance'
  }, handleAttendanceUpdate)

// Real-time messaging
const messagesSubscription = supabase
  .channel(`chat-${chatId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `chat_id=eq.${chatId}`
  }, handleNewMessage)

// Info feed updates
const infoFeedSubscription = supabase
  .channel('info-feed')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'info_feed'
  }, handleInfoFeedUpdate)
```

## Development Guidelines

### Code Organization (Following nextjs/saas-starter)
```
web-admin/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── members/
│   │   ├── events/
│   │   ├── sheet-music/
│   │   ├── setlists/
│   │   └── settings/
│   ├── api/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/ (shadcn/ui components)
│   ├── forms/
│   ├── tables/
│   └── charts/
├── lib/
│   ├── drizzle/
│   │   ├── db.ts
│   │   ├── schema.ts
│   │   ├── queries/
│   │   └── migrations/
│   ├── supabase/
│   ├── utils.ts
│   ├── auth.ts
│   └── validations.ts
├── types/
│   └── database.ts
├── drizzle/
│   ├── migrations/
│   └── meta/
├── drizzle.config.ts
└── middleware.ts

mobile-app/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   └── navigation/
│   ├── screens/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── events/
│   │   ├── sheet-music/
│   │   ├── messaging/
│   │   └── profile/
│   ├── services/
│   │   ├── supabase.ts
│   │   ├── auth.ts
│   │   ├── notifications.ts
│   │   └── audio.ts
│   ├── types/
│   ├── utils/
│   └── constants/
├── App.tsx
└── app.json
```

### TypeScript Standards
- **Strict mode enabled** in tsconfig.json
- **Interface over type** for object definitions
- **Utility types** for API responses and form data
- **Branded types** for IDs to prevent mixing
- **Zod schemas** for runtime validation

### Functional Programming Principles
- **Pure functions** wherever possible
- **Immutable data structures**
- **Function composition** over inheritance
- **Custom hooks** for React logic reuse
- **Higher-order functions** for common patterns

### Database Query Examples with Drizzle
```typescript
// lib/drizzle/queries/members.ts
import { db } from '../db'
import { members, membershipPeriods, membershipTypes, membershipLeaves, userProfiles, listOfValues } from '../schema'
import { eq, and, isNull, desc, gte, lte, or } from 'drizzle-orm'

export const getCurrentActiveMembers = async (choirId: string) => {
  return await db
    .select({
      member: members,
      userProfile: userProfiles,
      membershipType: membershipTypes,
      voiceGroup: {
        id: voiceGroup.id,
        displayName: voiceGroup.displayName
      },
      voiceType: {
        id: voiceType.id,
        displayName: voiceType.displayName
      }
    })
    .from(members)
    .innerJoin(userProfiles, eq(members.userProfileId, userProfiles.id))
    .innerJoin(membershipTypes, eq(members.membershipTypeId, membershipTypes.id))
    .innerJoin(listOfValues.as('voiceGroup'), eq(members.voiceGroupId, voiceGroup.id))
    .leftJoin(listOfValues.as('voiceType'), eq(members.voiceTypeId, voiceType.id))
    .where(
      and(
        eq(members.choirId, choirId),
        eq(membershipTypes.canAccessSystem, true),
        eq(userProfiles.isActive, true)
      )
    )
}

export const getMemberHistory = async (memberId: string) => {
  return await db
    .select({
      period: membershipPeriods,
      membershipType: membershipTypes,
      voiceGroup: {
        id: voiceGroup.id,
        displayName: voiceGroup.displayName
      },
      voiceType: {
        id: voiceType.id,
        displayName: voiceType.displayName
      }
    })
    .from(membershipPeriods)
    .innerJoin(membershipTypes, eq(membershipPeriods.membershipTypeId, membershipTypes.id))
    .innerJoin(listOfValues.as('voiceGroup'), eq(membershipPeriods.voiceGroupId, voiceGroup.id))
    .leftJoin(listOfValues.as('voiceType'), eq(membershipPeriods.voiceTypeId, voiceType.id))
    .where(eq(membershipPeriods.memberId, memberId))
    .orderBy(desc(membershipPeriods.startDate))
}

export const getMembersOnLeave = async (choirId: string, dateRange?: { start: Date, end: Date }) => {
  let query = db
    .select({
      member: members,
      userProfile: userProfiles,
      leave: membershipLeaves,
      voiceGroup: {
        id: voiceGroup.id,
        displayName: voiceGroup.displayName
      }
    })
    .from(membershipLeaves)
    .innerJoin(members, eq(membershipLeaves.memberId, members.id))
    .innerJoin(userProfiles, eq(members.userProfileId, userProfiles.id))
    .innerJoin(listOfValues.as('voiceGroup'), eq(members.voiceGroupId, voiceGroup.id))
    .where(
      and(
        eq(members.choirId, choirId),
        eq(membershipLeaves.status, 'approved')
      )
    )

  if (dateRange) {
    query = query.where(
      and(
        lte(membershipLeaves.startDate, dateRange.end),
        or(
          isNull(membershipLeaves.actualReturnDate),
          gte(membershipLeaves.actualReturnDate, dateRange.start)
        )
      )
    )
  }

  return await query
}

export const calculateEventAttendanceExpectation = async (eventId: string) => {
  // Get event details to know target audience
  const event = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)

  if (event.length === 0) return null

  const eventData = event[0]
  
  // Get all members who should see this event
  let membersQuery = db
    .select({
      memberId: members.id,
      voiceGroupId: members.voiceGroupId,
      membershipType: membershipTypes
    })
    .from(members)
    .innerJoin(membershipTypes, eq(members.membershipTypeId, membershipTypes.id))
    .where(eq(members.choirId, eventData.choirId))

  // Apply targeting filters
  if (!eventData.includeAllActive) {
    // Apply specific targeting rules
    const targetMembershipTypes = eventData.targetMembershipTypes as string[]
    const targetVoiceGroups = eventData.targetVoiceGroups as string[]
    
    if (targetMembershipTypes.length > 0 || targetVoiceGroups.length > 0) {
      membersQuery = membersQuery.where(
        or(
          targetMembershipTypes.length > 0 ? 
            eq(members.membershipTypeId, targetMembershipTypes[0]) : undefined,
          targetVoiceGroups.length > 0 ? 
            eq(members.voiceGroupId, targetVoiceGroups[0]) : undefined
        )
      )
    }
  } else {
    // Include all active members
    membersQuery = membersQuery.where(eq(membershipTypes.isActiveMembership, true))
  }

  const eligibleMembers = await membersQuery

  // Get members on leave during the event
  const membersOnLeave = await db
    .select({
      memberId: membershipLeaves.memberId,
      voiceGroupId: members.voiceGroupId
    })
    .from(membershipLeaves)
    .innerJoin(members, eq(membershipLeaves.memberId, members.id))
    .where(
      and(
        eq(membershipLeaves.status, 'approved'),
        lte(membershipLeaves.startDate, eventData.startTime),
        or(
          isNull(membershipLeaves.actualReturnDate),
          gte(membershipLeaves.actualReturnDate, eventData.startTime)
        )
      )
    )

  // Calculate expectations
  const totalExpected = eligibleMembers.length
  const onLeaveCount = membersOnLeave.length
  
  // Voice group breakdown
  const voiceGroupBreakdown: Record<string, { expected: number, on_leave: number }> = {}
  
  eligibleMembers.forEach(member => {
    const voiceGroupId = member.voiceGroupId
    if (!voiceGroupBreakdown[voiceGroupId]) {
      voiceGroupBreakdown[voiceGroupId] = { expected: 0, on_leave: 0 }
    }
    voiceGroupBreakdown[voiceGroupId].expected++
  })

  membersOnLeave.forEach(member => {
    const voiceGroupId = member.voiceGroupId
    if (voiceGroupBreakdown[voiceGroupId]) {
      voiceGroupBreakdown[voiceGroupId].on_leave++
    }
  })

  // Store the calculation
  await db.insert(attendanceExpectations).values({
    eventId,
    expectedTotal: totalExpected,
    onLeaveCount,
    voiceGroupBreakdown
  })

  return {
    expectedTotal: totalExpected,
    onLeaveCount,
    voiceGroupBreakdown
  }
}

// Member onboarding workflow
export const admitNewMember = async (memberData: {
  email: string
  name: string
  birthDate: Date
  phone?: string
  emergencyContact?: string
  emergencyPhone?: string
  choirId: string
  membershipTypeId: string
  voiceGroupId: string
  voiceTypeId?: string
  startDate: Date
  notes?: string
}) => {
  return await db.transaction(async (tx) => {
    // Create user profile
    const userProfile = await tx.insert(userProfiles).values({
      email: memberData.email,
      name: memberData.name,
      birthDate: memberData.birthDate,
      phone: memberData.phone,
      emergencyContact: memberData.emergencyContact,
      emergencyPhone: memberData.emergencyPhone,
      isActive: true
    }).returning()

    // Create member record
    const member = await tx.insert(members).values({
      userProfileId: userProfile[0].id,
      choirId: memberData.choirId,
      membershipTypeId: memberData.membershipTypeId,
      voiceGroupId: memberData.voiceGroupId,
      voiceTypeId: memberData.voiceTypeId,
      notes: memberData.notes
    }).returning()

    // Create initial membership period
    await tx.insert(membershipPeriods).values({
      memberId: member[0].id,
      startDate: memberData.startDate,
      membershipTypeId: memberData.membershipTypeId,
      voiceGroupId: memberData.voiceGroupId,
      voiceTypeId: memberData.voiceTypeId
    })

    return { userProfile: userProfile[0], member: member[0] }
  })
}
```

### DRY Principle Implementation
- **Shared types** between mobile and web (exported from Drizzle schema)
- **Common utility functions** in shared packages
- **Reusable components** with consistent APIs
- **Drizzle query builders** to avoid SQL duplication and ensure type safety
- **Validation schemas** shared across client and server
- **Type-safe database operations** with Drizzle ORM relations

### Error Handling Strategy
```typescript
// Result type for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

// API error responses
interface APIError {
  code: string
  message: string
  details?: Record<string, any>
}

// Service layer error handling with Drizzle
const getSheetMusic = async (id: string): Promise<Result<SheetMusic, APIError>> => {
  try {
    const result = await db
      .select()
      .from(sheetMusic)
      .where(eq(sheetMusic.id, id))
      .limit(1)
    
    if (result.length === 0) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Sheet music not found' } }
    }
    
    return { success: true, data: result[0] }
  } catch (error) {
    return { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch sheet music' } }
  }
}
```

### Package.json Dependencies for Drizzle
```json
{
  "dependencies": {
    "drizzle-orm": "^0.29.0",
    "postgres": "^3.4.3"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0"
  },
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

## Deployment Strategy

### Supabase Configuration
```sql
-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_music ENABLE ROW LEVEL SECURITY;
-- ... additional RLS policies

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('sheet-music-files', 'sheet-music-files', false),
  ('audio-files', 'audio-files', false),
  ('avatars', 'avatars', true);
```

### Vercel Deployment (Web Admin)
```bash
# Environment variables
NEXT_PUBLIC_SUPABASE_URL=https://uabjpfgamdkctrvfwnuq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/postgres
AUTH_SECRET=your_auth_secret

# Build and deploy
vercel --prod

# Run Drizzle migrations in production
npm run db:migrate
```

### Expo EAS Build (Mobile App)
```json
// eas.json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./android-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your-apple-id",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

## Testing Strategy

### Unit Testing
- **Vitest** for web application
- **Jest** for mobile application  
- **React Testing Library** for component testing
- **MSW (Mock Service Worker)** for API mocking

### Integration Testing
- **Playwright** for E2E web testing
- **Detox** for mobile E2E testing
- **Supabase local development** for database testing

### Performance Testing
- **Lighthouse CI** for web performance
- **Flipper** for React Native performance monitoring
- **Sentry** for error tracking and performance monitoring

## Security Considerations

### Authentication & Authorization
- **JWT tokens** stored securely (httpOnly cookies for web, secure storage for mobile)
- **Row Level Security** on all Supabase tables
- **Role-based access control** with principle of least privilege
- **API rate limiting** to prevent abuse

### Data Protection
- **File upload validation** and virus scanning
- **Input sanitization** for all user content
- **CORS configuration** for cross-origin requests
- **Content Security Policy** headers

### Privacy & GDPR Compliance
- **Data retention policies** for inactive accounts
- **User data export** functionality
- **Right to be forgotten** implementation
- **Privacy policy** and terms of service

## Monitoring & Analytics

### Application Monitoring
- **Sentry** for error tracking and performance
- **Vercel Analytics** for web traffic
- **Supabase Dashboard** for database metrics
- **Custom analytics** for user engagement

### Business Metrics
- **Active user counts** (daily/weekly/monthly)
- **Feature usage** statistics
- **Event attendance** rates
- **Sheet music** access patterns
- **Message engagement** metrics

This specification provides a comprehensive foundation for building a professional choir management application that meets the needs of large symphonic and opera choirs while maintaining competitive feature parity with existing solutions in the Norwegian market.