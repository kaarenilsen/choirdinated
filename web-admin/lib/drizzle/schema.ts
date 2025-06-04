import { pgTable, uuid, text, boolean, timestamp, integer, jsonb, bigint, date } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  birthDate: date('birth_date').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  emergencyContact: text('emergency_contact'),
  emergencyPhone: text('emergency_phone'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login')
})

export const choirs = pgTable('choirs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  organizationType: text('organization_type').notNull(),
  foundedYear: integer('founded_year'),
  website: text('website'),
  logoUrl: text('logo_url'),
  settings: jsonb('settings').default('{}'),
  createdAt: timestamp('created_at').defaultNow()
})

export const membershipTypes = pgTable('membership_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  choirId: uuid('choir_id').references(() => choirs.id).notNull(),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  isActiveMembership: boolean('is_active_membership').default(true),
  canAccessSystem: boolean('can_access_system').default(true),
  canVote: boolean('can_vote').default(true),
  sortOrder: integer('sort_order').default(0),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow()
})

export const listOfValues: any = pgTable('list_of_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  choirId: uuid('choir_id').references(() => choirs.id),
  category: text('category').notNull(),
  value: text('value').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  parentId: uuid('parent_id').references((): any => listOfValues.id),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow()
})

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userProfileId: uuid('user_profile_id').references(() => userProfiles.id).notNull(),
  choirId: uuid('choir_id').references(() => choirs.id).notNull(),
  membershipTypeId: uuid('membership_type_id').references(() => membershipTypes.id).notNull(),
  voiceGroupId: uuid('voice_group_id').references(() => listOfValues.id).notNull(),
  voiceTypeId: uuid('voice_type_id').references(() => listOfValues.id),
  notes: text('notes'),
  additionalData: jsonb('additional_data').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const membershipPeriods = pgTable('membership_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  membershipTypeId: uuid('membership_type_id').references(() => membershipTypes.id).notNull(),
  voiceGroupId: uuid('voice_group_id').references(() => listOfValues.id).notNull(),
  voiceTypeId: uuid('voice_type_id').references(() => listOfValues.id),
  endReason: text('end_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
})

export const membershipLeaves = pgTable('membership_leaves', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  leaveType: text('leave_type').notNull(),
  startDate: date('start_date').notNull(),
  expectedReturnDate: date('expected_return_date'),
  actualReturnDate: date('actual_return_date'),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('pending'),
  requestedAt: timestamp('requested_at').defaultNow(),
  approvedBy: uuid('approved_by').references(() => userProfiles.id),
  approvedAt: timestamp('approved_at'),
  notes: text('notes')
})

export const events: any = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  choirId: uuid('choir_id').references(() => choirs.id),
  title: text('title').notNull(),
  description: text('description'),
  typeId: uuid('type_id').references(() => listOfValues.id),
  statusId: uuid('status_id').references(() => listOfValues.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  location: text('location').notNull(),
  setlistId: uuid('setlist_id').references(() => setlists.id),
  attendanceMode: text('attendance_mode').notNull().default('opt_out'),
  targetMembershipTypes: jsonb('target_membership_types').default('[]'),
  targetVoiceGroups: jsonb('target_voice_groups').default('[]'),
  targetVoiceTypes: jsonb('target_voice_types').default('[]'),
  includeAllActive: boolean('include_all_active').default(true),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => userProfiles.id),
  isRecurring: boolean('is_recurring').default(false),
  recurrenceRule: jsonb('recurrence_rule'),
  parentEventId: uuid('parent_event_id').references((): any => events.id),
  excludeHolidays: boolean('exclude_holidays').default(true),
  calendarSyncEnabled: boolean('calendar_sync_enabled').default(true),
  createdAt: timestamp('created_at').defaultNow()
})

export const eventAttendance = pgTable('event_attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id),
  memberId: uuid('member_id').references(() => members.id),
  intendedStatus: text('intended_status').notNull().default('not_responded'),
  intendedReason: text('intended_reason'),
  actualStatus: text('actual_status'),
  markedBy: uuid('marked_by').references(() => userProfiles.id),
  markedAt: timestamp('marked_at'),
  memberResponseAt: timestamp('member_response_at'),
  notes: text('notes')
})

export const attendanceExpectations = pgTable('attendance_expectations', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id),
  expectedTotal: integer('expected_total').notNull(),
  onLeaveCount: integer('on_leave_count').notNull(),
  voiceGroupBreakdown: jsonb('voice_group_breakdown').notNull(),
  calculatedAt: timestamp('calculated_at').defaultNow()
})

export const holidays = pgTable('holidays', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  date: date('date').notNull(),
  region: text('region').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
})

