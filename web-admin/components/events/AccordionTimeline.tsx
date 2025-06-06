'use client'

import React from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { CalendarIcon, CheckCircle2, XCircle, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

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

interface AccordionTimelineProps {
  weeks: WeekData[]
  className?: string
}

export function AccordionTimeline({ weeks, className }: AccordionTimelineProps) {
  const getAttendancePercentage = (event: EventData) => {
    if (event.totalExpected === 0) return 0
    return Math.round((event.attendingCount / event.totalExpected) * 100)
  }

  const getWeekAttendanceAverage = (events: EventData[]) => {
    if (events.length === 0) return 0
    const total = events.reduce((sum, event) => sum + getAttendancePercentage(event), 0)
    return Math.round(total / events.length)
  }

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-700'
    if (percentage >= 60) return 'text-yellow-700'
    return 'text-red-700'
  }

  return (
    <div className={cn('max-w-4xl mx-auto', className)}>
      <Accordion type="single" collapsible className="w-full">
        {weeks.map((week) => {
          const weekAverage = getWeekAttendanceAverage(week.events)
          const totalAttending = week.events.reduce((sum, e) => sum + e.attendingCount, 0)
          const totalNotAttending = week.events.reduce((sum, e) => sum + e.notAttendingCount, 0)
          
          return (
            <AccordionItem key={week.weekNumber} value={`week-${week.weekNumber}`} className="mb-2">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-lg">Uke {week.weekNumber}</span>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                      {week.events.length} {week.events.length === 1 ? 'arrangement' : 'arrangementer'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {totalAttending}
                      </Badge>
                      <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                        <XCircle className="h-3 w-3 mr-1" />
                        {totalNotAttending}
                      </Badge>
                    </div>
                    <div className={cn('text-sm font-medium', getAttendanceColor(weekAverage))}>
                      {weekAverage}% oppmøte
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  {week.events.map((event) => {
                    const attendancePercentage = getAttendancePercentage(event)
                    
                    return (
                      <Card key={event.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div>
                              <h3 className="font-semibold text-lg">{event.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <CalendarIcon className="h-4 w-4" />
                                <span>
                                  {format(event.date, 'EEEE d. MMMM', { locale: nb })}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>{event.startTime} - {event.endTime}</span>
                                {event.location && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span>{event.location}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {event.type && (
                              <Badge variant="secondary" className="text-xs">
                                {event.type}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-2 ml-4">
                            <div className={cn('text-2xl font-bold', getAttendanceColor(attendancePercentage))}>
                              {attendancePercentage}%
                            </div>
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
                                <CheckCircle2 className="h-3 w-3" />
                                {event.attendingCount}
                              </Badge>
                              <Badge variant="outline" className="text-xs text-red-700 border-red-300 bg-red-50">
                                <XCircle className="h-3 w-3" />
                                {event.notAttendingCount}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {/* Attendance bar */}
                        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              'h-full transition-all duration-300',
                              attendancePercentage >= 80 ? 'bg-green-500' :
                              attendancePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            )}
                            style={{ width: `${attendancePercentage}%` }}
                          />
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}