import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/drizzle/db'
import { members } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'

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