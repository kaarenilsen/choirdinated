'use client'

import React, { useState } from 'react'
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns'
import { nb } from 'date-fns/locale'
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface EventData {
  id: string
  title: string
  date: Date
  startTime: string
  endTime: string
  attendingCount: number
  notAttendingCount: number
  totalExpected: number
  location?: string
  type?: string
}

interface WeekData {
  weekNumber: number
  events: EventData[]
}

interface SplitViewTimelineProps {
  weeks: WeekData[]
  className?: string
}

export function SplitViewTimeline({ weeks, className }: SplitViewTimelineProps) {
  const allEvents = weeks.flatMap(week => week.events)
  const [selectedDate, setSelectedDate] = useState<Date>(allEvents[0]?.date || new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate)

  const getAttendancePercentage = (event: EventData) => {
    if (event.totalExpected === 0) return 0
    return Math.round((event.attendingCount / event.totalExpected) * 100)
  }

  const getAttendanceIcon = (percentage: number) => {
    if (percentage >= 80) return { icon: TrendingUp, color: 'text-green-600' }
    if (percentage >= 60) return { icon: AlertCircle, color: 'text-yellow-600' }
    return { icon: TrendingDown, color: 'text-red-600' }
  }

  const getEventsForDate = (date: Date) => {
    return allEvents.filter(event => isSameDay(event.date, date))
  }

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }

  const getEventTypeStyle = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'konsert':
        return 'bg-purple-500'
      case 'korprøve':
        return 'bg-blue-500'
      case 'generalprøve':
        return 'bg-orange-500'
      case 'sosialt':
        return 'bg-pink-500'
      case 'møte':
        return 'bg-gray-500'
      default:
        return 'bg-gray-400'
    }
  }

  const selectedEvents = getEventsForDate(selectedDate)

  return (
    <div className={cn('flex gap-6 max-w-7xl mx-auto', className)}>
      {/* Left: Calendar */}
      <div className="w-96 flex-shrink-0">
        <Card className="p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy', { locale: nb })}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for alignment */}
            {Array.from({ length: (getDay(startOfMonth(currentMonth)) + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12" />
            ))}
            
            {/* Days */}
            {getDaysInMonth().map(day => {
              const dayEvents = getEventsForDate(day)
              const isSelected = isSameDay(day, selectedDate)
              const hasEvents = dayEvents.length > 0
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'h-12 flex flex-col items-center justify-center rounded-lg text-sm transition-all relative',
                    isSelected ? 'bg-blue-500 text-white font-semibold' : 
                    hasEvents ? 'bg-gray-100 hover:bg-gray-200 font-medium' : 
                    'hover:bg-gray-50',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  )}
                >
                  <span>{format(day, 'd')}</span>
                  {hasEvents && !isSelected && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div 
                          key={i} 
                          className={cn('w-1 h-1 rounded-full', getEventTypeStyle(event.type))}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Arrangementtyper</h3>
            {['Konsert', 'Korprøve', 'Generalprøve', 'Sosialt', 'Møte'].map(type => (
              <div key={type} className="flex items-center gap-2 text-xs">
                <div className={cn('w-3 h-3 rounded-full', getEventTypeStyle(type))} />
                <span className="text-gray-600">{type}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Right: Event details */}
      <div className="flex-1">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">
            {format(selectedDate, 'EEEE d. MMMM yyyy', { locale: nb })}
          </h2>
          <p className="text-gray-600">
            {selectedEvents.length === 0 ? 'Ingen arrangementer' : 
             `${selectedEvents.length} ${selectedEvents.length === 1 ? 'arrangement' : 'arrangementer'}`}
          </p>
        </div>

        {selectedEvents.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Ingen arrangementer planlagt denne dagen</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {selectedEvents.map((event) => {
              const attendancePercentage = getAttendancePercentage(event)
              const { icon: AttendanceIcon, color } = getAttendanceIcon(attendancePercentage)
              
              return (
                <Card key={event.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Event header */}
                      <div className="flex items-start gap-4">
                        <div className={cn('p-2 rounded-lg', getEventTypeStyle(event.type), 'bg-opacity-20')}>
                          <div className={cn('w-2 h-2 rounded-full', getEventTypeStyle(event.type))} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {event.startTime} - {event.endTime}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.location}
                              </div>
                            )}
                            {event.type && (
                              <Badge variant="secondary">
                                {event.type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Attendance visualization */}
                      <div className="mt-4 bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium">Oppmøtestatistikk</span>
                          <div className="flex items-center gap-2">
                            <AttendanceIcon className={cn('h-5 w-5', color)} />
                            <span className={cn('text-2xl font-bold', color)}>
                              {attendancePercentage}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Detailed breakdown */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-2xl font-bold text-green-600">{event.attendingCount}</div>
                            <div className="text-xs text-gray-600">Kommer</div>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-2xl font-bold text-red-600">{event.notAttendingCount}</div>
                            <div className="text-xs text-gray-600">Kommer ikke</div>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-2xl font-bold text-gray-600">
                              {event.totalExpected - event.attendingCount - event.notAttendingCount}
                            </div>
                            <div className="text-xs text-gray-600">Ikke svart</div>
                          </div>
                        </div>

                        {/* Visual bar */}
                        <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-green-500 transition-all duration-500"
                            style={{ width: `${(event.attendingCount / event.totalExpected) * 100}%` }}
                          />
                          <div 
                            className="bg-red-500 transition-all duration-500"
                            style={{ width: `${(event.notAttendingCount / event.totalExpected) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}