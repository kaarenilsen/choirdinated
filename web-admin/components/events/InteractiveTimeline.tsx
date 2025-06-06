'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { CalendarIcon, CheckCircle2, XCircle, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

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

interface InteractiveTimelineProps {
  weeks: WeekData[]
  className?: string
}

export function InteractiveTimeline({ weeks, className }: InteractiveTimelineProps) {
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)

  const getAttendancePercentage = (event: EventData) => {
    if (event.totalExpected === 0) return 0
    return Math.round((event.attendingCount / event.totalExpected) * 100)
  }

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Flatten all events with their index for alternating
  let globalEventIndex = 0
  const allEvents = weeks.flatMap(week => 
    week.events.map(event => ({
      ...event,
      weekNumber: week.weekNumber,
      globalIndex: globalEventIndex++
    }))
  )

  return (
    <div className={cn('relative max-w-6xl mx-auto', className)}>
      {/* Vertical line in the middle */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2" />
      
      {weeks.map((week, weekIndex) => {
        const weekEvents = allEvents.filter(e => e.weekNumber === week.weekNumber)
        
        return (
          <div key={week.weekNumber} className="relative">
            {/* Week marker */}
            <div className="relative flex justify-center items-center mb-8">
              <div className="absolute left-1/2 w-4 h-4 bg-white border-4 border-blue-200 rounded-full -translate-x-1/2 z-10" />
              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium z-10">
                Uke {week.weekNumber}
              </div>
            </div>

            {/* Events */}
            {weekEvents.map((event, eventIndex) => {
              const isHovered = hoveredEvent === event.id
              const attendancePercentage = getAttendancePercentage(event)
              const isLeft = event.globalIndex % 2 === 0
              const isLastEventInWeek = eventIndex === weekEvents.length - 1
              const isLastWeek = weekIndex === weeks.length - 1

              return (
                <div
                  key={event.id}
                  className={cn(
                    'relative grid grid-cols-2 gap-8 mb-8',
                    !(isLastEventInWeek && isLastWeek) ? 'pb-8' : ''
                  )}
                >
                  {/* Left side */}
                  <div className={cn(
                    'relative',
                    !isLeft && 'opacity-0 pointer-events-none'
                  )}>
                    {isLeft && (
                      <>
                        {/* Connection line from card to center */}
                        <div className="absolute top-6 right-0 w-8 h-0.5 bg-gray-300" />
                        {/* Connection dot */}
                        <div className="absolute top-6 -right-1 w-3 h-3 bg-white border-2 border-gray-300 rounded-full translate-x-1/2" />
                        
                        {/* Event card */}
                        <Card 
                          className={cn(
                            'p-4 transition-all duration-300 mr-8',
                            isHovered ? 'shadow-lg border-blue-300 scale-[1.02]' : 'shadow-sm'
                          )}
                          onMouseEnter={() => setHoveredEvent(event.id)}
                          onMouseLeave={() => setHoveredEvent(null)}
                        >
                          {renderEventContent(event, attendancePercentage, isHovered)}
                        </Card>
                      </>
                    )}
                  </div>

                  {/* Right side */}
                  <div className={cn(
                    'relative',
                    isLeft && 'opacity-0 pointer-events-none'
                  )}>
                    {!isLeft && (
                      <>
                        {/* Connection line from center to card */}
                        <div className="absolute top-6 left-0 w-8 h-0.5 bg-gray-300" />
                        {/* Connection dot */}
                        <div className="absolute top-6 -left-1 w-3 h-3 bg-white border-2 border-gray-300 rounded-full -translate-x-1/2" />
                        
                        {/* Event card */}
                        <Card 
                          className={cn(
                            'p-4 transition-all duration-300 ml-8',
                            isHovered ? 'shadow-lg border-blue-300 scale-[1.02]' : 'shadow-sm'
                          )}
                          onMouseEnter={() => setHoveredEvent(event.id)}
                          onMouseLeave={() => setHoveredEvent(null)}
                        >
                          {renderEventContent(event, attendancePercentage, isHovered)}
                        </Card>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )

  function renderEventContent(event: EventData & { weekNumber: number; globalIndex: number }, attendancePercentage: number, isHovered: boolean) {
    return (
      <div className="space-y-3">
        {/* Title and date */}
        <div>
          <h3 className="font-semibold text-lg">{event.title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <CalendarIcon className="h-4 w-4" />
            <span>
              {format(event.date, 'EEEE d. MMMM', { locale: nb })}
            </span>
            <span className="text-gray-400">•</span>
            <span>{event.startTime} - {event.endTime}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Oppmøte</span>
            <span className="font-medium">{attendancePercentage}%</span>
          </div>
          <Progress 
            value={attendancePercentage} 
            className="h-3"
            indicatorClassName={getAttendanceColor(attendancePercentage)}
          />
        </div>

        {/* Attendance badges */}
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-300 bg-green-50">
            <CheckCircle2 className="h-3 w-3" />
            {event.attendingCount}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-red-700 border-red-300 bg-red-50">
            <XCircle className="h-3 w-3" />
            {event.notAttendingCount}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-gray-700 border-gray-300">
            <Users className="h-3 w-3" />
            {event.totalExpected} forventet
          </Badge>
        </div>

        {/* Hover details */}
        {isHovered && (
          <div className="pt-3 border-t space-y-2 animate-in fade-in duration-200">
            {event.location && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Sted:</span> {event.location}
              </p>
            )}
            {event.type && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Type:</span> {event.type}
              </p>
            )}
            <div className="text-sm text-gray-600">
              <p className="font-medium">Stemmefordeling:</p>
              <div className="grid grid-cols-4 gap-2 mt-1">
                <div>
                  <span className="text-xs text-gray-500">Sopran</span>
                  <div className="font-semibold">24/30</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Alt</span>
                  <div className="font-semibold">18/25</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Tenor</span>
                  <div className="font-semibold">22/28</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Bass</span>
                  <div className="font-semibold">30/35</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
}