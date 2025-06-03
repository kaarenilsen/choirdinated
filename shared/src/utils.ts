import { format, addDays, addWeeks, addMonths, addYears, isBefore, isAfter } from 'date-fns'
import { nb } from 'date-fns/locale'
import type { RecurrenceRule, Holiday, VoiceConfiguration } from './types'

export const formatDate = (date: Date, pattern: string = 'dd.MM.yyyy'): string => {
  return format(date, pattern, { locale: nb })
}

export const formatDateTime = (date: Date): string => {
  return format(date, 'dd.MM.yyyy HH:mm', { locale: nb })
}

export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm', { locale: nb })
}

export const getNextRecurrence = (currentDate: Date, rule: RecurrenceRule): Date => {
  const nextDate = new Date(currentDate)
  
  switch (rule.frequency) {
    case 'daily':
      return addDays(nextDate, rule.interval)
    
    case 'weekly':
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const currentDay = nextDate.getDay()
        const validDays = rule.daysOfWeek.sort((a, b) => a - b)
        
        let nextDay = validDays.find(day => day > currentDay)
        if (!nextDay) {
          nextDay = validDays[0]
          nextDate.setDate(nextDate.getDate() + (7 - currentDay + nextDay))
        } else {
          nextDate.setDate(nextDate.getDate() + (nextDay - currentDay))
        }
        
        return nextDate
      } else {
        return addWeeks(nextDate, rule.interval)
      }
    
    case 'monthly':
      return addMonths(nextDate, rule.interval)
    
    case 'yearly':
      return addYears(nextDate, rule.interval)
    
    default:
      throw new Error(`Unsupported recurrence frequency: ${rule.frequency}`)
  }
}

export const isHoliday = (date: Date, holidays: Holiday[]): boolean => {
  const dateString = date.toDateString()
  return holidays.some(holiday => 
    holiday.isActive && new Date(holiday.date).toDateString() === dateString
  )
}

export const generateRecurringEvents = (
  baseEvent: {
    startTime: Date
    endTime: Date
    title: string
    location: string
  },
  rule: RecurrenceRule,
  holidays: Holiday[] = []
): Array<{ startTime: Date; endTime: Date; title: string; location: string }> => {
  const events = []
  let currentDate = new Date(baseEvent.startTime)
  const duration = baseEvent.endTime.getTime() - baseEvent.startTime.getTime()
  
  let count = 0
  const maxOccurrences = rule.occurrences || 100
  
  while (count < maxOccurrences) {
    if (rule.endDate && isAfter(currentDate, rule.endDate)) {
      break
    }
    
    if (!isHoliday(currentDate, holidays)) {
      const eventEndTime = new Date(currentDate.getTime() + duration)
      
      events.push({
        startTime: new Date(currentDate),
        endTime: eventEndTime,
        title: baseEvent.title,
        location: baseEvent.location
      })
      
      count++
    }
    
    currentDate = getNextRecurrence(currentDate, rule)
  }
  
  return events
}