export const sheetMusic = pgTable('sheet_music', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  composer: text('composer').notNull(),
  arranger: text('arranger'),
  keySignature: text('key_signature'),
  timeSignature: text('time_signature'),
  durationMinutes: integer('duration_minutes'),
  difficultyLevel: integer('difficulty_level'),
  language: text('language').notNull(),
  genre: text('genre'),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
  uploadedBy: uuid('uploaded_by').references(() => userProfiles.id).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  isPublic: boolean('is_public').default(false)
})

export const audioFiles = pgTable('audio_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  sheetMusicId: uuid('sheet_music_id').references(() => sheetMusic.id).notNull(),
  title: text('title').notNull(),
  voiceTypeId: uuid('voice_type_id').references(() => listOfValues.id),
  voiceGroupId: uuid('voice_group_id').references(() => listOfValues.id),
  fileUrl: text('file_url').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
  uploadedBy: uuid('uploaded_by').references(() => userProfiles.id).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow()
})

export const setlists = pgTable('setlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  createdBy: uuid('created_by').references(() => userProfiles.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  isActive: boolean('is_active').default(true)
})

export const setlistItems = pgTable('setlist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  setlistId: uuid('setlist_id').references(() => setlists.id).notNull(),
  sheetMusicId: uuid('sheet_music_id').references(() => sheetMusic.id).notNull(),
  orderIndex: integer('order_index').notNull(),
  notes: text('notes')
})

export const infoFeed = pgTable('info_feed', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id').references(() => userProfiles.id).notNull(),
  publishedAt: timestamp('published_at').defaultNow(),
  isPinned: boolean('is_pinned').default(false),
  targetMembershipTypes: jsonb('target_membership_types').default('[]'),
  targetVoiceGroups: jsonb('target_voice_groups').default('[]'),
  targetVoiceTypes: jsonb('target_voice_types').default('[]'),
  includeAllActive: boolean('include_all_active').default(true),
  allowsComments: boolean('allows_comments').default(true)
})

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  type: text('type').notNull(),
  voiceTypeId: uuid('voice_type_id').references(() => listOfValues.id),
  voiceGroupId: uuid('voice_group_id').references(() => listOfValues.id),
  membershipTypeIds: jsonb('membership_type_ids').default('[]'),
  createdBy: uuid('created_by').references(() => userProfiles.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  isActive: boolean('is_active').default(true)
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').references(() => chats.id).notNull(),
  senderId: uuid('sender_id').references(() => userProfiles.id).notNull(),
  content: text('content').notNull(),
  sentAt: timestamp('sent_at').defaultNow()
})

// Relations
export const membersRelations = relations(members, ({ one, many }) => ({
  userProfile: one(userProfiles, {
    fields: [members.userProfileId],
    references: [userProfiles.id]
  }),
  choir: one(choirs, {
    fields: [members.choirId],
    references: [choirs.id]
  }),
  membershipType: one(membershipTypes, {
    fields: [members.membershipTypeId],
    references: [membershipTypes.id]
  }),
  voiceGroup: one(listOfValues, {
    fields: [members.voiceGroupId],
    references: [listOfValues.id],
    relationName: 'member_voice_group'
  }),
  voiceType: one(listOfValues, {
    fields: [members.voiceTypeId],
    references: [listOfValues.id],
    relationName: 'member_voice_type'
  }),
  membershipPeriods: many(membershipPeriods),
  membershipLeaves: many(membershipLeaves),
  eventAttendance: many(eventAttendance)
}))

export const membershipPeriodsRelations = relations(membershipPeriods, ({ one }) => ({
  member: one(members, {
    fields: [membershipPeriods.memberId],
    references: [members.id]
  }),
  membershipType: one(membershipTypes, {
    fields: [membershipPeriods.membershipTypeId],
    references: [membershipTypes.id]
  }),
  voiceGroup: one(listOfValues, {
    fields: [membershipPeriods.voiceGroupId],
    references: [listOfValues.id],
    relationName: 'period_voice_group'
  }),
  voiceType: one(listOfValues, {
    fields: [membershipPeriods.voiceTypeId],
    references: [listOfValues.id],
    relationName: 'period_voice_type'
  })
}))

export const membershipLeavesRelations = relations(membershipLeaves, ({ one }) => ({
  member: one(members, {
    fields: [membershipLeaves.memberId],
    references: [members.id]
  }),
  approver: one(userProfiles, {
    fields: [membershipLeaves.approvedBy],
    references: [userProfiles.id]
  })
}))

export const eventAttendanceRelations = relations(eventAttendance, ({ one }) => ({
  event: one(events, {
    fields: [eventAttendance.eventId],
    references: [events.id]
  }),
  member: one(members, {
    fields: [eventAttendance.memberId],
    references: [members.id]
  }),
  markedByUser: one(userProfiles, {
    fields: [eventAttendance.markedBy],
    references: [userProfiles.id]
  })
}))

