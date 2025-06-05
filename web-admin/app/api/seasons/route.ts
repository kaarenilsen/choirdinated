import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/drizzle/db'
import { seasons, members, membershipTypes } from '@/lib/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const createSeasonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  display_name: z.string().min(1, 'Display name is required'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  description: z.string().optional()
})

// Get seasons for user's choir
export async function GET(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's choir ID
    const userMembership = await db
      .select({
        choirId: members.choirId
      })
      .from(members)
      .innerJoin(membershipTypes, eq(members.membershipTypeId, membershipTypes.id))
      .where(
        and(
          eq(members.userProfileId, user.id),
          eq(membershipTypes.canAccessSystem, true)
        )
      )
      .limit(1)

    if (userMembership.length === 0) {
      return NextResponse.json({ error: 'No choir membership found' }, { status: 404 })
    }

    const choirId = userMembership[0]!.choirId

    // Get seasons for the choir
    const choirSeasons = await db
      .select()
      .from(seasons)
      .where(eq(seasons.choirId, choirId))
      .orderBy(seasons.startDate)

    return NextResponse.json({
      success: true,
      seasons: choirSeasons
    })
  } catch (error) {
    console.error('Error fetching seasons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seasons' },
      { status: 500 }
    )
  }
}

// Create new season
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = createSeasonSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { name, display_name, start_date, end_date, description } = validationResult.data

    // Validate date range
    if (new Date(start_date) >= new Date(end_date)) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    // Get user's choir ID and check admin permissions
    const userMembership = await db
      .select({
        choirId: members.choirId,
        membershipTypeName: membershipTypes.name
      })
      .from(members)
      .innerJoin(membershipTypes, eq(members.membershipTypeId, membershipTypes.id))
      .where(
        and(
          eq(members.userProfileId, user.id),
          eq(membershipTypes.canAccessSystem, true)
        )
      )
      .limit(1)

    if (userMembership.length === 0) {
      return NextResponse.json({ error: 'No choir membership found' }, { status: 404 })
    }

    const { choirId, membershipTypeName } = userMembership[0]!

    // Check admin permissions
    if (!['admin', 'conductor'].includes(membershipTypeName)) {
      return NextResponse.json(
        { error: 'Only admins and conductors can create seasons' },
        { status: 403 }
      )
    }

    // Create season
    const [newSeason] = await db
      .insert(seasons)
      .values({
        choirId,
        name,
        displayName: display_name,
        startDate: start_date,
        endDate: end_date,
        description: description || null,
        createdBy: user.id
      })
      .returning()

    return NextResponse.json({
      success: true,
      season: newSeason
    })
  } catch (error) {
    console.error('Error creating season:', error)
    return NextResponse.json(
      { error: 'Failed to create season' },
      { status: 500 }
    )
  }
}