export const generateICalFeed = (events: Array<{
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location: string
  status?: string
}>): string => {
  const now = new Date()
  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Choirdinated//Choirdinated Calendar//NO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Choirdinated - Kor Kalender',
    'X-WR-TIMEZONE:Europe/Oslo',
    'X-WR-CALDESC:Kalender for korøvelser og konserter'
  ]

  events.forEach(event => {
    const startDate = formatICalDate(event.startTime)
    const endDate = formatICalDate(event.endTime)
    const uid = `${event.id}@choros.app`
    const dtstamp = formatICalDate(now)

    ical.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${escapeICalText(event.title)}`,
      `DESCRIPTION:${escapeICalText(event.description || '')}`,
      `LOCATION:${escapeICalText(event.location)}`,
      `STATUS:${event.status?.toUpperCase() || 'CONFIRMED'}`,
      'END:VEVENT'
    )
  })

  ical.push('END:VCALENDAR')
  return ical.join('\r\n')
}

const formatICalDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

const escapeICalText = (text: string): string => {
  return text.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n')
}

export const getEasterDate = (year: number, offset: number = 0): Date => {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  const easterDate = new Date(year, month - 1, day)
  easterDate.setDate(easterDate.getDate() + offset)
  return easterDate
}

export const generateNorwegianHolidays = (year: number = new Date().getFullYear()): Holiday[] => {
  return [
    { id: '', name: 'Nyttårsdag', date: new Date(year, 0, 1), region: 'NO', isActive: true, createdAt: new Date() },
    { id: '', name: 'Skjærtorsdag', date: getEasterDate(year, -3), region: 'NO', isActive: true, createdAt: new Date() },
    { id: '', name: 'Langfredag', date: getEasterDate(year, -2), region: 'NO', isActive: true, createdAt: new Date() },
    { id: '', name: 'Første påskedag', date: getEasterDate(year, 0), region: 'NO', isActive: true, createdAt: new Date() },
    { id: '', name: 'Andre påskedag', date: getEasterDate(year, 1), region: 'NO', isActive: true, createdAt: new Date() },
    { id: '', name: 'Arbeidernes dag', date: new Date(year, 4, 1), region: 'NO', isActive: true, createdAt: new Date() },
    { id: '', name: 'Grunnlovsdag', date: new Date(year, 4, 17), region: 'NO', isActive: true, createdAt: new Date() },
    { id: '', name: 'Kristi himmelfartsdag', date: getEasterDate(year, 39), region: 'NO', isActive: true, createdAt: new Date() },
    { id: '', name: 'Første pinsedag', date: getEasterDate(year, 49), region: 'NO', isActive: true, createdAt: new Date() },
    { id: '', name: 'Andre pinsedag', date: getEasterDate(year, 50), region: 'NO', isActive: true, createdAt: new Date() },
    { id: '', name: 'Julaften', date: new Date(year, 11, 24), region: 'NO', isActive: true, createdAt: new Date() },
    { id: '', name: 'Første juledag', date: new Date(year, 11, 25), region: 'NO', isActive: true, createdAt: new Date() },
    { id: '', name: 'Andre juledag', date: new Date(year, 11, 26), region: 'NO', isActive: true, createdAt: new Date() },
    { id: '', name: 'Nyttårsaften', date: new Date(year, 11, 31), region: 'NO', isActive: true, createdAt: new Date() }
  ]
}

export const getDefaultVoiceConfiguration = (configurationType: VoiceConfiguration) => {
  const voiceTypes = []
  
  switch (configurationType) {
    case 'SATB':
      voiceTypes.push(
        { category: 'voice_type', value: 'soprano', displayName: 'Sopran', sortOrder: 1 },
        { category: 'voice_type', value: 'alto', displayName: 'Alt', sortOrder: 2 },
        { category: 'voice_type', value: 'tenor', displayName: 'Tenor', sortOrder: 3 },
        { category: 'voice_type', value: 'bass', displayName: 'Bass', sortOrder: 4 }
      )
      break

    case 'SSAATTBB':
      const voiceGroups = [
        { category: 'voice_group', value: 'soprano', displayName: 'Sopran', sortOrder: 1 },
        { category: 'voice_group', value: 'alto', displayName: 'Alt', sortOrder: 2 },
        { category: 'voice_group', value: 'tenor', displayName: 'Tenor', sortOrder: 3 },
        { category: 'voice_group', value: 'bass', displayName: 'Bass', sortOrder: 4 }
      ]
      
      voiceTypes.push(...voiceGroups)
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
      voiceTypes.push(
        { category: 'voice_type', value: 'soprano', displayName: 'Sopran', sortOrder: 1 },
        { category: 'voice_type', value: 'mezzo', displayName: 'Mezzosopran', sortOrder: 2 },
        { category: 'voice_type', value: 'alto', displayName: 'Alt', sortOrder: 3 },
        { category: 'voice_type', value: 'tenor', displayName: 'Tenor', sortOrder: 4 },
        { category: 'voice_type', value: 'baritone', displayName: 'Baryton', sortOrder: 5 },
        { category: 'voice_type', value: 'bass', displayName: 'Bass', sortOrder: 6 }
      )
      break
  }
  
  return voiceTypes
}

export const getDefaultMembershipTypes = () => [
  { name: 'active_member', displayName: 'Aktivt medlem', isActiveMembership: true, canAccessSystem: true, canVote: true, sortOrder: 1 },
  { name: 'member_on_leave', displayName: 'Medlem i permisjon', isActiveMembership: false, canAccessSystem: true, canVote: false, sortOrder: 2 },
  { name: 'former_member', displayName: 'Tidligere medlem', isActiveMembership: false, canAccessSystem: false, canVote: false, sortOrder: 3 },
  { name: 'conductor', displayName: 'Dirigent', isActiveMembership: true, canAccessSystem: true, canVote: true, sortOrder: 4 },
  { name: 'rehearsal_aid', displayName: 'Repetitør', isActiveMembership: true, canAccessSystem: true, canVote: false, sortOrder: 5 },
  { name: 'voice_coach', displayName: 'Stemmetrener', isActiveMembership: true, canAccessSystem: true, canVote: false, sortOrder: 6 },
  { name: 'honorary_member', displayName: 'Æresmedlem', isActiveMembership: false, canAccessSystem: true, canVote: true, sortOrder: 7 }
]

export const getDefaultEventTypes = () => [
  { category: 'event_type', value: 'rehearsal', displayName: 'Øvelse', sortOrder: 1 },
  { category: 'event_type', value: 'concert', displayName: 'Konsert', sortOrder: 2 },
  { category: 'event_type', value: 'recording', displayName: 'Innspilling', sortOrder: 3 },
  { category: 'event_type', value: 'workshop', displayName: 'Workshop', sortOrder: 4 },
  { category: 'event_type', value: 'meeting', displayName: 'Møte', sortOrder: 5 },
  { category: 'event_type', value: 'social', displayName: 'Sosialt arrangement', sortOrder: 6 }
]

export const getDefaultEventStatuses = () => [
  { category: 'event_status', value: 'scheduled', displayName: 'Planlagt', sortOrder: 1 },
  { category: 'event_status', value: 'confirmed', displayName: 'Bekreftet', sortOrder: 2 },
  { category: 'event_status', value: 'cancelled', displayName: 'Avlyst', sortOrder: 3 },
  { category: 'event_status', value: 'completed', displayName: 'Gjennomført', sortOrder: 4 },
  { category: 'event_status', value: 'postponed', displayName: 'Utsatt', sortOrder: 5 }
]