export const eventsRelations = relations(events, ({ one, many }) => ({
  choir: one(choirs, {
    fields: [events.choirId],
    references: [choirs.id]
  }),
  eventType: one(listOfValues, {
    fields: [events.typeId],
    references: [listOfValues.id],
    relationName: 'event_type'
  }),
  eventStatus: one(listOfValues, {
    fields: [events.statusId],
    references: [listOfValues.id],
    relationName: 'event_status'
  }),
  setlist: one(setlists, {
    fields: [events.setlistId],
    references: [setlists.id]
  }),
  createdByUser: one(userProfiles, {
    fields: [events.createdBy],
    references: [userProfiles.id]
  }),
  parentEvent: one(events, {
    fields: [events.parentEventId],
    references: [events.id],
    relationName: 'parent_event'
  }),
  childEvents: many(events, {
    relationName: 'parent_event'
  }),
  attendance: many(eventAttendance),
  attendanceExpectations: many(attendanceExpectations)
}))

export const sheetMusicRelations = relations(sheetMusic, ({ one, many }) => ({
  uploadedByUser: one(userProfiles, {
    fields: [sheetMusic.uploadedBy],
    references: [userProfiles.id]
  }),
  audioFiles: many(audioFiles),
  setlistItems: many(setlistItems)
}))

export const audioFilesRelations = relations(audioFiles, ({ one }) => ({
  sheetMusic: one(sheetMusic, {
    fields: [audioFiles.sheetMusicId],
    references: [sheetMusic.id]
  }),
  voiceType: one(listOfValues, {
    fields: [audioFiles.voiceTypeId],
    references: [listOfValues.id],
    relationName: 'audio_voice_type'
  }),
  voiceGroup: one(listOfValues, {
    fields: [audioFiles.voiceGroupId],
    references: [listOfValues.id],
    relationName: 'audio_voice_group'
  }),
  uploadedByUser: one(userProfiles, {
    fields: [audioFiles.uploadedBy],
    references: [userProfiles.id]
  })
}))

export const setlistsRelations = relations(setlists, ({ one, many }) => ({
  createdByUser: one(userProfiles, {
    fields: [setlists.createdBy],
    references: [userProfiles.id]
  }),
  items: many(setlistItems),
  events: many(events)
}))

export const setlistItemsRelations = relations(setlistItems, ({ one }) => ({
  setlist: one(setlists, {
    fields: [setlistItems.setlistId],
    references: [setlists.id]
  }),
  sheetMusic: one(sheetMusic, {
    fields: [setlistItems.sheetMusicId],
    references: [sheetMusic.id]
  })
}))

export const listOfValuesRelations = relations(listOfValues, ({ one, many }) => ({
  choir: one(choirs, {
    fields: [listOfValues.choirId],
    references: [choirs.id]
  }),
  parent: one(listOfValues, {
    fields: [listOfValues.parentId],
    references: [listOfValues.id],
    relationName: 'parent_lov'
  }),
  children: many(listOfValues, {
    relationName: 'parent_lov'
  })
}))

export const choirsRelations = relations(choirs, ({ many }) => ({
  members: many(members),
  membershipTypes: many(membershipTypes),
  listOfValues: many(listOfValues),
  events: many(events)
}))

export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  members: many(members),
  createdEvents: many(events),
  uploadedSheetMusic: many(sheetMusic),
  uploadedAudioFiles: many(audioFiles),
  createdSetlists: many(setlists),
  infoFeedPosts: many(infoFeed),
  createdChats: many(chats),
  sentMessages: many(messages),
  approvedLeaves: many(membershipLeaves)
}))

export const membershipTypesRelations = relations(membershipTypes, ({ one, many }) => ({
  choir: one(choirs, {
    fields: [membershipTypes.choirId],
    references: [choirs.id]
  }),
  members: many(members),
  membershipPeriods: many(membershipPeriods)
}))

export const infoFeedRelations = relations(infoFeed, ({ one }) => ({
  author: one(userProfiles, {
    fields: [infoFeed.authorId],
    references: [userProfiles.id]
  })
}))

export const chatsRelations = relations(chats, ({ one, many }) => ({
  voiceType: one(listOfValues, {
    fields: [chats.voiceTypeId],
    references: [listOfValues.id],
    relationName: 'chat_voice_type'
  }),
  voiceGroup: one(listOfValues, {
    fields: [chats.voiceGroupId],
    references: [listOfValues.id],
    relationName: 'chat_voice_group'
  }),
  createdByUser: one(userProfiles, {
    fields: [chats.createdBy],
    references: [userProfiles.id]
  }),
  messages: many(messages)
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id]
  }),
  sender: one(userProfiles, {
    fields: [messages.senderId],
    references: [userProfiles.id]
  })
}))

export const attendanceExpectationsRelations = relations(attendanceExpectations, ({ one }) => ({
  event: one(events, {
    fields: [attendanceExpectations.eventId],
    references: [events.id]
  })
}))