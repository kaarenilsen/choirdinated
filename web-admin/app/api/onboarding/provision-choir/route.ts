import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { db } from '@/lib/drizzle/db'
import { choirs, membershipTypes, listOfValues, userProfiles, members, membershipPeriods } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
// Inline the default configurations since shared package isn't built
const getDefaultMembershipTypes = () => [
  { name: 'active_member', displayName: 'Aktivt medlem', isActiveMembership: true, canAccessSystem: true, canVote: true, sortOrder: 1 },
  { name: 'conductor', displayName: 'Dirigent', isActiveMembership: true, canAccessSystem: true, canVote: true, sortOrder: 2 },
  { name: 'assistant_conductor', displayName: 'Assisterende Dirigent', isActiveMembership: true, canAccessSystem: true, canVote: true, sortOrder: 3 },
  { name: 'section_leader', displayName: 'Stemmeleder', isActiveMembership: true, canAccessSystem: true, canVote: true, sortOrder: 4 },
  { name: 'member', displayName: 'Medlem', isActiveMembership: true, canAccessSystem: true, canVote: true, sortOrder: 5 },
  { name: 'guest', displayName: 'Gjest', isActiveMembership: false, canAccessSystem: true, canVote: false, sortOrder: 6 }
]

const getDefaultEventTypes = () => [
  { category: 'event_type', value: 'rehearsal', displayName: 'Øvelse', sortOrder: 1 },
  { category: 'event_type', value: 'concert', displayName: 'Konsert', sortOrder: 2 },
  { category: 'event_type', value: 'recording', displayName: 'Innspilling', sortOrder: 3 },
  { category: 'event_type', value: 'workshop', displayName: 'Workshop', sortOrder: 4 },
  { category: 'event_type', value: 'meeting', displayName: 'Møte', sortOrder: 5 },
  { category: 'event_type', value: 'social', displayName: 'Sosialt arrangement', sortOrder: 6 }
]

const getDefaultEventStatuses = () => [
  { category: 'event_status', value: 'scheduled', displayName: 'Planlagt', sortOrder: 1 },
  { category: 'event_status', value: 'confirmed', displayName: 'Bekreftet', sortOrder: 2 },
  { category: 'event_status', value: 'cancelled', displayName: 'Avlyst', sortOrder: 3 },
  { category: 'event_status', value: 'completed', displayName: 'Gjennomført', sortOrder: 4 },
  { category: 'event_status', value: 'postponed', displayName: 'Utsatt', sortOrder: 5 }
]

const getDefaultVoiceConfiguration = (configurationType: 'SATB' | 'SSAATTBB' | 'SMATBB') => {
  const voiceGroups = []
  const voiceTypes = []
  
  switch (configurationType) {
    case 'SATB':
      // For SATB, we only need voice groups (no subdivisions)
      voiceGroups.push(
        { category: 'voice_group', value: 'soprano', displayName: 'Sopran', sortOrder: 1 },
        { category: 'voice_group', value: 'alto', displayName: 'Alt', sortOrder: 2 },
        { category: 'voice_group', value: 'tenor', displayName: 'Tenor', sortOrder: 3 },
        { category: 'voice_group', value: 'bass', displayName: 'Bass', sortOrder: 4 }
      )
      break

    case 'SSAATTBB':
      // Voice groups (parent level)
      voiceGroups.push(
        { category: 'voice_group', value: 'soprano', displayName: 'Sopran', sortOrder: 1 },
        { category: 'voice_group', value: 'alto', displayName: 'Alt', sortOrder: 2 },
        { category: 'voice_group', value: 'tenor', displayName: 'Tenor', sortOrder: 3 },
        { category: 'voice_group', value: 'bass', displayName: 'Bass', sortOrder: 4 }
      )
      
      // Voice types (subdivisions) - will be linked to parent groups after insertion
      voiceTypes.push(
        { category: 'voice_type', value: 'soprano_1', displayName: '1. Sopran', sortOrder: 1, parentValue: 'soprano' },
        { category: 'voice_type', value: 'soprano_2', displayName: '2. Sopran', sortOrder: 2, parentValue: 'soprano' },
        { category: 'voice_type', value: 'alto_1', displayName: '1. Alt', sortOrder: 3, parentValue: 'alto' },
        { category: 'voice_type', value: 'alto_2', displayName: '2. Alt', sortOrder: 4, parentValue: 'alto' },
        { category: 'voice_type', value: 'tenor_1', displayName: '1. Tenor', sortOrder: 5, parentValue: 'tenor' },
        { category: 'voice_type', value: 'tenor_2', displayName: '2. Tenor', sortOrder: 6, parentValue: 'tenor' },
        { category: 'voice_type', value: 'bass_1', displayName: '1. Bass', sortOrder: 7, parentValue: 'bass' },
        { category: 'voice_type', value: 'bass_2', displayName: '2. Bass', sortOrder: 8, parentValue: 'bass' }
      )
      break

    case 'SMATBB':
      // For operatic, we use individual voice groups (no subdivisions typically needed)
      voiceGroups.push(
        { category: 'voice_group', value: 'soprano', displayName: 'Sopran', sortOrder: 1 },
        { category: 'voice_group', value: 'mezzo', displayName: 'Mezzosopran', sortOrder: 2 },
        { category: 'voice_group', value: 'alto', displayName: 'Alt', sortOrder: 3 },
        { category: 'voice_group', value: 'tenor', displayName: 'Tenor', sortOrder: 4 },
        { category: 'voice_group', value: 'baritone', displayName: 'Baryton', sortOrder: 5 },
        { category: 'voice_group', value: 'bass', displayName: 'Bass', sortOrder: 6 }
      )
      break
  }
  
  return { voiceGroups, voiceTypes }
}

