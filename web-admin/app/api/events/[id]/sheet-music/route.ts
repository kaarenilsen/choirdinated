import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/drizzle/db'
import { eventSheetMusic, events, sheetMusic, members, membershipTypes } from '@/lib/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const addSheetMusicSchema = z.object({
  sheet_music_id: z.string().uuid('Invalid sheet music ID'),
  order_index: z.number().int().min(0).optional(),
  notes: z.string().optional()
})

// Get sheet music for an event
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id

    // Verify user has access to this event
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

    // Verify event belongs to user's choir
    const [event] = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.id, eventId),
          eq(events.choirId, choirId)
        )
      )
      .limit(1)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get sheet music for this event
    const eventSheetMusicData = await db
      .select({
        id: eventSheetMusic.id,
        orderIndex: eventSheetMusic.orderIndex,
        notes: eventSheetMusic.notes,
        createdAt: eventSheetMusic.createdAt,
        sheetMusic: {
          id: sheetMusic.id,
          title: sheetMusic.title,
          composer: sheetMusic.composer,
          arranger: sheetMusic.arranger,
          keySignature: sheetMusic.keySignature,
          timeSignature: sheetMusic.timeSignature,
          durationMinutes: sheetMusic.durationMinutes,
          language: sheetMusic.language,
          genre: sheetMusic.genre
        }
      })
      .from(eventSheetMusic)
      .innerJoin(sheetMusic, eq(eventSheetMusic.sheetMusicId, sheetMusic.id))
      .where(eq(eventSheetMusic.eventId, eventId))
      .orderBy(eventSheetMusic.orderIndex, eventSheetMusic.createdAt)

    return NextResponse.json({
      success: true,
      event_sheet_music: eventSheetMusicData
    })
  } catch (error) {
    console.error('Error fetching event sheet music:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event sheet music' },
      { status: 500 }
    )
  }
}

// Add sheet music to event
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

    const eventId = params.id
    const body = await request.json()

    // Validate input
    const validationResult = addSheetMusicSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { sheet_music_id, order_index, notes } = validationResult.data

    // Check if user has admin permissions for this event
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

    // Verify event belongs to user's choir
    const [event] = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.id, eventId),
          eq(events.choirId, choirId)
        )
      )
      .limit(1)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check admin permissions
    if (!['admin', 'conductor'].includes(membershipTypeName)) {
      return NextResponse.json(
        { error: 'Only admins and conductors can manage event sheet music' },
        { status: 403 }
      )
    }

    // Verify sheet music exists
    const [sheetMusicRecord] = await db
      .select()
      .from(sheetMusic)
      .where(eq(sheetMusic.id, sheet_music_id))
      .limit(1)

    if (!sheetMusicRecord) {
      return NextResponse.json({ error: 'Sheet music not found' }, { status: 404 })
    }

    // Check if relationship already exists
    const existingRelation = await db
      .select()
      .from(eventSheetMusic)
      .where(
        and(
          eq(eventSheetMusic.eventId, eventId),
          eq(eventSheetMusic.sheetMusicId, sheet_music_id)
        )
      )
      .limit(1)

    if (existingRelation.length > 0) {
      return NextResponse.json(
        { error: 'Sheet music already linked to this event' },
        { status: 409 }
      )
    }

    // Get max order index if not provided
    let finalOrderIndex = order_index
    if (finalOrderIndex === undefined) {
      const maxOrderQuery = await db
        .select({
          maxOrder: eventSheetMusic.orderIndex
        })
        .from(eventSheetMusic)
        .where(eq(eventSheetMusic.eventId, eventId))
        .orderBy(eventSheetMusic.orderIndex)

      finalOrderIndex = maxOrderQuery.length > 0 
        ? Math.max(...maxOrderQuery.map(r => r.maxOrder || 0)) + 1
        : 0
    }

    // Create relationship
    const [newRelation] = await db
      .insert(eventSheetMusic)
      .values({
        eventId,
        sheetMusicId: sheet_music_id,
        orderIndex: finalOrderIndex,
        notes: notes || null
      })
      .returning()

    return NextResponse.json({
      success: true,
      event_sheet_music: newRelation
    })
  } catch (error) {
    console.error('Error adding sheet music to event:', error)
    return NextResponse.json(
      { error: 'Failed to add sheet music to event' },
      { status: 500 }
    )
  }
}

// Remove sheet music from event
export async function DELETE(
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
    const sheetMusicId = searchParams.get('sheet_music_id')

    if (!sheetMusicId) {
      return NextResponse.json(
        { error: 'Sheet music ID is required' },
        { status: 400 }
      )
    }

    // Check admin permissions (same as POST)
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

    // Verify event belongs to user's choir
    const [event] = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.id, eventId),
          eq(events.choirId, choirId)
        )
      )
      .limit(1)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check admin permissions
    if (!['admin', 'conductor'].includes(membershipTypeName)) {
      return NextResponse.json(
        { error: 'Only admins and conductors can manage event sheet music' },
        { status: 403 }
      )
    }

    // Delete the relationship
    const deletedRelations = await db
      .delete(eventSheetMusic)
      .where(
        and(
          eq(eventSheetMusic.eventId, eventId),
          eq(eventSheetMusic.sheetMusicId, sheetMusicId)
        )
      )
      .returning()

    if (deletedRelations.length === 0) {
      return NextResponse.json(
        { error: 'Sheet music not linked to this event' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Sheet music removed from event'
    })
  } catch (error) {
    console.error('Error removing sheet music from event:', error)
    return NextResponse.json(
      { error: 'Failed to remove sheet music from event' },
      { status: 500 }
    )
  }
}