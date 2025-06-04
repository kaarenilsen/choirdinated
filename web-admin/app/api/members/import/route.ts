import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/drizzle/db'
import { userProfiles, members, membershipPeriods, membershipTypes, listOfValues } from '@/lib/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { getCurrentUserChoirId } from '@/lib/auth-helpers'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { data, sourceSystem } = await request.json()
    
    
    // Get the current user's choir ID
    const choirId = await getCurrentUserChoirId()
    
    
    if (!choirId) {
      return NextResponse.json(
        { 
          error: 'Unable to determine choir ID from user session. Please ensure you have completed choir setup.',
          details: 'User is not associated with any choir'
        },
        { status: 403 }
      )
    }
    
    const results = {
      imported: 0,
      updated: 0,
      errors: [] as Array<{ row: string; error: string }>,
      newConfigurations: {
        voiceGroups: new Set<string>(),
        voiceTypes: new Set<string>(),
        membershipTypes: new Set<string>()
      }
    }

    // First, ensure all voice groups, voice types, and membership types exist
    for (const row of data) {
      if (row.voiceGroup) {
        results.newConfigurations.voiceGroups.add(row.voiceGroup)
      }
      if (row.voiceType) {
        results.newConfigurations.voiceTypes.add(row.voiceType)
      }
      if (row.membershipType) {
        results.newConfigurations.membershipTypes.add(row.membershipType)
      }
    }

    // Create missing voice groups (these are the parent level)
    const createdVoiceGroups = new Map<string, string>() // value -> id mapping
    
    for (const voiceGroup of results.newConfigurations.voiceGroups) {
      const allVoiceGroups = await db
        .select()
        .from(listOfValues)
        .where(
          and(
            eq(listOfValues.choirId, choirId),
            eq(listOfValues.category, 'voice_group')
          )
        )
      
      const existing = allVoiceGroups.filter(vg => 
        vg.value?.toLowerCase() === voiceGroup.toLowerCase() ||
        vg.displayName?.toLowerCase() === voiceGroup.toLowerCase()
      )

      if (existing.length === 0) {
        const [created] = await db.insert(listOfValues).values({
          id: uuidv4(),
          choirId,
          category: 'voice_group',
          value: voiceGroup,
          displayName: voiceGroup,
          isActive: true,
          sortOrder: 0
        }).returning()
        
        if (created) {
          createdVoiceGroups.set(voiceGroup, created.id)
        }
      } else {
        createdVoiceGroups.set(voiceGroup, existing[0]!.id)
      }
    }

    // Create missing voice types (these are subdivisions of voice groups)
    for (const voiceType of results.newConfigurations.voiceTypes) {
      const allVoiceTypes = await db
        .select()
        .from(listOfValues)
        .where(
          and(
            eq(listOfValues.choirId, choirId),
            eq(listOfValues.category, 'voice_type')
          )
        )
      
      const existing = allVoiceTypes.filter(vt => 
        vt.value?.toLowerCase() === voiceType.toLowerCase() ||
        vt.displayName?.toLowerCase() === voiceType.toLowerCase()
      )

      if (existing.length === 0) {
        // Enhanced logic to find parent voice group
        let parentId = null
        
        // Try to match voice type to parent voice group
        // This handles common patterns like "1. Sopran" -> "Sopran", "2. Bass" -> "Bass", etc.
        const voiceTypeLower = voiceType.toLowerCase()
        
        for (const [groupValue, groupId] of createdVoiceGroups.entries()) {
          const groupLower = groupValue.toLowerCase()
          
          // Check if voice type contains the group name
          if (voiceTypeLower.includes(groupLower) || 
              voiceTypeLower.includes(groupLower.replace('sopran', 'soprano')) ||
              voiceTypeLower.includes(groupLower.replace('soprano', 'sopran'))) {
            parentId = groupId
            break
          }
          
          // Handle specific mappings
          if ((groupLower === 'soprano' || groupLower === 'sopran') && 
              (voiceTypeLower.includes('sopran') || voiceTypeLower.includes('soprano'))) {
            parentId = groupId
            break
          }
          if (groupLower === 'alto' && voiceTypeLower.includes('alt')) {
            parentId = groupId
            break
          }
          if (groupLower === 'tenor' && voiceTypeLower.includes('tenor')) {
            parentId = groupId
            break
          }
          if (groupLower === 'bass' && voiceTypeLower.includes('bass')) {
            parentId = groupId
            break
          }
        }

        await db.insert(listOfValues).values({
          id: uuidv4(),
          choirId,
          category: 'voice_type',
          value: voiceType,
          displayName: voiceType,
          isActive: true,
          sortOrder: 0,
          parentId
        })
      }
    }

    // Create missing membership types
    for (const membershipTypeName of results.newConfigurations.membershipTypes) {
      const allMembershipTypes = await db
        .select()
        .from(membershipTypes)
        .where(eq(membershipTypes.choirId, choirId))
      
      const existing = allMembershipTypes.filter(mt => 
        mt.name?.toLowerCase() === membershipTypeName.toLowerCase() ||
        mt.displayName?.toLowerCase() === membershipTypeName.toLowerCase()
      )

      if (existing.length === 0) {
        await db.insert(membershipTypes).values({
          id: uuidv4(),
          choirId,
          name: membershipTypeName,
          displayName: membershipTypeName,
          isActiveMembership: membershipTypeName.toLowerCase().includes('fast') || 
                              membershipTypeName.toLowerCase().includes('prosjekt'),
          canAccessSystem: true,
          canVote: membershipTypeName.toLowerCase().includes('fast'),
          sortOrder: 0
        })
      }
    }

    // Create a set of mapped field names to identify unmapped fields
    // const mappedFieldNames = new Set(Object.values(fieldMappings || {}))
    
    // Import members
    for (const row of data) {
      try {
        
        // Collect unmapped fields for additional_data
        const additionalData: Record<string, any> = {}
        
        // Check if there are unmapped fields passed from the frontend
        if (row._unmappedFields) {
          Object.assign(additionalData, row._unmappedFields)
          // Remove the _unmappedFields from the row object as it's not a real field
          delete row._unmappedFields
        }
        
        // Add source system info to additional data
        if (sourceSystem) {
          additionalData._importSource = sourceSystem
          additionalData._importDate = new Date().toISOString()
        }
        
        
        // Check if user profile exists by email
        const existingProfile = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.email, row.email))
          .limit(1)

        let userProfileId: string

        if (existingProfile.length === 0) {
          // Create new auth user and user profile
          
          const parsedBirthDate = parseBirthDate(row.birthDate)
          if (!parsedBirthDate) {
            throw new Error(`Birth date is required for ${row.firstName} ${row.lastName}`)
          }
          
          // Create Supabase Admin client for user creation
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            }
          )
          
          // Create auth user via Admin API
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: row.email,
            password: 'temporary-password-' + Math.random().toString(36).slice(2), // Random temp password
            email_confirm: true, // Skip email confirmation for imports
            user_metadata: {
              name: `${row.firstName} ${row.lastName}`,
              birth_date: parsedBirthDate,
              phone: row.phone || null,
              emergency_contact: row.emergencyContact || null,
              emergency_phone: row.emergencyPhone || null,
              imported: true,
              imported_at: new Date().toISOString()
            }
          })
          
          if (authError || !authUser.user) {
            throw new Error(`Failed to create auth user: ${authError?.message || 'Unknown error'}`)
          }
          
          userProfileId = authUser.user.id
          
          // The user profile should be automatically created by the database trigger
          // Wait a moment for the trigger to execute
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Verify the user profile was created and update it with additional fields
          const createdProfile = await db
            .select()
            .from(userProfiles)
            .where(eq(userProfiles.id, userProfileId))
            .limit(1)
          
          if (createdProfile.length === 0) {
            throw new Error('User profile was not created by trigger - please check database setup')
          }
          
          // Update the profile with import-specific fields
          await db
            .update(userProfiles)
            .set({
              birthDate: parsedBirthDate,
              phone: row.phone || null,
              emergencyContact: row.emergencyContact || null,
              emergencyPhone: row.emergencyPhone || null,
              isActive: row.status !== 'Inaktiv'
            })
            .where(eq(userProfiles.id, userProfileId))
          
        } else {
          userProfileId = existingProfile[0]!.id
        }

        // Get IDs for voice group, voice type, and membership type
        // Use case-insensitive matching for better compatibility
        const voiceGroupResults = await db
          .select()
          .from(listOfValues)
          .where(
            and(
              eq(listOfValues.choirId, choirId),
              eq(listOfValues.category, 'voice_group')
            )
          )
        
        const voiceGroupResult = voiceGroupResults.find(vg => 
          vg.value?.toLowerCase() === row.voiceGroup?.toLowerCase() ||
          vg.displayName?.toLowerCase() === row.voiceGroup?.toLowerCase()
        )

        let voiceTypeId: string | null = null
        if (row.voiceType) {
          const voiceTypeResults = await db
            .select()
            .from(listOfValues)
            .where(
              and(
                eq(listOfValues.choirId, choirId),
                eq(listOfValues.category, 'voice_type')
              )
            )
          
          const voiceTypeResult = voiceTypeResults.find(vt => 
            vt.value?.toLowerCase() === row.voiceType?.toLowerCase() ||
            vt.displayName?.toLowerCase() === row.voiceType?.toLowerCase()
          )
          
          voiceTypeId = voiceTypeResult?.id || null
        }

        const membershipTypeResults = await db
          .select()
          .from(membershipTypes)
          .where(eq(membershipTypes.choirId, choirId))
        
        const membershipTypeResult = membershipTypeResults.find(mt => 
          mt.name?.toLowerCase() === row.membershipType?.toLowerCase() ||
          mt.displayName?.toLowerCase() === row.membershipType?.toLowerCase()
        )

        // Check if member exists
        const existingMember = await db
          .select()
          .from(members)
          .where(
            and(
              eq(members.userProfileId, userProfileId),
              eq(members.choirId, choirId)
            )
          )
          .limit(1)

        if (!membershipTypeResult || !voiceGroupResult) {
          throw new Error(`Missing required data: membershipType="${row.membershipType}", voiceGroup="${row.voiceGroup}"`)
        }

        if (existingMember.length === 0) {
          // Create new member with transaction to ensure consistency
          
          await db.transaction(async (tx) => {
            const memberId = uuidv4()
            
            // Insert member
            await tx.insert(members).values({
              id: memberId,
              userProfileId,
              choirId,
              membershipTypeId: membershipTypeResult.id,
              voiceGroupId: voiceGroupResult.id,
              voiceTypeId,
              notes: null,
              additionalData: Object.keys(additionalData).length > 0 ? additionalData : null
            } as any)
            

            // Create initial membership period
            const startDate = parseRegistrationDate(row.registrationDate) || new Date().toISOString().split('T')[0]
            
            await tx.insert(membershipPeriods).values({
              memberId,
              startDate,
              endDate: null,
              membershipTypeId: membershipTypeResult.id,
              voiceGroupId: voiceGroupResult.id,
              voiceTypeId,
              endReason: null,
              notes: null
            } as any)
            
          })

          results.imported++
        } else {
          // Update existing member if needed
          results.updated++
        }
      } catch (error) {
        
        let errorMessage = 'Unknown error'
        
        if (error instanceof Error) {
          errorMessage = error.message
          
          // Handle specific database constraint errors
          if (error.message.includes('duplicate key')) {
            errorMessage = 'Email address already exists'
          } else if (error.message.includes('foreign key')) {
            errorMessage = 'Invalid reference data (choir, membership type, or voice group)'
          } else if (error.message.includes('not-null')) {
            errorMessage = 'Missing required field'
          }
        }
        
        results.errors.push({
          row: `${row.firstName} ${row.lastName}`,
          error: errorMessage
        })
      }
    }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Import failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

function parseBirthDate(dateStr: string): string | null {
  if (!dateStr) return null
  
  // Handle various date formats
  // "9. okt. 1978" -> "1978-10-09"
  const months: Record<string, string> = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'mai': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'okt': '10', 'nov': '11', 'des': '12'
  }
  
  const parts = dateStr.split(/[\s.]+/)
  if (parts.length >= 3) {
    const day = parts[0]?.padStart(2, '0') ?? '01'
    const month = months[parts[1]?.toLowerCase() ?? ''] || '01'
    const year = parts[2] ?? '1900'
    return `${year}-${month}-${day}`
  }
  
  return dateStr
}

function parseRegistrationDate(dateStr: string): string | null {
  if (!dateStr) return null
  return parseBirthDate(dateStr)
}