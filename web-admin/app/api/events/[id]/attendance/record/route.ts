import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/drizzle/db'
import { eventAttendance, events, members, userProfiles, listOfValues } from '@/lib/drizzle/schema'
import { eq, and, sql } from 'drizzle-orm'


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      member_id, 
      actual_status, 
      arrival_time, 
      departure_time, 
      attendance_quality, 
      notes 
    } = await request.json()

    if (!member_id || !actual_status) {
      return NextResponse.json(
        { error: 'Member ID and attendance status are required' },
        { status: 400 }
      )
    }

    const eventId = params.id

    // Check if user has permission to record attendance for this event
    const [event] = await db
      .select({
        id: events.id,
        choirId: events.choirId
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get member's voice group to check permissions
    const [member] = await db
      .select({
        id: members.id,
        voiceGroupId: members.voiceGroupId,
        choirId: members.choirId
      })
      .from(members)
      .where(eq(members.id, member_id))
      .limit(1)

    if (!member || member.choirId !== event.choirId) {
      return NextResponse.json(
        { error: 'Member not found or not in the same choir' },
        { status: 404 }
      )
    }

    // Check attendance recording permissions using the database function
    const canRecord = await db.execute(sql`
      SELECT can_record_attendance_for_voice(${user.id}, ${event.choirId}, ${member.voiceGroupId}) as can_record
    `)

    if (!canRecord[0]?.can_record) {
      return NextResponse.json(
        { error: 'You do not have permission to record attendance for this voice group' },
        { status: 403 }
      )
    }

    // Update or insert attendance record
    const existingAttendance = await db
      .select()
      .from(eventAttendance)
      .where(
        and(
          eq(eventAttendance.eventId, eventId),
          eq(eventAttendance.memberId, member_id)
        )
      )
      .limit(1)

    if (existingAttendance.length > 0) {
      // Update existing record
      const [updatedAttendance] = await db
        .update(eventAttendance)
        .set({
          actualStatus: actual_status,
          markedBy: user.id,
          markedAt: new Date(),
          arrivalTime: arrival_time ? new Date(arrival_time) : null,
          departureTime: departure_time ? new Date(departure_time) : null,
          attendanceQuality: attendance_quality || null,
          notes: notes || null
        })
        .where(eq(eventAttendance.id, existingAttendance[0]!.id))
        .returning()

      return NextResponse.json({
        success: true,
        attendance: updatedAttendance
      })
    } else {
      // Create new record
      const [newAttendance] = await db
        .insert(eventAttendance)
        .values({
          eventId: eventId,
          memberId: member_id,
          actualStatus: actual_status,
          markedBy: user.id,
          markedAt: new Date(),
          arrivalTime: arrival_time ? new Date(arrival_time) : null,
          departureTime: departure_time ? new Date(departure_time) : null,
          attendanceQuality: attendance_quality || null,
          notes: notes || null
        })
        .returning()

      return NextResponse.json({
        success: true,
        attendance: newAttendance
      })
    }
  } catch (error) {
    console.error('Error recording attendance:', error)
    return NextResponse.json(
      { error: 'Failed to record attendance' },
      { status: 500 }
    )
  }
}

// Get members available for attendance recording with permissions filter
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    const { searchParams } = new URL(request.url)
    const voiceGroupFilter = searchParams.get('voice_group_id')

    // Get event details
    const [event] = await db
      .select({
        id: events.id,
        choirId: events.choirId,
        title: events.title
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get voice groups user can record attendance for
    const recordableVoices = await db.execute(sql`
      SELECT * FROM get_recordable_voice_groups(${user.id}, ${event.choirId})
    `)

    if (recordableVoices.length === 0) {
      return NextResponse.json(
        { error: 'You do not have permission to record attendance for any voice groups' },
        { status: 403 }
      )
    }

    // Build voice group filter based on permissions
    let voiceGroupIds = recordableVoices
      .filter(row => row.voice_group_id !== null)
      .map(row => row.voice_group_id)

    // If user can record all voices, don't filter by voice group
    const canRecordAll = recordableVoices.some(row => row.can_record_all)
    
    if (voiceGroupFilter && !canRecordAll) {
      // User requested specific voice group, check if they have permission
      if (!voiceGroupIds.includes(voiceGroupFilter)) {
        return NextResponse.json(
          { error: 'You do not have permission to record attendance for this voice group' },
          { status: 403 }
        )
      }
      voiceGroupIds = [voiceGroupFilter]
    } else if (voiceGroupFilter && canRecordAll) {
      voiceGroupIds = [voiceGroupFilter]
    }

    // Get members with their current attendance status
    const membersQuery = db
      .select({
        member: {
          id: members.id,
          userProfileId: members.userProfileId,
          voiceGroupId: members.voiceGroupId,
          voiceTypeId: members.voiceTypeId
        },
        userProfile: {
          name: userProfiles.name,
          email: userProfiles.email
        },
        voiceGroup: {
          displayName: listOfValues.displayName
        },
        attendance: {
          id: eventAttendance.id,
          intendedStatus: eventAttendance.intendedStatus,
          actualStatus: eventAttendance.actualStatus,
          arrivalTime: eventAttendance.arrivalTime,
          departureTime: eventAttendance.departureTime,
          attendanceQuality: eventAttendance.attendanceQuality,
          notes: eventAttendance.notes,
          markedAt: eventAttendance.markedAt
        }
      })
      .from(members)
      .innerJoin(userProfiles, eq(members.userProfileId, userProfiles.id))
      .innerJoin(listOfValues, eq(members.voiceGroupId, listOfValues.id))
      .leftJoin(
        eventAttendance,
        and(
          eq(eventAttendance.memberId, members.id),
          eq(eventAttendance.eventId, eventId)
        )
      )
      .where(eq(members.choirId, event.choirId))

    // Apply voice group filter if not recording all (filter in JavaScript for now)

    const membersData = await membersQuery.execute()

    // Get voice types separately and merge the data
    const membersWithVoiceTypes = await Promise.all(
      membersData.map(async (member) => {
        let voiceType = null
        if (member.member.voiceTypeId) {
          const [vt] = await db
            .select({ displayName: listOfValues.displayName })
            .from(listOfValues)
            .where(eq(listOfValues.id, member.member.voiceTypeId))
            .limit(1)
          voiceType = vt || null
        }
        return {
          ...member,
          voiceType
        }
      })
    )

    // Filter by voice group in JavaScript if needed
    const filteredMembers = !canRecordAll && voiceGroupIds.length > 0
      ? membersWithVoiceTypes.filter(m => voiceGroupIds.includes(m.member.voiceGroupId))
      : membersWithVoiceTypes

    return NextResponse.json({
      success: true,
      members: filteredMembers,
      recordable_voice_groups: recordableVoices,
      can_record_all: canRecordAll
    })
  } catch (error) {
    console.error('Error fetching attendance members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members for attendance recording' },
      { status: 500 }
    )
  }
}