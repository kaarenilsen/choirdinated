import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/drizzle/db'
import { userProfiles, members, membershipPeriods, membershipTypes, listOfValues, choirs } from '@/lib/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { sourceSystem, fieldMappings, valueMappings, data } = await request.json()
    
    // TODO: Get the actual choir ID from the user's session
    const choirId = 'placeholder-choir-id'
    
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

    // Create missing voice groups
    for (const voiceGroup of results.newConfigurations.voiceGroups) {
      const existing = await db
        .select()
        .from(listOfValues)
        .where(
          and(
            eq(listOfValues.choirId, choirId),
            eq(listOfValues.category, 'voice_group'),
            eq(listOfValues.value, voiceGroup)
          )
        )
        .limit(1)

      if (existing.length === 0) {
        await db.insert(listOfValues).values({
          id: uuidv4(),
          choirId,
          category: 'voice_group',
          value: voiceGroup,
          displayName: voiceGroup,
          isActive: true,
          sortOrder: 0
        })
      }
    }

    // Create missing voice types
    for (const voiceType of results.newConfigurations.voiceTypes) {
      const existing = await db
        .select()
        .from(listOfValues)
        .where(
          and(
            eq(listOfValues.choirId, choirId),
            eq(listOfValues.category, 'voice_type'),
            eq(listOfValues.value, voiceType)
          )
        )
        .limit(1)

      if (existing.length === 0) {
        // Find parent voice group (simplified logic)
        const parentGroup = voiceType.includes('Sopran') ? 'Sopran' :
                          voiceType.includes('Alt') ? 'Alt' :
                          voiceType.includes('Tenor') ? 'Tenor' :
                          voiceType.includes('Bass') ? 'Bass' : null

        let parentId = null
        if (parentGroup) {
          const parent = await db
            .select()
            .from(listOfValues)
            .where(
              and(
                eq(listOfValues.choirId, choirId),
                eq(listOfValues.category, 'voice_group'),
                eq(listOfValues.value, parentGroup)
              )
            )
            .limit(1)
          
          parentId = parent[0]?.id
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
      const existing = await db
        .select()
        .from(membershipTypes)
        .where(
          and(
            eq(membershipTypes.choirId, choirId),
            eq(membershipTypes.name, membershipTypeName)
          )
        )
        .limit(1)

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

    // Import members
    for (const row of data) {
      try {
        // Check if user profile exists by email
        let userProfile = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.email, row.email))
          .limit(1)

        const userProfileId = userProfile.length > 0 ? userProfile[0].id : uuidv4()

        if (userProfile.length === 0) {
          // Create new user profile
          const parsedBirthDate = parseBirthDate(row.birthDate)
          if (!parsedBirthDate) {
            throw new Error('Birth date is required')
          }
          
          await db.insert(userProfiles).values({
            id: userProfileId,
            email: row.email,
            name: `${row.firstName} ${row.lastName}`,
            birthDate: parsedBirthDate,
            phone: row.phone || null,
            emergencyContact: row.emergencyContact || null,
            emergencyPhone: row.emergencyPhone || null,
            isActive: row.status !== 'Inaktiv'
          })
        }

        // Get IDs for voice group, voice type, and membership type
        const [voiceGroupResult] = await db
          .select()
          .from(listOfValues)
          .where(
            and(
              eq(listOfValues.choirId, choirId),
              eq(listOfValues.category, 'voice_group'),
              eq(listOfValues.value, row.voiceGroup)
            )
          )
          .limit(1)

        let voiceTypeId = null
        if (row.voiceType) {
          const [voiceTypeResult] = await db
            .select()
            .from(listOfValues)
            .where(
              and(
                eq(listOfValues.choirId, choirId),
                eq(listOfValues.category, 'voice_type'),
                eq(listOfValues.value, row.voiceType)
              )
            )
            .limit(1)
          voiceTypeId = voiceTypeResult?.id
        }

        const [membershipTypeResult] = await db
          .select()
          .from(membershipTypes)
          .where(
            and(
              eq(membershipTypes.choirId, choirId),
              eq(membershipTypes.name, row.membershipType)
            )
          )
          .limit(1)

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

        if (existingMember.length === 0) {
          // Create new member
          const memberId = uuidv4()
          await db.insert(members).values({
            id: memberId,
            userProfileId,
            choirId,
            membershipTypeId: membershipTypeResult.id,
            voiceGroupId: voiceGroupResult.id,
            voiceTypeId,
            notes: null
          })

          // Create initial membership period
          await db.insert(membershipPeriods).values({
            id: uuidv4(),
            memberId,
            startDate: parseRegistrationDate(row.registrationDate) || new Date().toISOString().split('T')[0],
            endDate: null,
            membershipTypeId: membershipTypeResult.id,
            voiceGroupId: voiceGroupResult.id,
            voiceTypeId,
            endReason: null
          })

          results.imported++
        } else {
          // Update existing member if needed
          results.updated++
        }
      } catch (error) {
        console.error('Error importing member:', row, error)
        results.errors.push({
          row: `${row.firstName} ${row.lastName}`,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    console.error('Import error:', error)
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
    const day = parts[0].padStart(2, '0')
    const month = months[parts[1].toLowerCase()] || '01'
    const year = parts[2]
    return `${year}-${month}-${day}`
  }
  
  return dateStr
}

function parseRegistrationDate(dateStr: string): string | null {
  if (!dateStr) return null
  return parseBirthDate(dateStr)
}