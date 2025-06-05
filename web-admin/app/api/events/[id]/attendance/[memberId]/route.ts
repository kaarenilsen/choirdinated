import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/drizzle/db'
import { events, members, eventAttendance } from '@/lib/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const markAttendanceSchema = z.object({
  actualStatus: z.enum(['present', 'absent', 'late']),
  notes: z.string().optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's choir ID and verify they have permission to mark attendance
    const userMemberships = await db
      .select({ 
        choirId: members.choirId,
        membershipTypeId: members.membershipTypeId,
      })
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

    // Verify target member exists and belongs to same choir
    const targetMember = await db
      .select({ id: members.id })
      .from(members)
      .where(and(
        eq(members.id, params.memberId),
        eq(members.choirId, choirId)
      ))
      .limit(1)

    if (!targetMember.length) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // TODO: Add permission check here - verify user can mark attendance for this member
    // This should check if user is group leader for the member's voice group, or has admin rights

    const body = await request.json()
    const validatedData = markAttendanceSchema.parse(body)

    // Update attendance record
    const existingAttendance = await db
      .select({ id: eventAttendance.id })
      .from(eventAttendance)
      .where(and(
        eq(eventAttendance.eventId, params.id),
        eq(eventAttendance.memberId, params.memberId)
      ))
      .limit(1)

    if (!existingAttendance.length) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    await db
      .update(eventAttendance)
      .set({
        actualStatus: validatedData.actualStatus,
        notes: validatedData.notes || null,
        markedAt: new Date(),
        markedBy: user.id,
      })
      .where(eq(eventAttendance.id, existingAttendance[0]!.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking attendance:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    )
  }
}