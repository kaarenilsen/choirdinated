import { db } from '../db'
import { eq, desc } from 'drizzle-orm'
import { infoFeed, chats, messages, members, membershipTypes } from '../schema'
import { expandVoiceTargeting } from './voice-hierarchy'

export interface CreateInfoFeedInput {
  title: string
  content: string
  authorId: string
  isPinned?: boolean
  targetMembershipTypes?: string[]
  targetVoiceGroups?: string[]
  targetVoiceTypes?: string[]
  includeAllActive?: boolean
  allowsComments?: boolean
}

/**
 * Create an info feed post with proper voice group targeting
 */
export async function createInfoFeedPost(input: CreateInfoFeedInput) {
  // Expand voice targeting to include all voice types under targeted voice groups
  const { voiceTypeIds, voiceGroupIds } = await expandVoiceTargeting(
    input.targetVoiceGroups || [],
    input.targetVoiceTypes || []
  )

  // Create the info feed post
  const [post] = await db
    .insert(infoFeed)
    .values({
      ...input,
      targetVoiceGroups: voiceGroupIds,
      targetVoiceTypes: voiceTypeIds,
      includeAllActive: input.includeAllActive ?? true,
      allowsComments: input.allowsComments ?? true
    })
    .returning()

  return post
}

/**
 * Get info feed posts visible to a member
 */
export async function getInfoFeedForMember(memberId: string) {
  // Get member details
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1)

  if (!member) {
    throw new Error('Member not found')
  }

  // Get member's membership type
  const [membershipType] = await db
    .select()
    .from(membershipTypes)
    .where(eq(membershipTypes.id, member.membershipTypeId))
    .limit(1)

  // Only proceed if member has active membership
  if (!membershipType?.isActiveMembership) {
    return []
  }

  // Query info feed posts where member is eligible
  // Since we're using member data from previous queries, we need to filter using SQL operators on JSON fields
  const posts = await db
    .select()
    .from(infoFeed)
    .orderBy(desc(infoFeed.isPinned), desc(infoFeed.publishedAt))

  // Filter posts in application logic since we're mixing result data with column queries
  return posts.filter(post => {
    // Include all active members
    if (post.includeAllActive) {
      return true
    }

    // Check if member's membership type is targeted
    const targetMembershipTypes = post.targetMembershipTypes as string[] || []
    if (targetMembershipTypes.length === 0 || targetMembershipTypes.includes(member.membershipTypeId)) {
      return true
    }

    // Check if member's voice group is targeted
    const targetVoiceGroups = post.targetVoiceGroups as string[] || []
    if (targetVoiceGroups.includes(member.voiceGroupId)) {
      return true
    }

    // Check if member's voice type is targeted
    const targetVoiceTypes = post.targetVoiceTypes as string[] || []
    if (member.voiceTypeId && targetVoiceTypes.includes(member.voiceTypeId)) {
      return true
    }

    return false
  })
}

/**
 * Create a chat for voice groups/types
 */
export async function createVoiceChat(input: {
  name?: string
  type: string
  voiceGroupId?: string
  voiceTypeId?: string
  membershipTypeIds?: string[]
  createdBy: string
}) {
  // If creating a voice group chat, ensure all voice types under it can participate
  let expandedVoiceTypeId = input.voiceTypeId
  let expandedVoiceGroupId = input.voiceGroupId

  if (input.voiceGroupId && !input.voiceTypeId) {
    // This is a voice group chat - it includes all voice types under this group
    expandedVoiceGroupId = input.voiceGroupId
    expandedVoiceTypeId = undefined // Don't restrict to specific voice type
  }

  const [chat] = await db
    .insert(chats)
    .values({
      name: input.name ?? null,
      type: input.type,
      voiceGroupId: expandedVoiceGroupId ?? null,
      voiceTypeId: expandedVoiceTypeId ?? null,
      membershipTypeIds: input.membershipTypeIds || [],
      createdBy: input.createdBy
    })
    .returning()

  return chat
}

/**
 * Get chats accessible to a member
 */
export async function getChatsForMember(memberId: string) {
  // Get member details
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1)

  if (!member) {
    throw new Error('Member not found')
  }

  // Query all active chats and filter in application logic
  const allChats = await db
    .select()
    .from(chats)
    .where(eq(chats.isActive, true))

  // Filter chats where member can participate
  return allChats.filter(chat => {
    // Chat for member's voice group (includes all voice types in that group)
    if (chat.voiceGroupId === member.voiceGroupId && chat.voiceTypeId === null) {
      return true
    }

    // Chat for member's specific voice type
    if (member.voiceTypeId && chat.voiceTypeId === member.voiceTypeId) {
      return true
    }

    // Chat for member's membership type
    const membershipTypeIds = chat.membershipTypeIds as string[] || []
    if (membershipTypeIds.includes(member.membershipTypeId)) {
      return true
    }

    return false
  })
}

/**
 * Check if a member can send messages in a chat
 */
export async function canMemberSendMessage(memberId: string, chatId: string): Promise<boolean> {
  const memberChats = await getChatsForMember(memberId)
  return memberChats.some(chat => chat.id === chatId)
}

/**
 * Send a message in a chat
 */
export async function sendMessage(input: {
  chatId: string
  senderId: string
  content: string
}) {
  // First verify the sender can send to this chat
  const canSend = await canMemberSendMessage(input.senderId, input.chatId)
  
  if (!canSend) {
    throw new Error('Member is not authorized to send messages in this chat')
  }

  const [message] = await db
    .insert(messages)
    .values(input)
    .returning()

  return message
}