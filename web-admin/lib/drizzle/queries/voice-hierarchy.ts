import { db } from '../db'
import { eq, and, inArray, or, SQL } from 'drizzle-orm'
import { members, listOfValues, events, eventAttendance } from '../schema'

/**
 * Get all voice types that belong to a voice group
 */
export async function getVoiceTypesForGroup(voiceGroupId: string) {
  return await db
    .select({
      id: listOfValues.id,
      value: listOfValues.value,
      displayName: listOfValues.displayName,
      sortOrder: listOfValues.sortOrder
    })
    .from(listOfValues)
    .where(
      and(
        eq(listOfValues.parentId, voiceGroupId),
        eq(listOfValues.category, 'voice_type'),
        eq(listOfValues.isActive, true)
      )
    )
    .orderBy(listOfValues.sortOrder, listOfValues.displayName)
}

/**
 * Get all members that belong to a voice group (including all voice types under it)
 */
export async function getMembersByVoiceGroup(choirId: string, voiceGroupIds: string[]) {
  // Get all voice types for the specified groups
  const voiceTypes = await db
    .select({ id: listOfValues.id })
    .from(listOfValues)
    .where(
      and(
        inArray(listOfValues.parentId, voiceGroupIds),
        eq(listOfValues.category, 'voice_type'),
        eq(listOfValues.isActive, true)
      )
    )

  const voiceTypeIds = voiceTypes.map(vt => vt.id)

  // Get members who are either:
  // 1. Directly assigned to one of the voice groups
  // 2. Assigned to a voice type under one of the voice groups
  return await db
    .select()
    .from(members)
    .where(
      and(
        eq(members.choirId, choirId),
        or(
          inArray(members.voiceGroupId, voiceGroupIds),
          voiceTypeIds.length > 0 ? inArray(members.voiceTypeId, voiceTypeIds) : undefined
        )
      )
    )
}

/**
 * Expand voice targeting for events to include all related members
 * When a voice group is targeted, include all voice types under it
 */
export async function expandVoiceTargeting(
  voiceGroupIds: string[],
  voiceTypeIds: string[]
): Promise<{ voiceTypeIds: string[], voiceGroupIds: string[] }> {
  // Get all voice types for the specified voice groups
  const expandedVoiceTypes = voiceGroupIds.length > 0
    ? await db
        .select({ id: listOfValues.id })
        .from(listOfValues)
        .where(
          and(
            inArray(listOfValues.parentId, voiceGroupIds),
            eq(listOfValues.category, 'voice_type'),
            eq(listOfValues.isActive, true)
          )
        )
    : []

  // Combine explicitly targeted voice types with expanded ones
  const allVoiceTypeIds = [
    ...new Set([
      ...voiceTypeIds,
      ...expandedVoiceTypes.map(vt => vt.id)
    ])
  ]

  return {
    voiceTypeIds: allVoiceTypeIds,
    voiceGroupIds
  }
}

/**
 * Get eligible members for an event based on voice targeting
 */
export async function getEligibleMembersForEvent(eventId: string) {
  // First get the event details
  const event = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)

  if (!event[0]) {
    throw new Error('Event not found')
  }

  const targetVoiceGroups = (event[0].targetVoiceGroups as string[]) || []
  const targetVoiceTypes = (event[0].targetVoiceTypes as string[]) || []

  // Expand voice targeting
  const { voiceTypeIds } = await expandVoiceTargeting(targetVoiceGroups, targetVoiceTypes)

  // Build the where clause for eligible members
  const conditions = [eq(members.choirId, event[0].choirId)]

  if (!event[0].includeAllActive) {
    // If not including all active, must match voice criteria
    const voiceConditions: SQL<unknown>[] = []
    
    if (targetVoiceGroups.length > 0) {
      voiceConditions.push(inArray(members.voiceGroupId, targetVoiceGroups))
    }
    
    if (voiceTypeIds.length > 0) {
      const voiceTypeCondition = inArray(members.voiceTypeId, voiceTypeIds)
      if (voiceTypeCondition) {
        voiceConditions.push(voiceTypeCondition)
      }
    }
    
    if (voiceConditions.length > 0) {
      conditions.push(or(...voiceConditions) as any)
    }
  }

  return await db
    .select({
      id: members.id,
      userProfileId: members.userProfileId,
      voiceGroupId: members.voiceGroupId,
      voiceTypeId: members.voiceTypeId
    })
    .from(members)
    .where(and(...conditions))
}

/**
 * Create event attendance records for eligible members
 */
export async function createEventAttendanceForEligibleMembers(eventId: string) {
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

/**
 * Get voice group hierarchy for display
 */
export async function getVoiceGroupHierarchy(choirId: string) {
  // Get all voice groups
  const voiceGroups = await db
    .select()
    .from(listOfValues)
    .where(
      and(
        eq(listOfValues.choirId, choirId),
        eq(listOfValues.category, 'voice_group'),
        eq(listOfValues.isActive, true)
      )
    )
    .orderBy(listOfValues.sortOrder, listOfValues.displayName)

  // Get all voice types and group by parent
  const voiceTypes = await db
    .select()
    .from(listOfValues)
    .where(
      and(
        eq(listOfValues.choirId, choirId),
        eq(listOfValues.category, 'voice_type'),
        eq(listOfValues.isActive, true)
      )
    )
    .orderBy(listOfValues.sortOrder, listOfValues.displayName)

  // Build hierarchy
  const hierarchy = voiceGroups.map(group => ({
    ...group,
    voiceTypes: voiceTypes.filter(type => type.parentId === group.id)
  }))

  return hierarchy
}