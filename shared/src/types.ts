export interface UserProfile {
  id: string
  email: string
  name: string
  birthDate: Date
  phone?: string
  avatarUrl?: string
  emergencyContact?: string
  emergencyPhone?: string
  isActive: boolean
  createdAt: Date
  lastLogin?: Date
}

export interface Choir {
  id: string
  name: string
  description?: string
  organizationType: 'opera' | 'symphony' | 'independent'
  foundedYear?: number
  website?: string
  logoUrl?: string
  settings: ChoirSettings
  createdAt: Date
}

export interface ChoirSettings {
  allowMemberMessaging: boolean
  requireAttendanceTracking: boolean
  autoArchiveEventsAfterDays: number
  notificationPreferences: NotificationSettings
  calendarPublicUrl?: string
  defaultEventDurationMinutes: number
  holidayCalendarRegion: string
}

export interface NotificationSettings {
  emailEnabled: boolean
  pushEnabled: boolean
  smsEnabled: boolean
  eventReminders: boolean
  attendanceDeadlines: boolean
  infoFeedUpdates: boolean
  chatMessages: boolean
}

export interface MembershipType {
  id: string
  choirId: string
  name: string
  displayName: string
  isActiveMembership: boolean
  canAccessSystem: boolean
  canVote: boolean
  sortOrder: number
  description?: string
  createdAt: Date
}

export interface ListOfValues {
  id: string
  choirId?: string
  category: 'user_role' | 'voice_type' | 'voice_group' | 'event_type' | 'event_status'
  value: string
  displayName: string
  description?: string
  isActive: boolean
  sortOrder: number
  parentId?: string
  metadata?: Record<string, any>
  createdAt: Date
}

export interface Member {
  id: string
  userProfileId: string
  choirId: string
  membershipTypeId: string
  voiceGroupId: string
  voiceTypeId?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface MembershipPeriod {
  id: string
  memberId: string
  startDate: Date
  endDate?: Date
  membershipTypeId: string
  voiceGroupId: string
  voiceTypeId?: string
  endReason?: string
  notes?: string
  createdAt: Date
}

export interface MembershipLeave {
  id: string
  memberId: string
  leaveType: 'maternity' | 'work_travel' | 'illness' | 'personal' | 'other'
  startDate: Date
  expectedReturnDate?: Date
  actualReturnDate?: Date
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed'
  requestedAt: Date
  approvedBy?: string
  approvedAt?: Date
  notes?: string
}

export interface Event {
  id: string
  choirId?: string
  title: string
  description?: string
  typeId?: string
  statusId?: string
  startTime: Date
  endTime: Date
  location: string
  setlistId?: string
  attendanceMode: 'opt_in' | 'opt_out'
  targetMembershipTypes: string[]
  targetVoiceGroups: string[]
  targetVoiceTypes: string[]
  includeAllActive: boolean
  notes?: string
  createdBy?: string
  isRecurring: boolean
  recurrenceRule?: RecurrenceRule
  parentEventId?: string
  excludeHolidays: boolean
  calendarSyncEnabled: boolean
  createdAt: Date
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  daysOfWeek?: number[]
  endDate?: Date
  occurrences?: number
}

export interface EventAttendance {
  id: string
  eventId?: string
  memberId?: string
  intendedStatus: 'attending' | 'not_attending' | 'tentative' | 'not_responded'
  intendedReason?: string
  actualStatus?: 'present' | 'absent' | 'late'
  markedBy?: string
  markedAt?: Date
  memberResponseAt?: Date
  notes?: string
}

export interface AttendanceExpectation {
  id: string
  eventId?: string
  expectedTotal: number
  onLeaveCount: number
  voiceGroupBreakdown: Record<string, {
    expected: number
    onLeave: number
  }>
  calculatedAt: Date
}

export interface Holiday {
  id: string
  name: string
  date: Date
  region: string
  isActive: boolean
  createdAt: Date
}

export interface SheetMusic {
  id: string
  title: string
  composer: string
  arranger?: string
  keySignature?: string
  timeSignature?: string
  durationMinutes?: number
  difficultyLevel?: 1 | 2 | 3 | 4 | 5
  language: string
  genre?: string
  fileUrl: string
  fileType: 'pdf' | 'musicxml' | 'other'
  fileSizeBytes: number
  uploadedBy: string
  uploadedAt: Date
  isPublic: boolean
}

export interface AudioFile {
  id: string
  sheetMusicId: string
  title: string
  voiceTypeId?: string
  voiceGroupId?: string
  fileUrl: string
  durationSeconds: number
  fileSizeBytes: number
  uploadedBy: string
  uploadedAt: Date
}

export interface Setlist {
  id: string
  title: string
  description?: string
  createdBy: string
  createdAt: Date
  isActive: boolean
}

export interface SetlistItem {
  id: string
  setlistId: string
  sheetMusicId: string
  orderIndex: number
  notes?: string
}

export interface InfoFeed {
  id: string
  title: string
  content: string
  authorId: string
  publishedAt: Date
  isPinned: boolean
  targetMembershipTypes: string[]
  targetVoiceGroups: string[]
  targetVoiceTypes: string[]
  includeAllActive: boolean
  allowsComments: boolean
}

export interface Chat {
  id: string
  name?: string
  type: 'direct' | 'group' | 'voice_section'
  voiceTypeId?: string
  voiceGroupId?: string
  membershipTypeIds?: string[]
  createdBy: string
  createdAt: Date
  isActive: boolean
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  content: string
  sentAt: Date
}

export type AttendanceStatus = 'attending' | 'not_attending' | 'tentative' | 'not_responded'
export type ActualAttendanceStatus = 'present' | 'absent' | 'late'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'completed'
export type LeaveType = 'maternity' | 'work_travel' | 'illness' | 'personal' | 'other'
export type OrganizationType = 'opera' | 'symphony' | 'independent'
export type VoiceConfiguration = 'SATB' | 'SSAATTBB' | 'SMATBB'
export type EventType = 'rehearsal' | 'concert' | 'recording' | 'workshop' | 'meeting' | 'social'
export type EventStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'postponed'
export type ChatType = 'direct' | 'group' | 'voice_section'
export type AttendanceMode = 'opt_in' | 'opt_out'
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'