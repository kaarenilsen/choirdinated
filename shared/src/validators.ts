import { z } from 'zod'

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  birthDate: z.date(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  lastLogin: z.date().optional()
})

export const choirSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  organizationType: z.enum(['opera', 'symphony', 'independent']),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  settings: z.object({
    allowMemberMessaging: z.boolean(),
    requireAttendanceTracking: z.boolean(),
    autoArchiveEventsAfterDays: z.number().int().min(1),
    calendarPublicUrl: z.string().url().optional(),
    defaultEventDurationMinutes: z.number().int().min(15),
    holidayCalendarRegion: z.string()
  }),
  createdAt: z.date()
})

export const memberSchema = z.object({
  id: z.string().uuid(),
  userProfileId: z.string().uuid(),
  choirId: z.string().uuid(),
  membershipTypeId: z.string().uuid(),
  voiceGroupId: z.string().uuid(),
  voiceTypeId: z.string().uuid().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

const baseEventSchema = z.object({
  id: z.string().uuid(),
  choirId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  typeId: z.string().uuid().optional(),
  statusId: z.string().uuid().optional(),
  startTime: z.date(),
  endTime: z.date(),
  location: z.string().min(1),
  setlistId: z.string().uuid().optional(),
  attendanceMode: z.enum(['opt_in', 'opt_out']).default('opt_out'),
  targetMembershipTypes: z.array(z.string().uuid()).default([]),
  targetVoiceGroups: z.array(z.string().uuid()).default([]),
  targetVoiceTypes: z.array(z.string().uuid()).default([]),
  includeAllActive: z.boolean().default(true),
  notes: z.string().optional(),
  createdBy: z.string().uuid().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().int().min(1),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    endDate: z.date().optional(),
    occurrences: z.number().int().min(1).optional()
  }).optional(),
  parentEventId: z.string().uuid().optional(),
  excludeHolidays: z.boolean().default(true),
  calendarSyncEnabled: z.boolean().default(true),
  createdAt: z.date()
})

export const eventSchema = baseEventSchema.refine((data) => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime']
})

const baseMembershipLeaveSchema = z.object({
  id: z.string().uuid(),
  memberId: z.string().uuid(),
  leaveType: z.enum(['maternity', 'work_travel', 'illness', 'personal', 'other']),
  startDate: z.date(),
  expectedReturnDate: z.date().optional(),
  actualReturnDate: z.date().optional(),
  reason: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected', 'active', 'completed']).default('pending'),
  requestedAt: z.date(),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.date().optional(),
  notes: z.string().optional()
})

export const membershipLeaveSchema = baseMembershipLeaveSchema.refine((data) => {
  if (data.expectedReturnDate && data.expectedReturnDate <= data.startDate) {
    return false
  }
  if (data.actualReturnDate && data.actualReturnDate < data.startDate) {
    return false
  }
  return true
}, {
  message: 'Return dates must be after start date'
})

export const sheetMusicSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  composer: z.string().min(1),
  arranger: z.string().optional(),
  keySignature: z.string().optional(),
  timeSignature: z.string().optional(),
  durationMinutes: z.number().int().min(1).optional(),
  difficultyLevel: z.number().int().min(1).max(5).optional(),
  language: z.string().min(1),
  genre: z.string().optional(),
  fileUrl: z.string().url(),
  fileType: z.enum(['pdf', 'musicxml', 'other']),
  fileSizeBytes: z.number().int().min(1),
  uploadedBy: z.string().uuid(),
  uploadedAt: z.date(),
  isPublic: z.boolean().default(false)
})

export const attendanceSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid().optional(),
  memberId: z.string().uuid().optional(),
  intendedStatus: z.enum(['attending', 'not_attending', 'tentative', 'not_responded']).default('not_responded'),
  intendedReason: z.string().optional(),
  actualStatus: z.enum(['present', 'absent', 'late']).optional(),
  markedBy: z.string().uuid().optional(),
  markedAt: z.date().optional(),
  memberResponseAt: z.date().optional(),
  notes: z.string().optional()
})

// Form schemas for API requests
export const createMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  birthDate: z.date(),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  membershipTypeId: z.string().uuid(),
  voiceGroupId: z.string().uuid(),
  voiceTypeId: z.string().uuid().optional(),
  startDate: z.date(),
  notes: z.string().optional()
})

export const createEventSchema = baseEventSchema.omit({ id: true, createdAt: true }).refine((data) => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime']
})

export const updateEventSchema = baseEventSchema.omit({ id: true, createdAt: true }).partial()

export const attendanceResponseSchema = z.object({
  intendedStatus: z.enum(['attending', 'not_attending', 'tentative']),
  intendedReason: z.string().optional()
})

export const markAttendanceSchema = z.object({
  actualStatus: z.enum(['present', 'absent', 'late']),
  notes: z.string().optional()
})

export const createLeaveRequestSchema = baseMembershipLeaveSchema.omit({ 
  id: true, 
  requestedAt: true, 
  approvedBy: true, 
  approvedAt: true, 
  status: true 
}).refine((data) => {
  if (data.expectedReturnDate && data.expectedReturnDate <= data.startDate) {
    return false
  }
  if (data.actualReturnDate && data.actualReturnDate < data.startDate) {
    return false
  }
  return true
}, {
  message: 'Return dates must be after start date'
})

export const approveLeaveSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional()
})