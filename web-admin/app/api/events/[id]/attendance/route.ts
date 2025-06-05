import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/drizzle/db'
import { events, members, eventAttendance, userProfiles, listOfValues } from '@/lib/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { getEventAttendanceByVoiceGroup } from '@/lib/drizzle/queries/events'
import { z } from 'zod'

const memberAttendanceResponseSchema = z.object({
  intendedStatus: z.enum(['attending', 'not_attending', 'tentative']),
  intendedReason: z.string().optional(),
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

    // Verify event exists and belongs to user's choir
    const existingEvent = await db
      .select({ id: events.id, title: events.title, attendanceMode: events.attendanceMode })
      .from(events)
      .where(and(
        eq(events.id, params.id),
        eq(events.choirId, choirId)
      ))
      .limit(1)

    if (!existingEvent.length) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get detailed attendance records with member information
    const attendanceRecords = await db
      .select({
        attendance: eventAttendance,
        member: members,
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

    // Get voice group breakdown
    const voiceGroupBreakdown = await getEventAttendanceByVoiceGroup(params.id)

    // Transform attendance records for frontend
    const attendanceList = attendanceRecords.map(({ attendance, member, userProfile, voiceGroup }) => ({
      id: attendance.id,
      memberId: member.id,
      memberName: userProfile?.name || 'Ukjent medlem',
      memberEmail: userProfile?.email || '',
      voiceGroup: voiceGroup?.displayName || 'Ikke tildelt',
      intendedStatus: attendance.intendedStatus,
      intendedReason: attendance.intendedReason,
      actualStatus: attendance.actualStatus,
      notes: attendance.notes,
      memberResponseAt: attendance.memberResponseAt?.toISOString(),
      markedAt: attendance.markedAt?.toISOString(),
      markedBy: attendance.markedBy,
    }))

    // Apply opt-out logic to summary
    const explicitAttending = attendanceList.filter(a => a.intendedStatus === 'attending').length
    const notAttending = attendanceList.filter(a => a.intendedStatus === 'not_attending').length
    const tentative = attendanceList.filter(a => a.intendedStatus === 'tentative').length
    const notResponded = attendanceList.filter(a => a.intendedStatus === 'not_responded').length
    
    // For opt-out events, assume non-responders are attending
    const isOptOut = existingEvent[0]!.attendanceMode === 'opt_out'
    const effectiveAttending = isOptOut ? explicitAttending + notResponded : explicitAttending

    return NextResponse.json({
      eventId: params.id,
      eventTitle: existingEvent[0]!.title,
      attendance: attendanceList,
      voiceGroupBreakdown,
      summary: {
        total: attendanceList.length,
        attending: effectiveAttending,
        notAttending,
        tentative,
        notResponded,
        present: attendanceList.filter(a => a.actualStatus === 'present').length,
        absent: attendanceList.filter(a => a.actualStatus === 'absent').length,
        late: attendanceList.filter(a => a.actualStatus === 'late').length,
      }
    })
  } catch (error) {
    console.error('Error fetching event attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event attendance' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's member record
    const userMemberRecord = await db
      .select({ 
        id: members.id,
        choirId: members.choirId,
      })
      .from(members)
      .where(eq(members.userProfileId, user.id))
      .limit(1)

    if (!userMemberRecord.length) {
      return NextResponse.json({ error: 'User has no choir membership' }, { status: 403 })
    }

    const memberId = userMemberRecord[0]!.id
    const choirId = userMemberRecord[0]!.choirId

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
    const validatedData = memberAttendanceResponseSchema.parse(body)

    // Update or create attendance record for the member
    const existingAttendance = await db
      .select({ id: eventAttendance.id })
      .from(eventAttendance)
      .where(and(
        eq(eventAttendance.eventId, params.id),
        eq(eventAttendance.memberId, memberId)
      ))
      .limit(1)

    if (existingAttendance.length) {
      // Update existing record
      await db
        .update(eventAttendance)
        .set({
          intendedStatus: validatedData.intendedStatus,
          intendedReason: validatedData.intendedReason || null,
          memberResponseAt: new Date(),
        })
        .where(eq(eventAttendance.id, existingAttendance[0]!.id))
    } else {
      // Create new record (shouldn't happen if event targeting is working correctly)
      await db
        .insert(eventAttendance)
        .values({
          eventId: params.id,
          memberId,
          intendedStatus: validatedData.intendedStatus,
          intendedReason: validatedData.intendedReason || null,
          memberResponseAt: new Date(),
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating member attendance response:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update attendance response' },
      { status: 500 }
    )
  }
}