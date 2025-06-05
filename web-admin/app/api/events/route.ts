import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/drizzle/db'
import { events, members, eventAttendance, listOfValues } from '@/lib/drizzle/schema'
import { eq, and, gte, desc, inArray } from 'drizzle-orm'
import { createEvent, type CreateEventInput } from '@/lib/drizzle/queries/events'
import { z } from 'zod'

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  typeId: z.string().optional(),
  statusId: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().min(1, 'Location is required'),
  room: z.string().optional(),
  attendanceMode: z.enum(['opt_in', 'opt_out']),
  targetMembershipTypes: z.array(z.string()).optional(),
  targetVoiceGroups: z.array(z.string()).optional(),
  targetVoiceTypes: z.array(z.string()).optional(),
  includeAllActive: z.boolean().default(false),
  notes: z.string().optional(),
  calendarSyncEnabled: z.boolean().default(true),
  excludeHolidays: z.boolean().default(true),
  setlistId: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's choir ID
    const userMemberships = await db
      .select({ choirId: members.choirId })
      .from(members)
      .where(eq(members.userProfileId, user.id))
      .limit(1)

    if (!userMemberships.length) {
      return NextResponse.json({ error: 'User has no choir membership' }, { status: 403 })
    }

    const choirId = userMemberships[0]!.choirId
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')

    // Build query conditions
    let whereConditions = eq(events.choirId, choirId)
    
    if (from) {
      whereConditions = and(whereConditions, gte(events.startTime, new Date(from)))!
    }

    // Fetch events with attendance summary
    const eventsData = await db
      .select({
        event: events,
        eventType: {
          id: listOfValues.id,
          value: listOfValues.value,
          displayName: listOfValues.displayName,
        },
      })
      .from(events)
      .leftJoin(listOfValues, and(
        eq(events.typeId, listOfValues.id),
        eq(listOfValues.category, 'event_type')
      ))
      .where(whereConditions)
      .orderBy(desc(events.startTime))

    // Get attendance counts for each event
    const eventIds = eventsData.map(e => e.event.id)
    let attendanceCounts: Array<{
      eventId: string | null
      intendedStatus: string
      actualStatus: string | null
    }> = []
    
    if (eventIds.length > 0) {
      attendanceCounts = await db
        .select({
          eventId: eventAttendance.eventId,
          intendedStatus: eventAttendance.intendedStatus,
          actualStatus: eventAttendance.actualStatus,
        })
        .from(eventAttendance)
        .where(inArray(eventAttendance.eventId, eventIds))
    }

    // Calculate attendance summary for each event
    const eventsWithAttendance = eventsData.map(({ event, eventType }) => {
      const eventAttendanceRecords = attendanceCounts.filter(a => a.eventId === event.id)
      
      // Apply opt-out logic
      const explicitAttending = eventAttendanceRecords.filter(a => a.intendedStatus === 'attending').length
      const notAttending = eventAttendanceRecords.filter(a => a.intendedStatus === 'not_attending').length
      const tentative = eventAttendanceRecords.filter(a => a.intendedStatus === 'tentative').length
      const notResponded = eventAttendanceRecords.filter(a => a.intendedStatus === 'not_responded').length
      
      // For opt-out events, assume non-responders are attending
      const isOptOut = event.attendanceMode === 'opt_out'
      const effectiveAttending = isOptOut ? explicitAttending + notResponded : explicitAttending
      
      const attendanceSummary = {
        total: eventAttendanceRecords.length,
        attending: effectiveAttending,
        notAttending,
        tentative,
        notResponded,
        present: eventAttendanceRecords.filter(a => a.actualStatus === 'present').length,
        absent: eventAttendanceRecords.filter(a => a.actualStatus === 'absent').length,
        late: eventAttendanceRecords.filter(a => a.actualStatus === 'late').length,
      }

      return {
        ...event,
        eventType: eventType?.displayName || 'Annet',
        attendanceSummary,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
      }
    })

    return NextResponse.json({
      events: eventsWithAttendance,
      choirId
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's choir ID
    const userMemberships = await db
      .select({ choirId: members.choirId })
      .from(members)
      .where(eq(members.userProfileId, user.id))
      .limit(1)

    if (!userMemberships.length) {
      return NextResponse.json({ error: 'User has no choir membership' }, { status: 403 })
    }

    const choirId = userMemberships[0]!.choirId
    const body = await request.json()
    
    // Validate input
    const validatedData = createEventSchema.parse(body)

    // Create event input
    const eventInput: CreateEventInput = {
      choirId,
      title: validatedData.title,
      startTime: new Date(validatedData.startTime),
      endTime: new Date(validatedData.endTime),
      location: validatedData.location,
      attendanceMode: validatedData.attendanceMode,
      includeAllActive: validatedData.includeAllActive,
      createdBy: user.id,
    }

    // Add optional fields only if they are defined and not empty
    if (validatedData.description !== undefined && validatedData.description !== '') {
      eventInput.description = validatedData.description
    }
    if (validatedData.typeId !== undefined && validatedData.typeId !== '') {
      eventInput.typeId = validatedData.typeId
    }
    if (validatedData.statusId !== undefined && validatedData.statusId !== '') {
      eventInput.statusId = validatedData.statusId
    }
    if (validatedData.targetMembershipTypes !== undefined) {
      eventInput.targetMembershipTypes = validatedData.targetMembershipTypes
    }
    if (validatedData.targetVoiceGroups !== undefined) {
      eventInput.targetVoiceGroups = validatedData.targetVoiceGroups
    }
    if (validatedData.targetVoiceTypes !== undefined) {
      eventInput.targetVoiceTypes = validatedData.targetVoiceTypes
    }
    if (validatedData.notes !== undefined && validatedData.notes !== '') {
      eventInput.notes = validatedData.notes
    }

    const event = await createEvent(eventInput)

    return NextResponse.json({
      event: {
        ...event,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}