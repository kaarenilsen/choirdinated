import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/drizzle/db'
import { members, membershipTypes } from '@/lib/drizzle/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Get the current user's choir ID from their session and membership
 * This assumes the user is a member of exactly one choir
 */
export async function getCurrentUserChoirId(): Promise<string | null> {
  try {
    
    // Get the current user from Supabase session - use RouteHandlerClient for API routes
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }


    // Look up the user's choir membership
    const userMemberships = await db
      .select({
        choirId: members.choirId
      })
      .from(members)
      .where(eq(members.userProfileId, user.id))
      .limit(1)

    
    if (userMemberships.length === 0) {
      return null
    }

    const choirId = userMemberships[0]!.choirId
    return choirId
  } catch (error) {
    return null
  }
}

/**
 * Verify that a user has access to a specific choir
 */
export async function verifyUserChoirAccess(choirId: string): Promise<boolean> {
  try {
    const userChoirId = await getCurrentUserChoirId()
    return userChoirId === choirId
  } catch (error) {
    return false
  }
}

/**
 * Check if the current user is a choir admin (conductor or admin role)
 */
export async function isChoirAdmin(userId: string, choirId: string): Promise<boolean> {
  try {
    const userMembership = await db
      .select({
        membershipType: membershipTypes.name
      })
      .from(members)
      .innerJoin(membershipTypes, eq(members.membershipTypeId, membershipTypes.id))
      .where(and(
        eq(members.userProfileId, userId),
        eq(members.choirId, choirId),
      ))
      .limit(1)

    if (!userMembership.length) return false

    const role = userMembership[0]!.membershipType
    return role === 'conductor' || role === 'admin' || role === 'assistant_conductor'
  } catch (error) {
    return false
  }
}

/**
 * Check if the current user is a group leader (section leader)
 */
export async function isGroupLeader(userId: string, choirId: string): Promise<boolean> {
  try {
    const userMembership = await db
      .select({
        membershipType: membershipTypes.name
      })
      .from(members)
      .innerJoin(membershipTypes, eq(members.membershipTypeId, membershipTypes.id))
      .where(and(
        eq(members.userProfileId, userId),
        eq(members.choirId, choirId),
      ))
      .limit(1)

    if (!userMembership.length) return false

    const role = userMembership[0]!.membershipType
    return role === 'section_leader' || role === 'conductor' || role === 'admin' || role === 'assistant_conductor'
  } catch (error) {
    return false
  }
}

/**
 * Get current user's role and permissions
 */
export async function getCurrentUserRole(userId: string, choirId: string): Promise<{
  role: string | null,
  isAdmin: boolean,
  isGroupLeader: boolean
}> {
  try {
    const userMembership = await db
      .select({
        membershipType: membershipTypes.name,
        displayName: membershipTypes.displayName
      })
      .from(members)
      .innerJoin(membershipTypes, eq(members.membershipTypeId, membershipTypes.id))
      .where(and(
        eq(members.userProfileId, userId),
        eq(members.choirId, choirId),
      ))
      .limit(1)

    if (!userMembership.length) {
      return { role: null, isAdmin: false, isGroupLeader: false }
    }

    const role = userMembership[0]!.membershipType
    const isAdmin = role === 'conductor' || role === 'admin' || role === 'assistant_conductor'
    const isGroupLeader = role === 'section_leader' || isAdmin

    return { role, isAdmin, isGroupLeader }
  } catch (error) {
    return { role: null, isAdmin: false, isGroupLeader: false }
  }
}