import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { db } from '@/lib/drizzle/db';
import { membershipPeriods, members } from '@/lib/drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { isChoirAdmin } from '@/lib/auth-helpers';

// Create a new membership period
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's choir ID
    const userMemberships = await db
      .select({ choirId: members.choirId })
      .from(members)
      .where(eq(members.userProfileId, user.id))
      .limit(1);

    if (!userMemberships.length) {
      return NextResponse.json({ error: 'User has no choir membership' }, { status: 403 });
    }

    const choirId = userMemberships[0]!.choirId;

    // Check if user is admin
    const hasPermission = await isChoirAdmin(user.id, choirId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Only administrators can manage membership periods' }, { status: 403 });
    }

    // Verify the member belongs to the same choir and get their voice group
    const targetMember = await db
      .select({ 
        choirId: members.choirId,
        voiceGroupId: members.voiceGroupId 
      })
      .from(members)
      .where(and(
        eq(members.id, params.id),
        eq(members.choirId, choirId)
      ))
      .limit(1);

    if (!targetMember.length) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const body = await request.json();
    const { startDate, membershipTypeId } = body;

    // Create the membership period
    const newPeriod = await db
      .insert(membershipPeriods)
      .values({
        memberId: params.id,
        startDate: startDate,
        membershipTypeId,
        voiceGroupId: targetMember[0]!.voiceGroupId!,
      })
      .returning();

    return NextResponse.json(newPeriod[0]);
  } catch (error) {
    // Error creating membership period
    return NextResponse.json(
      { error: 'Failed to create membership period' },
      { status: 500 }
    );
  }
}

// Update a membership period
export async function PUT(
  request: NextRequest
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's choir ID
    const userMemberships = await db
      .select({ choirId: members.choirId })
      .from(members)
      .where(eq(members.userProfileId, user.id))
      .limit(1);

    if (!userMemberships.length) {
      return NextResponse.json({ error: 'User has no choir membership' }, { status: 403 });
    }

    const choirId = userMemberships[0]!.choirId;

    // Check if user is admin
    const hasPermission = await isChoirAdmin(user.id, choirId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Only administrators can manage membership periods' }, { status: 403 });
    }

    const body = await request.json();
    const { periodId, startDate, endDate, endReason, membershipTypeId } = body;

    // Verify the period belongs to a member in the same choir
    const periodData = await db
      .select({
        memberId: membershipPeriods.memberId,
        choirId: members.choirId
      })
      .from(membershipPeriods)
      .innerJoin(members, eq(membershipPeriods.memberId, members.id))
      .where(and(
        eq(membershipPeriods.id, periodId),
        eq(members.choirId, choirId)
      ))
      .limit(1);

    if (!periodData.length) {
      return NextResponse.json({ error: 'Membership period not found' }, { status: 404 });
    }

    // Update the period
    const updatedPeriod = await db
      .update(membershipPeriods)
      .set({
        startDate: startDate,
        endDate: endDate || null,
        endReason: endReason || null,
        membershipTypeId,
      })
      .where(eq(membershipPeriods.id, periodId))
      .returning();

    return NextResponse.json(updatedPeriod[0]);
  } catch (error) {
    // Error updating membership period
    return NextResponse.json(
      { error: 'Failed to update membership period' },
      { status: 500 }
    );
  }
}

// End current membership period
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's choir ID
    const userMemberships = await db
      .select({ choirId: members.choirId })
      .from(members)
      .where(eq(members.userProfileId, user.id))
      .limit(1);

    if (!userMemberships.length) {
      return NextResponse.json({ error: 'User has no choir membership' }, { status: 403 });
    }

    const choirId = userMemberships[0]!.choirId;

    // Check if user is admin
    const hasPermission = await isChoirAdmin(user.id, choirId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Only administrators can manage membership periods' }, { status: 403 });
    }

    const body = await request.json();
    const { endDate, endReason } = body;

    // Find the current active period
    const currentPeriod = await db
      .select({
        period: membershipPeriods,
        choirId: members.choirId
      })
      .from(membershipPeriods)
      .innerJoin(members, eq(membershipPeriods.memberId, members.id))
      .where(and(
        eq(membershipPeriods.memberId, params.id),
        eq(members.choirId, choirId),
        isNull(membershipPeriods.endDate)
      ))
      .limit(1);

    if (!currentPeriod.length) {
      return NextResponse.json({ error: 'No active membership period found' }, { status: 404 });
    }

    // End the current period
    const updatedPeriod = await db
      .update(membershipPeriods)
      .set({
        endDate: endDate,
        endReason: endReason || 'Membership ended',
      })
      .where(eq(membershipPeriods.id, currentPeriod[0]!.period.id))
      .returning();

    // Member status is determined by periods, no need to update members table

    return NextResponse.json(updatedPeriod[0]);
  } catch (error) {
    // Error ending membership period
    return NextResponse.json(
      { error: 'Failed to end membership period' },
      { status: 500 }
    );
  }
}