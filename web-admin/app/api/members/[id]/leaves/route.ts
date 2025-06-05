import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { db } from '@/lib/drizzle/db';
import { membershipLeaves, members } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { isGroupLeader } from '@/lib/auth-helpers';

// Create a new leave
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

    // Check if user is admin or group leader
    const hasPermission = await isGroupLeader(user.id, choirId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify the member belongs to the same choir
    const targetMember = await db
      .select({ choirId: members.choirId })
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
    const { startDate, endDate, reason, leaveType, notes } = body;

    // Create the leave record
    const newLeave = await db
      .insert(membershipLeaves)
      .values({
        memberId: params.id,
        leaveType: leaveType || 'other',
        startDate: startDate,
        expectedReturnDate: endDate || null,
        reason,
        status: 'approved',
        approvedBy: user.id,
        approvedAt: new Date(),
        notes,
      })
      .returning();

    return NextResponse.json(newLeave[0]);
  } catch (error) {
    // Error creating leave
    return NextResponse.json(
      { error: 'Failed to create leave' },
      { status: 500 }
    );
  }
}

// Update a leave
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

    // Check if user is admin or group leader
    const hasPermission = await isGroupLeader(user.id, choirId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { leaveId, startDate, endDate, reason, status, notes, returnDate, leaveType } = body;

    // Verify the leave belongs to a member in the same choir
    const leaveData = await db
      .select({
        memberId: membershipLeaves.memberId,
        choirId: members.choirId
      })
      .from(membershipLeaves)
      .innerJoin(members, eq(membershipLeaves.memberId, members.id))
      .where(and(
        eq(membershipLeaves.id, leaveId),
        eq(members.choirId, choirId)
      ))
      .limit(1);

    if (!leaveData.length) {
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
    }

    // Update the leave record
    const updatedLeave = await db
      .update(membershipLeaves)
      .set({
        leaveType: leaveType || 'other',
        startDate: startDate,
        expectedReturnDate: endDate || null,
        actualReturnDate: returnDate || null,
        reason,
        status: status || 'approved',
        notes,
        approvedBy: user.id,
        approvedAt: new Date(),
      })
      .where(eq(membershipLeaves.id, leaveId))
      .returning();

    return NextResponse.json(updatedLeave[0]);
  } catch (error) {
    // Error updating leave
    return NextResponse.json(
      { error: 'Failed to update leave' },
      { status: 500 }
    );
  }
}

// Delete a leave
export async function DELETE(
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

    // Check if user is admin or group leader
    const hasPermission = await isGroupLeader(user.id, choirId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { leaveId } = await request.json();

    // Verify the leave belongs to a member in the same choir
    const leaveData = await db
      .select({
        memberId: membershipLeaves.memberId,
        choirId: members.choirId
      })
      .from(membershipLeaves)
      .innerJoin(members, eq(membershipLeaves.memberId, members.id))
      .where(and(
        eq(membershipLeaves.id, leaveId),
        eq(members.choirId, choirId)
      ))
      .limit(1);

    if (!leaveData.length) {
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
    }

    // Delete the leave record
    await db
      .delete(membershipLeaves)
      .where(eq(membershipLeaves.id, leaveId));

    return NextResponse.json({ success: true });
  } catch (error) {
    // Error deleting leave
    return NextResponse.json(
      { error: 'Failed to delete leave' },
      { status: 500 }
    );
  }
}