import { z } from 'zod'

const provisionChoirSchema = z.object({
  // Choir Info
  name: z.string().min(1, 'Choir name is required'),
  vatNumber: z.string().optional(),
  foundedYear: z.number().optional(),
  rehearsalLocation: z.string().min(1, 'Rehearsal location is required'),
  description: z.string().optional(),
  organizationType: z.enum(['symphony', 'opera', 'independent']),
  parentOrganization: z.string().optional(),

  // Contact Person
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().optional(),
  contactPassword: z.string().min(8, 'Password must be at least 8 characters'),
  contactBirthDate: z.string().min(1, 'Birth date is required'),

  // Voice Organization
  voiceConfiguration: z.enum(['SATB', 'SSAATTBB', 'SMATBB']),

  // Billing
  billingName: z.string().min(1, 'Billing name is required'),
  billingAddress: z.string().min(1, 'Billing address is required'),
  billingPostalCode: z.string().min(1, 'Postal code is required'),
  billingCity: z.string().min(1, 'City is required'),
  billingEmail: z.string().email('Valid billing email is required'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validatedData = provisionChoirSchema.parse(body)

    // Create Supabase admin client for user creation
    const supabase = createSupabaseAdminClient()

    // Start transaction for choir provisioning
    const result = await db.transaction(async (tx) => {
      // 1. Create the choir
      const choirResult = await tx.insert(choirs).values({
        name: validatedData.name,
        description: validatedData.description ?? null,
        organizationType: validatedData.organizationType,
        foundedYear: validatedData.foundedYear ?? null,
        website: null, // Can be added later
        logoUrl: null, // Can be uploaded later
        settings: {
          allowMemberMessaging: true,
          requireAttendanceTracking: true,
          autoArchiveEventsAfterDays: 365,
          defaultEventDurationMinutes: 120,
          holidayCalendarRegion: 'NO',
          rehearsalLocation: validatedData.rehearsalLocation,
          parentOrganization: validatedData.parentOrganization,
          vatNumber: validatedData.vatNumber,
          billing: {
            name: validatedData.billingName,
            address: validatedData.billingAddress,
            postalCode: validatedData.billingPostalCode,
            city: validatedData.billingCity,
            email: validatedData.billingEmail,
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            monthlyFee: 500 // NOK
          }
        }
      }).returning()
      
      const choir = choirResult[0]
      if (!choir) {
        throw new Error('Failed to create choir')
      }

      // 2. Create default membership types
      const defaultMembershipTypes = getDefaultMembershipTypes()
      const insertedMembershipTypes = await tx.insert(membershipTypes).values(
        defaultMembershipTypes.map(mt => ({
          choirId: choir.id,
          name: mt.name,
          displayName: mt.displayName,
          isActiveMembership: mt.isActiveMembership,
          canAccessSystem: mt.canAccessSystem,
          canVote: mt.canVote,
          sortOrder: mt.sortOrder,
          description: null
        }))
      ).returning()

      // Find the admin membership type
      const adminMembershipType = insertedMembershipTypes.find(mt => mt.name === 'conductor')
      if (!adminMembershipType) {
        throw new Error('Failed to create admin membership type')
      }

      // 3. Create default list of values (event types, statuses, voice configuration)
      const eventTypeValues = getDefaultEventTypes().map(et => ({
        choirId: choir.id,
        category: et.category as 'event_type',
        value: et.value,
        displayName: et.displayName,
        isActive: true,
        sortOrder: et.sortOrder,
        parentId: null,
        metadata: {}
      }))

      const eventStatusValues = getDefaultEventStatuses().map(es => ({
        choirId: choir.id,
        category: es.category as 'event_status',
        value: es.value,
        displayName: es.displayName,
        isActive: true,
        sortOrder: es.sortOrder,
        parentId: null,
        metadata: {}
      }))

      // Insert event types and statuses first
      await tx.insert(listOfValues).values([
        ...eventTypeValues,
        ...eventStatusValues
      ])

      // Get voice configuration
      const { voiceGroups, voiceTypes } = getDefaultVoiceConfiguration(validatedData.voiceConfiguration)

      // Insert voice groups first (they are the parent level)
      const voiceGroupValues = voiceGroups.map(vg => ({
        choirId: choir.id,
        category: vg.category as 'voice_group',
        value: vg.value,
        displayName: vg.displayName,
        isActive: true,
        sortOrder: vg.sortOrder,
        parentId: null,
        metadata: {}
      }))

      const insertedVoiceGroups = await tx.insert(listOfValues).values(voiceGroupValues).returning()

      // Insert voice types (subdivisions) with proper parent relationships
      if (voiceTypes.length > 0) {
        const voiceTypeValues = voiceTypes.map(vt => {
          // Find the parent voice group
          const parentGroup = insertedVoiceGroups.find(vg => vg.value === vt.parentValue)
          return {
            choirId: choir.id,
            category: vt.category as 'voice_type',
            value: vt.value,
            displayName: vt.displayName,
            isActive: true,
            sortOrder: vt.sortOrder,
            parentId: parentGroup?.id || null,
            metadata: {}
          }
        })

        await tx.insert(listOfValues).values(voiceTypeValues)
      }

      // Note: All list of values have been created with proper hierarchical relationships

      // Get voice group for the admin user (default to first voice group, preferably soprano)
      const defaultVoiceGroup = insertedVoiceGroups.find(v => 
        v.category === 'voice_group' && ['soprano', 'sopran'].includes(v.value.toLowerCase())
      ) || insertedVoiceGroups[0] // Fall back to first voice group if no soprano found

      if (!defaultVoiceGroup) {
        throw new Error('Failed to create voice configuration')
      }

      // 4. Create Supabase auth user for the contact person
      
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: validatedData.contactEmail,
        password: validatedData.contactPassword,
        email_confirm: true,
        user_metadata: {
          name: validatedData.contactName,
          birth_date: validatedData.contactBirthDate
        }
      })

      if (authError || !authUser.user) {
        throw new Error(`Failed to create user account: ${authError?.message || 'Unknown error'}`)
      }
      

      // 5. Create or update user profile (trigger might have already created it)
      let userProfile
      
      // First try to select the existing profile
      const existingProfile = await tx.select().from(userProfiles).where(eq(userProfiles.id, authUser.user.id)).limit(1)
      
      if (existingProfile.length > 0) {
        // Update existing profile created by trigger
        const [updated] = await tx.update(userProfiles)
          .set({
            name: validatedData.contactName,
            birthDate: validatedData.contactBirthDate,
            phone: validatedData.contactPhone ?? null,
            isActive: true
          })
          .where(eq(userProfiles.id, authUser.user.id))
          .returning()
        userProfile = updated
      } else {
        // Create new profile if trigger didn't create it
        const [created] = await tx.insert(userProfiles).values({
          id: authUser.user.id,
          email: validatedData.contactEmail,
          name: validatedData.contactName,
          birthDate: validatedData.contactBirthDate,
          phone: validatedData.contactPhone ?? null,
          isActive: true
        }).returning()
        userProfile = created
      }

      if (!userProfile) {
        throw new Error('Failed to create or update user profile')
      }

      // 6. Create member record
      const [member] = await tx.insert(members).values({
        userProfileId: userProfile.id,
        choirId: choir.id,
        membershipTypeId: adminMembershipType.id,
        voiceGroupId: defaultVoiceGroup.id,
        voiceTypeId: null, // Admin doesn't need a specific voice type subdivision
        notes: 'Founding administrator'
      }).returning()

      if (!member) {
        throw new Error('Failed to create member record')
      }

      // 7. Create initial membership period
      await tx.insert(membershipPeriods).values({
        memberId: member.id,
        startDate: new Date().toISOString().split('T')[0],
        membershipTypeId: adminMembershipType.id,
        voiceGroupId: defaultVoiceGroup.id,
        voiceTypeId: null, // Admin doesn't need a specific voice type subdivision
        notes: 'Initial administrator period'
      } as any)

      return {
        choir,
        userProfile,
        member,
        adminMembershipType
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        choirId: result.choir.id,
        userId: result.userProfile.id,
        memberId: result.member.id,
        trialEndsAt: (result.choir.settings as any).billing?.trialEndsAt
      }
    })

  } catch (error) {
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to provision choir' },
      { status: 500 }
    )
  }
}