import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/drizzle/db'
import { members, membershipTypes, listOfValues } from '@/lib/drizzle/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
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

    // Fetch all options needed for event creation/editing
    const [eventTypes, eventStatuses, voiceGroups, voiceTypes, membershipTypesData] = await Promise.all([
      // Event types
      db
        .select({
          id: listOfValues.id,
          value: listOfValues.value,
          displayName: listOfValues.displayName,
          sortOrder: listOfValues.sortOrder,
        })
        .from(listOfValues)
        .where(and(
          eq(listOfValues.category, 'event_type'),
          eq(listOfValues.isActive, true),
          eq(listOfValues.choirId, choirId)
        ))
        .orderBy(listOfValues.sortOrder),

      // Event statuses
      db
        .select({
          id: listOfValues.id,
          value: listOfValues.value,
          displayName: listOfValues.displayName,
          sortOrder: listOfValues.sortOrder,
        })
        .from(listOfValues)
        .where(and(
          eq(listOfValues.category, 'event_status'),
          eq(listOfValues.isActive, true),
          eq(listOfValues.choirId, choirId)
        ))
        .orderBy(listOfValues.sortOrder),

      // Voice groups
      db
        .select({
          id: listOfValues.id,
          value: listOfValues.value,
          displayName: listOfValues.displayName,
          sortOrder: listOfValues.sortOrder,
        })
        .from(listOfValues)
        .where(and(
          eq(listOfValues.category, 'voice_group'),
          eq(listOfValues.isActive, true),
          eq(listOfValues.choirId, choirId)
        ))
        .orderBy(listOfValues.sortOrder),

      // Voice types
      db
        .select({
          id: listOfValues.id,
          value: listOfValues.value,
          displayName: listOfValues.displayName,
          parentId: listOfValues.parentId,
          sortOrder: listOfValues.sortOrder,
        })
        .from(listOfValues)
        .where(and(
          eq(listOfValues.category, 'voice_type'),
          eq(listOfValues.isActive, true),
          eq(listOfValues.choirId, choirId)
        ))
        .orderBy(listOfValues.sortOrder),

      // Membership types
      db
        .select({
          id: membershipTypes.id,
          name: membershipTypes.name,
          displayName: membershipTypes.displayName,
          isActiveMembership: membershipTypes.isActiveMembership,
          canAccessSystem: membershipTypes.canAccessSystem,
          sortOrder: membershipTypes.sortOrder,
        })
        .from(membershipTypes)
        .where(and(
          eq(membershipTypes.choirId, choirId),
          eq(membershipTypes.isActiveMembership, true)
        ))
        .orderBy(membershipTypes.sortOrder),
    ])

    return NextResponse.json({
      eventTypes,
      eventStatuses,
      voiceGroups,
      voiceTypes,
      membershipTypes: membershipTypesData,
      choirId
    })
  } catch (error) {
    console.error('Error fetching event options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event options' },
      { status: 500 }
    )
  }
}