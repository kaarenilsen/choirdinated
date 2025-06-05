import { NextResponse } from 'next/server'
import { db } from '@/lib/drizzle/db'
import { members, userProfiles, membershipTypes, listOfValues, membershipLeaves, membershipPeriods } from '@/lib/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // Get the current user from Supabase session
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get the user's choir ID
    const userMemberships = await db
      .select({ choirId: members.choirId })
      .from(members)
      .where(eq(members.userProfileId, user.id))
      .limit(1)

    if (!userMemberships.length) {
      return NextResponse.json({ error: 'User has no choir membership' }, { status: 403 })
    }

    const choirId = userMemberships[0]!.choirId

    // Fetch all members with their related data
    const membersData = await db
      .select({
        member: members,
        userProfile: userProfiles,
        membershipType: membershipTypes,
        voiceGroup: listOfValues,
      })
      .from(members)
      .leftJoin(userProfiles, eq(members.userProfileId, userProfiles.id))
      .leftJoin(membershipTypes, eq(members.membershipTypeId, membershipTypes.id))
      .leftJoin(listOfValues, eq(members.voiceGroupId, listOfValues.id))
      .where(eq(members.choirId, choirId))

    // Fetch voice types separately
    const voiceTypeResults = await db
      .select({
        memberId: members.id,
        voiceType: listOfValues,
      })
      .from(members)
      .leftJoin(listOfValues, eq(members.voiceTypeId, listOfValues.id))
      .where(and(
        eq(members.choirId, choirId),
        eq(listOfValues.category, 'voice_type')
      ))

    // Create a map of voice types by member ID
    const voiceTypeMap = new Map(
      voiceTypeResults
        .filter(vt => vt.voiceType)
        .map(vt => [vt.memberId, vt.voiceType])
    )

    // Fetch all membership leaves (we'll filter by approval status and date range later)
    const leavesData = await db
      .select()
      .from(membershipLeaves)

    // Group leaves by member ID
    const leavesByMemberId = leavesData.reduce((acc, leave) => {
      if (!acc[leave.memberId]) acc[leave.memberId] = []
      acc[leave.memberId]!.push(leave)
      return acc
    }, {} as Record<string, typeof leavesData>)

    // Fetch membership periods for all members
    const membershipPeriodsData = await db
      .select({
        memberId: membershipPeriods.memberId,
        startDate: membershipPeriods.startDate,
        endDate: membershipPeriods.endDate,
      })
      .from(membershipPeriods)
      .innerJoin(members, eq(membershipPeriods.memberId, members.id))
      .where(eq(members.choirId, choirId))
      .orderBy(membershipPeriods.startDate)

    // Group periods by member ID and calculate first/last start dates
    const periodsByMemberId = membershipPeriodsData.reduce((acc, period) => {
      if (!acc[period.memberId]) acc[period.memberId] = []
      acc[period.memberId]!.push(period)
      return acc
    }, {} as Record<string, typeof membershipPeriodsData>)

    // Calculate first and last membership start dates and determine active status
    const membershipDates = Object.entries(periodsByMemberId).reduce((acc, [memberId, periods]) => {
      const sortedPeriods = periods.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      const firstStartDate = sortedPeriods[0]?.startDate
      const lastStartDate = sortedPeriods[sortedPeriods.length - 1]?.startDate
      
      // Check if member has an active membership period (no end date)
      const hasActivePeriod = periods.some(period => period.endDate === null)
      
      acc[memberId] = {
        firstMembershipStartDate: firstStartDate,
        lastMembershipStartDate: lastStartDate,
        hasActivePeriod
      }
      return acc
    }, {} as Record<string, { firstMembershipStartDate: string | undefined, lastMembershipStartDate: string | undefined, hasActivePeriod: boolean }>)

    // Transform data
    const transformedMembers = membersData.map((row) => {
      const { member, userProfile, membershipType, voiceGroup } = row
      const voiceType = voiceTypeMap.get(member.id)
      const memberLeaves = leavesByMemberId[member.id] || []
      const memberDates = membershipDates[member.id]
      
      // Check if member is currently on leave based on date ranges AND approval status
      const now = new Date()
      const activeLeave = memberLeaves.find((leave) => {
        // Leave must be approved first
        if (leave.status !== 'approved') {
          return false
        }
        
        const startDate = new Date(leave.startDate)
        const endDate = leave.expectedReturnDate ? new Date(leave.expectedReturnDate) : null
        
        // Member is on leave if:
        // 1. Leave is approved (checked above)
        // 2. Leave has started (startDate <= now)
        // 3. Leave hasn't ended yet (endDate is null OR endDate > now)
        // 4. If they have actualReturnDate and it's in the past, they're not on leave anymore
        if (leave.actualReturnDate) {
          const actualReturn = new Date(leave.actualReturnDate)
          return startDate <= now && now < actualReturn
        }
        
        return startDate <= now && (!endDate || now < endDate)
      })

      // Determine membership status based on active period and leave status
      let membershipStatus = 'Sluttet' // Default to inactive
      let isActive = false
      
      if (memberDates?.hasActivePeriod) {
        isActive = true
        if (activeLeave) {
          membershipStatus = 'I permisjon'
        } else {
          membershipStatus = 'Aktiv'
        }
      }
      
      // Note: Only active members can be on leave
      // If a member has no active period, they cannot be "I permisjon"

      return {
        id: member.id,
        name: userProfile?.name || '(Importert medlem - mangler profil)',
        email: userProfile?.email || 'profil@mangler.no',
        phone: userProfile?.phone || null,
        birth_date: userProfile?.birthDate || '1900-01-01',
        voice_group: voiceGroup?.displayName || 'Ikke tildelt',
        voice_type: voiceType?.displayName || null,
        membership_type: membershipType?.displayName || 'Ukjent type',
        membership_status: membershipStatus,
        created_at: memberDates?.lastMembershipStartDate || member.createdAt?.toISOString() || '',
        first_membership_date: memberDates?.firstMembershipStartDate || null,
        emergency_contact: userProfile?.emergencyContact || null,
        emergency_phone: userProfile?.emergencyPhone || null,
        is_on_leave: isActive && !!activeLeave, // Only active members can be on leave
        leave_reason: activeLeave?.reason || null,
        is_active: isActive
      }
    })

    // Fetch voice groups
    const voiceGroupsData = await db
      .select({
        id: listOfValues.id,
        value: listOfValues.value,
        display_name: listOfValues.displayName,
      })
      .from(listOfValues)
      .where(and(
        eq(listOfValues.category, 'voice_group'),
        eq(listOfValues.isActive, true),
        eq(listOfValues.choirId, choirId)
      ))
      .orderBy(listOfValues.sortOrder)

    // Fetch membership types
    const membershipTypesData = await db
      .select({
        id: membershipTypes.id,
        name: membershipTypes.name,
        display_name: membershipTypes.displayName,
      })
      .from(membershipTypes)
      .where(and(
        eq(membershipTypes.choirId, choirId),
        eq(membershipTypes.isActiveMembership, true)
      ))
      .orderBy(membershipTypes.sortOrder)

    return NextResponse.json({
      members: transformedMembers,
      voiceGroups: voiceGroupsData,
      membershipTypes: membershipTypesData,
      choirId
    })
  } catch (error) {
    // Error logged for debugging
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}