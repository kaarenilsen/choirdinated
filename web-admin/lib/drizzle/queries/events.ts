import { db } from '../db'
import { eq, and } from 'drizzle-orm'
import { events, eventAttendance, members, membershipTypes } from '../schema'
import { expandVoiceTargeting, getEligibleMembersForEvent } from './voice-hierarchy'

export interface CreateEventInput {
  choirId: string
  title: string
  description?: string
  typeId?: string
  statusId?: string
  startTime: Date
  endTime: Date
  location: string
  attendanceMode: 'opt_in' | 'opt_out'
  targetMembershipTypes?: string[]
  targetVoiceGroups?: string[]
  targetVoiceTypes?: string[]
  includeAllActive: boolean
  notes?: string
  createdBy: string
}

/**
 * Create an event with proper voice group targeting
 */
export async function createEvent(input: CreateEventInput) {
  // Expand voice targeting to include all voice types under targeted voice groups
  const { voiceTypeIds, voiceGroupIds } = await expandVoiceTargeting(
    input.targetVoiceGroups || [],
    input.targetVoiceTypes || []
  )

  // Create the event
  const [event] = await db
    .insert(events)
    .values({
      ...input,
      targetVoiceGroups: voiceGroupIds,
      targetVoiceTypes: voiceTypeIds,
      startTime: input.startTime,
      endTime: input.endTime
    })
    .returning()

  // Create attendance records for eligible members
  await createEventAttendanceForEligibleMembers(event.id)

  return event
}

/**
 * Update event targeting
 */
export async function updateEventTargeting(
  eventId: string,
  targeting: {
    targetMembershipTypes?: string[]
    targetVoiceGroups?: string[]
    targetVoiceTypes?: string[]
    includeAllActive?: boolean
  }
) {
  // Expand voice targeting
  const { voiceTypeIds, voiceGroupIds } = await expandVoiceTargeting(
    targeting.targetVoiceGroups || [],
    targeting.targetVoiceTypes || []
  )

  // Update event
  await db
    .update(events)
    .set({
      targetMembershipTypes: targeting.targetMembershipTypes,
      targetVoiceGroups: voiceGroupIds,
      targetVoiceTypes: voiceTypeIds,
      includeAllActive: targeting.includeAllActive
    })
    .where(eq(events.id, eventId))

  // Recreate attendance records for newly eligible members
  await createEventAttendanceForEligibleMembers(eventId)
}

/**
 * Get event attendance breakdown by voice group
 */
export async function getEventAttendanceByVoiceGroup(eventId: string) {
  // Get all attendance records with member and voice information
  const attendanceRecords = await db
    .select({
      attendance: eventAttendance,
      member: members,
      voiceGroup: {
        id: members.voiceGroupId,
        value: members.voiceGroupId,
        displayName: members.voiceGroupId
      }
    })
    .from(eventAttendance)
    .innerJoin(members, eq(eventAttendance.memberId, members.id))
    .where(eq(eventAttendance.eventId, eventId))

  // Group by voice group
  const breakdown = attendanceRecords.reduce((acc, record) => {
    const groupId = record.voiceGroup.id
    if (!acc[groupId]) {
      acc[groupId] = {
        voiceGroupId: groupId,
        total: 0,
        attending: 0,
        notAttending: 0,
        tentative: 0,
        notResponded: 0,
        present: 0,
        absent: 0,
        late: 0
      }
    }

    acc[groupId].total++

    // Count intended status
    switch (record.attendance.intendedStatus) {
      case 'attending':
        acc[groupId].attending++
        break
      case 'not_attending':
        acc[groupId].notAttending++
        break
      case 'tentative':
        acc[groupId].tentative++
        break
      case 'not_responded':
        acc[groupId].notResponded++
        break
    }

    // Count actual status
    switch (record.attendance.actualStatus) {
      case 'present':
        acc[groupId].present++
        break
      case 'absent':
        acc[groupId].absent++
        break
      case 'late':
        acc[groupId].late++
        break
    }

    return acc
  }, {} as Record<string, any>)

  return Object.values(breakdown)
}

/**
 * Get events for a member considering voice group hierarchy
 */
export async function getEventsForMember(memberId: string) {
  // Get member details
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1)

  if (!member) {
    throw new Error('Member not found')
  }

  // Get member's membership type
  const [membershipType] = await db
    .select()
    .from(membershipTypes)
    .where(eq(membershipTypes.id, member.membershipTypeId))
    .limit(1)

  // Only proceed if member has active membership
  if (!membershipType?.isActiveMembership) {
    return []
  }

  // Query events for the choir with attendance data
  const eventsWithAttendance = await db
    .select({
      event: events,
      attendance: eventAttendance
    })
    .from(events)
    .leftJoin(
      eventAttendance,
      and(
        eq(eventAttendance.eventId, events.id),
        eq(eventAttendance.memberId, memberId)
      )
    )
    .where(eq(events.choirId, member.choirId))
    .orderBy(events.startTime)

  // Filter events where member is eligible in application logic
  return eventsWithAttendance.filter(({ event }) => {
    // Include all active members
    if (event.includeAllActive) {
      return true
    }

    // Check if member's membership type is targeted
    const targetMembershipTypes = event.targetMembershipTypes as string[] || []
    if (targetMembershipTypes.length === 0 || targetMembershipTypes.includes(member.membershipTypeId)) {
      return true
    }

    // Check if member's voice group is targeted
    const targetVoiceGroups = event.targetVoiceGroups as string[] || []
    if (targetVoiceGroups.includes(member.voiceGroupId)) {
      return true
    }

    // Check if member's voice type is targeted
    const targetVoiceTypes = event.targetVoiceTypes as string[] || []
    if (member.voiceTypeId && targetVoiceTypes.includes(member.voiceTypeId)) {
      return true
    }

    return false
  })
}

async function createEventAttendanceForEligibleMembers(eventId: string) {
  const eligibleMembers = await getEligibleMembersForEvent(eventId)
  
  // Get existing attendance records
  const existingAttendance = await db
    .select({ memberId: eventAttendance.memberId })
    .from(eventAttendance)
    .where(eq(eventAttendance.eventId, eventId))

  const existingMemberIds = new Set(existingAttendance.map(a => a.memberId))

  // Create attendance records for members who don't have one yet
  const newAttendanceRecords = eligibleMembers
    .filter(member => !existingMemberIds.has(member.id))
    .map(member => ({
      eventId,
      memberId: member.id,
      intendedStatus: 'not_responded' as const
    }))

  if (newAttendanceRecords.length > 0) {
    await db.insert(eventAttendance).values(newAttendanceRecords)
  }

  return newAttendanceRecords.length
}