import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/drizzle/db'
import { events, members, holidays } from '@/lib/drizzle/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { createEvent, type CreateEventInput } from '@/lib/drizzle/queries/events'
import { z } from 'zod'

const createRecurringEventSchema = z.object({
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
  recurrenceType: z.enum(['daily', 'weekly', 'monthly']),
  recurrenceInterval: z.number().min(1).max(52),
  recurrenceEndType: z.enum(['count', 'until']),
  recurrenceCount: z.number().min(1).max(365).optional(),
  recurrenceUntil: z.string().optional(),
  season: z.string().optional(),
})

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
    const validatedData = createRecurringEventSchema.parse(body)

    // Parse start and end times
    const startTime = new Date(validatedData.startTime)
    const endTime = new Date(validatedData.endTime)

    // Calculate duration
    const duration = endTime.getTime() - startTime.getTime()

    // Determine end date for recurrence
    let recurrenceEndDate: Date
    if (validatedData.recurrenceEndType === 'until' && validatedData.recurrenceUntil) {
      recurrenceEndDate = new Date(validatedData.recurrenceUntil)
    } else {
      // Calculate end date based on count
      const count = validatedData.recurrenceCount || 10
      recurrenceEndDate = new Date(startTime)
      
      switch (validatedData.recurrenceType) {
        case 'daily':
          recurrenceEndDate.setDate(recurrenceEndDate.getDate() + (count * validatedData.recurrenceInterval))
          break
        case 'weekly':
          recurrenceEndDate.setDate(recurrenceEndDate.getDate() + (count * validatedData.recurrenceInterval * 7))
          break
        case 'monthly':
          recurrenceEndDate.setMonth(recurrenceEndDate.getMonth() + (count * validatedData.recurrenceInterval))
          break
      }
    }

    // Get holidays if excluding them
    let holidayDates: Set<string> = new Set()
    if (validatedData.excludeHolidays) {
      const startDateStr = startTime.toISOString().split('T')[0]!
      const endDateStr = recurrenceEndDate.toISOString().split('T')[0]!
      
      const holidaysData = await db
        .select({ date: holidays.date })
        .from(holidays)
        .where(and(
          eq(holidays.isActive, true),
          gte(holidays.date, startDateStr),
          lte(holidays.date, endDateStr)
        ))
      
      holidayDates = new Set(holidaysData.map(h => h.date))
    }

    // Generate all event dates
    const eventDates: Date[] = []
    const current = new Date(startTime)
    
    while (current <= recurrenceEndDate && eventDates.length < 365) { // Safety limit
      const dateKey = current.toISOString().split('T')[0]!
      
      // Skip if it's a holiday and we're excluding holidays
      if (!holidayDates.has(dateKey)) {
        eventDates.push(new Date(current))
      }

      // Increment based on recurrence type
      switch (validatedData.recurrenceType) {
        case 'daily':
          current.setDate(current.getDate() + validatedData.recurrenceInterval)
          break
        case 'weekly':
          current.setDate(current.getDate() + (validatedData.recurrenceInterval * 7))
          break
        case 'monthly':
          current.setMonth(current.getMonth() + validatedData.recurrenceInterval)
          break
      }
    }

    // Create parent event first
    const baseEventInput: CreateEventInput = {
      choirId,
      title: validatedData.title,
      startTime,
      endTime,
      location: validatedData.location,
      attendanceMode: validatedData.attendanceMode,
      includeAllActive: validatedData.includeAllActive,
      createdBy: user.id,
    }

    // Add optional fields
    if (validatedData.description && validatedData.description !== '') {
      baseEventInput.description = validatedData.description
    }
    if (validatedData.typeId && validatedData.typeId !== '') {
      baseEventInput.typeId = validatedData.typeId
    }
    if (validatedData.statusId && validatedData.statusId !== '') {
      baseEventInput.statusId = validatedData.statusId
    }
    if (validatedData.targetMembershipTypes) {
      baseEventInput.targetMembershipTypes = validatedData.targetMembershipTypes
    }
    if (validatedData.targetVoiceGroups) {
      baseEventInput.targetVoiceGroups = validatedData.targetVoiceGroups
    }
    if (validatedData.targetVoiceTypes) {
      baseEventInput.targetVoiceTypes = validatedData.targetVoiceTypes
    }
    if (validatedData.notes && validatedData.notes !== '') {
      baseEventInput.notes = validatedData.notes
    }

    // Create the parent event with recurrence info
    const parentEvent = await db
      .insert(events)
      .values({
        ...baseEventInput,
        isRecurring: true,
        recurrenceRule: JSON.stringify({
          type: validatedData.recurrenceType,
          interval: validatedData.recurrenceInterval,
          endType: validatedData.recurrenceEndType,
          count: validatedData.recurrenceCount,
          until: validatedData.recurrenceUntil,
          season: validatedData.season,
        }),
        room: validatedData.room || null,
        calendarSyncEnabled: validatedData.calendarSyncEnabled,
        excludeHolidays: validatedData.excludeHolidays,
        setlistId: validatedData.setlistId && validatedData.setlistId !== '' ? validatedData.setlistId : null,
      })
      .returning()

    const parentEventId = parentEvent[0]!.id

    // Create individual event instances
    const createdEvents = []
    for (let i = 0; i < eventDates.length; i++) {
      const eventDate = eventDates[i]!
      const eventStartTime = new Date(eventDate)
      const eventEndTime = new Date(eventStartTime.getTime() + duration)

      const eventInput: CreateEventInput = {
        ...baseEventInput,
        title: `${validatedData.title}${validatedData.season ? ` (${validatedData.season})` : ''}`,
        startTime: eventStartTime,
        endTime: eventEndTime,
      }

      const event = await createEvent(eventInput)
      
      // Link to parent event
      await db
        .update(events)
        .set({ parentEventId })
        .where(eq(events.id, event.id))

      createdEvents.push(event)
    }

    return NextResponse.json({
      parentEvent: {
        ...parentEvent[0],
        startTime: parentEvent[0]!.startTime.toISOString(),
        endTime: parentEvent[0]!.endTime.toISOString(),
      },
      events: createdEvents.map(event => ({
        ...event,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
      })),
      totalCreated: createdEvents.length
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating recurring events:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create recurring events' },
      { status: 500 }
    )
  }
}