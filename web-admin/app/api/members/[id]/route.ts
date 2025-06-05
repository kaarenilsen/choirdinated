import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { db } from '@/lib/drizzle/db';
import { 
  members, 
  userProfiles, 
  membershipTypes, 
  listOfValues, 
  membershipPeriods,
  membershipLeaves,
  eventAttendance,
  events
} from '@/lib/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUserRole } from '@/lib/auth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from Supabase session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's choir ID from members table
    const userMemberships = await db
      .select({ choirId: members.choirId })
      .from(members)
      .where(eq(members.userProfileId, user.id))
      .limit(1);

    if (!userMemberships.length) {
      return NextResponse.json({ error: 'User has no choir membership' }, { status: 403 });
    }

    const choirId = userMemberships[0]!.choirId;
    const memberId = params.id;

    // Fetch comprehensive member details
    const memberData = await db
      .select({
        member: members,
        userProfile: userProfiles,
        membershipType: membershipTypes,
        voiceGroup: listOfValues,
        voiceType: listOfValues,
      })
      .from(members)
      .leftJoin(userProfiles, eq(members.userProfileId, userProfiles.id))
      .leftJoin(membershipTypes, eq(members.membershipTypeId, membershipTypes.id))
      .leftJoin(listOfValues, eq(members.voiceGroupId, listOfValues.id))
      .where(and(
        eq(members.id, memberId),
        eq(members.choirId, choirId)
      ))
      .limit(1);

    if (!memberData.length) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get voice type if it exists
    let voiceTypeData = null;
    if (memberData[0]!.member.voiceTypeId) {
      const voiceType = await db
        .select()
        .from(listOfValues)
        .where(eq(listOfValues.id, memberData[0]!.member.voiceTypeId))
        .limit(1);
      
      if (voiceType.length) {
        voiceTypeData = voiceType[0];
      }
    }

    // Fetch membership periods
    const periodsData = await db
      .select({
        period: membershipPeriods,
        membershipType: membershipTypes,
      })
      .from(membershipPeriods)
      .leftJoin(membershipTypes, eq(membershipPeriods.membershipTypeId, membershipTypes.id))
      .where(eq(membershipPeriods.memberId, memberId))
      .orderBy(desc(membershipPeriods.startDate));

    // Fetch leave history
    const leavesData = await db
      .select()
      .from(membershipLeaves)
      .where(eq(membershipLeaves.memberId, memberId))
      .orderBy(desc(membershipLeaves.startDate));

    // Fetch recent event attendance (last 20 events)
    const attendanceData = await db
      .select({
        attendance: eventAttendance,
        event: events,
      })
      .from(eventAttendance)
      .innerJoin(events, eq(eventAttendance.eventId, events.id))
      .where(eq(eventAttendance.memberId, memberId))
      .orderBy(desc(events.startTime))
      .limit(20);

    // Get current user's permissions
    const userPermissions = await getCurrentUserRole(user.id, choirId);

    // Transform the data
    const member = memberData[0]!;
    const result = {
      permissions: userPermissions,
      member: {
        id: member.member.id,
        name: member.userProfile?.name || 'Unknown',
        email: member.userProfile?.email || '',
        phone: member.userProfile?.phone || '',
        birthDate: member.userProfile?.birthDate,
        emergencyContact: member.userProfile?.emergencyContact || null,
        emergencyPhone: member.userProfile?.emergencyPhone || null,
        membershipStatus: 'active', // Status is determined by membership periods
        membershipType: member.membershipType ? {
          id: member.membershipType.id,
          name: member.membershipType.displayName,
          canAccessSystem: member.membershipType.canAccessSystem,
        } : null,
        voiceGroup: member.voiceGroup ? {
          id: member.voiceGroup.id,
          name: member.voiceGroup.displayName,
        } : null,
        voiceType: voiceTypeData ? {
          id: voiceTypeData.id,
          name: voiceTypeData.displayName,
        } : null,
        memberNotes: member.member.notes,
        additionalData: member.member.additionalData,
        createdAt: member.member.createdAt,
      },
      membershipPeriods: periodsData.map(p => ({
        id: p.period.id,
        startDate: p.period.startDate,
        endDate: p.period.endDate,
        endReason: p.period.endReason,
        membershipType: p.membershipType ? {
          id: p.membershipType.id,
          name: p.membershipType.displayName,
        } : null,
        isCurrentPeriod: p.period.endDate === null,
      })),
      leaves: leavesData.map(l => ({
        id: l.id,
        startDate: l.startDate,
        endDate: l.expectedReturnDate,
        reason: l.reason,
        leaveType: l.leaveType,
        approvalStatus: l.status,
        approvedBy: l.approvedBy,
        approvedAt: l.approvedAt,
        returnDate: l.actualReturnDate,
        notes: l.notes,
        isActive: new Date(l.startDate) <= new Date() && (!l.expectedReturnDate || new Date(l.expectedReturnDate) >= new Date()),
      })),
      recentAttendance: attendanceData.map(a => ({
        id: a.attendance.id,
        eventId: a.event.id,
        eventTitle: a.event.title,
        eventDate: a.event.startTime,
        intention: a.attendance.intendedStatus,
        recordedAttendance: a.attendance.actualStatus,
        reason: a.attendance.intendedReason,
        recordedAt: a.attendance.markedAt,
        recordedBy: a.attendance.markedBy,
      })),
    };

    return NextResponse.json(result);
  } catch (error) {
    // Error fetching member details
    return NextResponse.json(
      { error: 'Failed to fetch member details' },
      { status: 500 }
    );
  }
}