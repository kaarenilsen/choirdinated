import { NextResponse } from 'next/server'
import { db } from '@/lib/drizzle/db'
import { members, userProfiles, membershipTypes, listOfValues, membershipLeaves } from '@/lib/drizzle/schema'
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

    // Fetch membership leaves
    const leavesData = await db
      .select()
      .from(membershipLeaves)
      .where(eq(membershipLeaves.status, 'approved'))

    // Group leaves by member ID
    const leavesByMemberId = leavesData.reduce((acc, leave) => {
      if (!acc[leave.memberId]) acc[leave.memberId] = []
      acc[leave.memberId]!.push(leave)
      return acc
    }, {} as Record<string, typeof leavesData>)

    // Transform data
    const transformedMembers = membersData.map((row) => {
      const { member, userProfile, membershipType, voiceGroup } = row
      const voiceType = voiceTypeMap.get(member.id)
      const memberLeaves = leavesByMemberId[member.id] || []
      
      const activeLeave = memberLeaves.find((leave) => {
        const now = new Date()
        const startDate = new Date(leave.startDate)
        const endDate = leave.expectedReturnDate ? new Date(leave.expectedReturnDate) : null
        return startDate <= now && (!endDate || endDate > now)
      })

      return {
        id: member.id,
        name: userProfile?.name || '(Importert medlem - mangler profil)',
        email: userProfile?.email || 'profil@mangler.no',
        phone: userProfile?.phone || null,
        birth_date: userProfile?.birthDate || '1900-01-01',
        voice_group: voiceGroup?.displayName || 'Ikke tildelt',
        voice_type: voiceType?.displayName || null,
        membership_type: membershipType?.displayName || 'Ukjent type',
        membership_status: activeLeave ? 'På permisjon' : 'Aktiv',
        created_at: member.createdAt?.toISOString() || '',
        emergency_contact: userProfile?.emergencyContact || null,
        emergency_phone: userProfile?.emergencyPhone || null,
        is_on_leave: !!activeLeave,
        leave_reason: activeLeave?.reason || null
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