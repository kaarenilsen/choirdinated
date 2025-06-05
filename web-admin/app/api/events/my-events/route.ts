import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getEventsForMember } from '@/lib/drizzle/queries/events'
import { db } from '@/lib/drizzle/db'
import { members } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
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

    // Get events for this member
    const eventsWithAttendance = await getEventsForMember(memberId)

    // Transform data for frontend
    const transformedEvents = eventsWithAttendance.map(({ event, attendance }) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: 'Øvelse', // TODO: Get actual event type from list_of_values
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      location: event.location,
      room: event.room,
      attendanceMode: event.attendanceMode,
      attendance: attendance ? {
        id: attendance.id,
        intendedStatus: attendance.intendedStatus,
        intendedReason: attendance.intendedReason,
        memberResponseAt: attendance.memberResponseAt?.toISOString(),
      } : undefined,
    }))

    return NextResponse.json({
      events: transformedEvents
    })
  } catch (error) {
    console.error('Error fetching member events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}