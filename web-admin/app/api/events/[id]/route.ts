import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/drizzle/db'
import { events, members, eventAttendance, listOfValues, userProfiles } from '@/lib/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { updateEventTargeting } from '@/lib/drizzle/queries/events'
import { z } from 'zod'

const updateEventSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  typeId: z.string().optional(),
  statusId: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  location: z.string().min(1, 'Location is required').optional(),
  room: z.string().optional(),
  attendanceMode: z.enum(['opt_in', 'opt_out']).optional(),
  targetMembershipTypes: z.array(z.string()).optional(),
  targetVoiceGroups: z.array(z.string()).optional(),
  targetVoiceTypes: z.array(z.string()).optional(),
  includeAllActive: z.boolean().optional(),
  notes: z.string().optional(),
  calendarSyncEnabled: z.boolean().optional(),
  excludeHolidays: z.boolean().optional(),
  setlistId: z.string().optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
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

    // Fetch event with related data
    const eventData = await db
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
      .where(and(
        eq(events.id, params.id),
        eq(events.choirId, choirId)
      ))
      .limit(1)

    if (!eventData.length) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const { event, eventType } = eventData[0]!

    // Get attendance records for this event
    const attendanceRecords = await db
      .select({
        attendance: eventAttendance,
        member: {
          id: members.id,
          userProfileId: members.userProfileId,
          voiceGroupId: members.voiceGroupId,
          voiceTypeId: members.voiceTypeId,
        },
        userProfile: userProfiles,
        voiceGroup: {
          id: listOfValues.id,
          value: listOfValues.value,
          displayName: listOfValues.displayName,
        },
      })
      .from(eventAttendance)
      .innerJoin(members, eq(eventAttendance.memberId, members.id))
      .leftJoin(userProfiles, eq(members.userProfileId, userProfiles.id))
      .leftJoin(listOfValues, and(
        eq(members.voiceGroupId, listOfValues.id),
        eq(listOfValues.category, 'voice_group')
      ))
      .where(eq(eventAttendance.eventId, params.id))

    // Calculate attendance summary with opt-out logic
    const explicitAttending = attendanceRecords.filter(a => a.attendance.intendedStatus === 'attending').length
    const notAttending = attendanceRecords.filter(a => a.attendance.intendedStatus === 'not_attending').length
    const tentative = attendanceRecords.filter(a => a.attendance.intendedStatus === 'tentative').length
    const notResponded = attendanceRecords.filter(a => a.attendance.intendedStatus === 'not_responded').length
    
    // For opt-out events, assume non-responders are attending
    const isOptOut = event.attendanceMode === 'opt_out'
    const effectiveAttending = isOptOut ? explicitAttending + notResponded : explicitAttending

    const attendanceSummary = {
      total: attendanceRecords.length,
      attending: effectiveAttending,
      notAttending,
      tentative,
      notResponded,
      present: attendanceRecords.filter(a => a.attendance.actualStatus === 'present').length,
      absent: attendanceRecords.filter(a => a.attendance.actualStatus === 'absent').length,
      late: attendanceRecords.filter(a => a.attendance.actualStatus === 'late').length,
    }

    return NextResponse.json({
      event: {
        ...event,
        eventType: eventType?.displayName || 'Annet',
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        attendanceSummary,
        attendanceRecords: attendanceRecords.map(({ attendance, member, userProfile, voiceGroup }) => ({
          ...attendance,
          memberId: member.id,
          memberName: userProfile?.name || 'Ukjent medlem',
          memberEmail: userProfile?.email || '',
          voiceGroup: voiceGroup?.displayName || 'Ikke tildelt',
          memberResponseAt: attendance.memberResponseAt?.toISOString(),
          markedAt: attendance.markedAt?.toISOString(),
        })),
      }
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Verify event exists and belongs to user's choir
    const existingEvent = await db
      .select({ id: events.id })
      .from(events)
      .where(and(
        eq(events.id, params.id),
        eq(events.choirId, choirId)
      ))
      .limit(1)

    if (!existingEvent.length) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateEventSchema.parse(body)

    // Prepare update data
    const updateData: Partial<typeof events.$inferInsert> = {}
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.typeId !== undefined && validatedData.typeId !== '') updateData.typeId = validatedData.typeId
    if (validatedData.statusId !== undefined && validatedData.statusId !== '') updateData.statusId = validatedData.statusId
    if (validatedData.startTime !== undefined) updateData.startTime = new Date(validatedData.startTime)
    if (validatedData.endTime !== undefined) updateData.endTime = new Date(validatedData.endTime)
    if (validatedData.location !== undefined) updateData.location = validatedData.location
    if (validatedData.room !== undefined) updateData.room = validatedData.room
    if (validatedData.attendanceMode !== undefined) updateData.attendanceMode = validatedData.attendanceMode
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.calendarSyncEnabled !== undefined) updateData.calendarSyncEnabled = validatedData.calendarSyncEnabled
    if (validatedData.excludeHolidays !== undefined) updateData.excludeHolidays = validatedData.excludeHolidays
    if (validatedData.setlistId !== undefined && validatedData.setlistId !== '') updateData.setlistId = validatedData.setlistId

    // Update basic event data
    if (Object.keys(updateData).length > 0) {
      await db
        .update(events)
        .set(updateData)
        .where(eq(events.id, params.id))
    }

    // Update targeting if provided
    if (
      validatedData.targetMembershipTypes !== undefined ||
      validatedData.targetVoiceGroups !== undefined ||
      validatedData.targetVoiceTypes !== undefined ||
      validatedData.includeAllActive !== undefined
    ) {
      const targeting: {
        targetMembershipTypes?: string[]
        targetVoiceGroups?: string[]
        targetVoiceTypes?: string[]
        includeAllActive?: boolean
      } = {}
      
      if (validatedData.targetMembershipTypes !== undefined) {
        targeting.targetMembershipTypes = validatedData.targetMembershipTypes
      }
      if (validatedData.targetVoiceGroups !== undefined) {
        targeting.targetVoiceGroups = validatedData.targetVoiceGroups
      }
      if (validatedData.targetVoiceTypes !== undefined) {
        targeting.targetVoiceTypes = validatedData.targetVoiceTypes
      }
      if (validatedData.includeAllActive !== undefined) {
        targeting.includeAllActive = validatedData.includeAllActive
      }
      
      await updateEventTargeting(params.id, targeting)
    }

    // Fetch updated event
    const [updatedEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, params.id))
      .limit(1)

    return NextResponse.json({
      event: {
        ...updatedEvent,
        startTime: updatedEvent!.startTime.toISOString(),
        endTime: updatedEvent!.endTime.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error updating event:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
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

    // Verify event exists and belongs to user's choir
    const existingEvent = await db
      .select({ id: events.id })
      .from(events)
      .where(and(
        eq(events.id, params.id),
        eq(events.choirId, choirId)
      ))
      .limit(1)

    if (!existingEvent.length) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Delete attendance records first (foreign key constraint)
    await db
      .delete(eventAttendance)
      .where(eq(eventAttendance.eventId, params.id))

    // Delete the event
    await db
      .delete(events)
      .where(eq(events.id, params.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}