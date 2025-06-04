import { db } from '../db'
import { listOfValues } from '../schema'

/**
 * Example of how to properly set up voice groups and voice types
 * for different choir configurations
 */

export async function setupSATBVoices(choirId: string) {
  // Create voice groups (SATB)
  const voiceGroups = await db
    .insert(listOfValues)
    .values([
      {
        choirId,
        category: 'voice_group',
        value: 'soprano',
        displayName: 'Sopran',
        sortOrder: 1,
        isActive: true
      },
      {
        choirId,
        category: 'voice_group',
        value: 'alto',
        displayName: 'Alt',
        sortOrder: 2,
        isActive: true
      },
      {
        choirId,
        category: 'voice_group',
        value: 'tenor',
        displayName: 'Tenor',
        sortOrder: 3,
        isActive: true
      },
      {
        choirId,
        category: 'voice_group',
        value: 'bass',
        displayName: 'Bass',
        sortOrder: 4,
        isActive: true
      }
    ])
    .returning()

  return voiceGroups
}

export async function setupSSAATTBBVoices(choirId: string) {
  // First, create the main voice groups
  const voiceGroups = await setupSATBVoices(choirId)
  
  // Find the group IDs
  const sopranoGroup = voiceGroups.find(g => g.value === 'soprano')!
  const altoGroup = voiceGroups.find(g => g.value === 'alto')!
  const tenorGroup = voiceGroups.find(g => g.value === 'tenor')!
  const bassGroup = voiceGroups.find(g => g.value === 'bass')!

  // Create voice types (subdivisions)
  const voiceTypes = await db
    .insert(listOfValues)
    .values([
      // Soprano subdivisions
      {
        choirId,
        category: 'voice_type',
        value: 'soprano1',
        displayName: '1. Sopran',
        parentId: sopranoGroup.id,
        sortOrder: 1,
        isActive: true
      },
      {
        choirId,
        category: 'voice_type',
        value: 'soprano2',
        displayName: '2. Sopran',
        parentId: sopranoGroup.id,
        sortOrder: 2,
        isActive: true
      },
      // Alto subdivisions
      {
        choirId,
        category: 'voice_type',
        value: 'alto1',
        displayName: '1. Alt',
        parentId: altoGroup.id,
        sortOrder: 1,
        isActive: true
      },
      {
        choirId,
        category: 'voice_type',
        value: 'alto2',
        displayName: '2. Alt',
        parentId: altoGroup.id,
        sortOrder: 2,
        isActive: true
      },
      // Tenor subdivisions
      {
        choirId,
        category: 'voice_type',
        value: 'tenor1',
        displayName: '1. Tenor',
        parentId: tenorGroup.id,
        sortOrder: 1,
        isActive: true
      },
      {
        choirId,
        category: 'voice_type',
        value: 'tenor2',
        displayName: '2. Tenor',
        parentId: tenorGroup.id,
        sortOrder: 2,
        isActive: true
      },
      // Bass subdivisions
      {
        choirId,
        category: 'voice_type',
        value: 'bass1',
        displayName: '1. Bass',
        parentId: bassGroup.id,
        sortOrder: 1,
        isActive: true
      },
      {
        choirId,
        category: 'voice_type',
        value: 'bass2',
        displayName: '2. Bass',
        parentId: bassGroup.id,
        sortOrder: 2,
        isActive: true
      }
    ])
    .returning()

  return { voiceGroups, voiceTypes }
}

export async function setupOperaticVoices(choirId: string) {
  // Create voice groups for operatic setup (SMATBB)
  const voiceGroups = await db
    .insert(listOfValues)
    .values([
      {
        choirId,
        category: 'voice_group',
        value: 'soprano',
        displayName: 'Sopran',
        sortOrder: 1,
        isActive: true
      },
      {
        choirId,
        category: 'voice_group',
        value: 'mezzo',
        displayName: 'Mezzosopran',
        sortOrder: 2,
        isActive: true
      },
      {
        choirId,
        category: 'voice_group',
        value: 'alto',
        displayName: 'Alt',
        sortOrder: 3,
        isActive: true
      },
      {
        choirId,
        category: 'voice_group',
        value: 'tenor',
        displayName: 'Tenor',
        sortOrder: 4,
        isActive: true
      },
      {
        choirId,
        category: 'voice_group',
        value: 'baritone',
        displayName: 'Baryton',
        sortOrder: 5,
        isActive: true
      },
      {
        choirId,
        category: 'voice_group',
        value: 'bass',
        displayName: 'Bass',
        sortOrder: 6,
        isActive: true
      }
    ])
    .returning()

  return voiceGroups
}

/**
 * Example usage:
 * 
 * When creating an event or sending a message to "Soprano":
 * - If you target the soprano voice_group, it will include ALL members who have:
 *   - voice_group_id = soprano (members without specific voice type)
 *   - voice_type_id = soprano1 or soprano2 (members with specific voice type)
 * 
 * This ensures that targeting a voice group always includes all its subdivisions.
 */