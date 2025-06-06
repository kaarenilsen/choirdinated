'use client'

import React from 'react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { nb } from 'date-fns/locale'
import { CalendarIcon, Clock, MapPin, Users, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

interface TabTimelineProps {
  weeks: WeekData[]
  className?: string
}

export function TabTimeline({ weeks, className }: TabTimelineProps) {
  const getAttendancePercentage = (event: EventData) => {
    if (event.totalExpected === 0) return 0
    return Math.round((event.attendingCount / event.totalExpected) * 100)
  }

  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 80) return { label: 'Høyt oppmøte', color: 'text-green-600', icon: CheckCircle2 }
    if (percentage >= 60) return { label: 'Middels oppmøte', color: 'text-yellow-600', icon: AlertCircle }
    return { label: 'Lavt oppmøte', color: 'text-red-600', icon: XCircle }
  }

  const getWeekDateRange = (events: EventData[]) => {
    if (events.length === 0) return ''
    const firstDate = events[0]!.date
    const start = startOfWeek(firstDate, { weekStartsOn: 1 })
    const end = endOfWeek(firstDate, { weekStartsOn: 1 })
    return `${format(start, 'd. MMM', { locale: nb })} - ${format(end, 'd. MMM', { locale: nb })}`
  }

  const getWeekStats = (events: EventData[]) => {
    const totalAttending = events.reduce((sum, e) => sum + e.attendingCount, 0)
    const totalExpected = events.reduce((sum, e) => sum + e.totalExpected, 0)
    const avgPercentage = totalExpected > 0 ? Math.round((totalAttending / totalExpected) * 100) : 0
    return { totalAttending, totalExpected, avgPercentage }
  }

  return (
    <div className={cn('max-w-6xl mx-auto', className)}>
      <Tabs defaultValue={`week-${weeks[0]?.weekNumber}`} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
          {weeks.map((week) => {
            const stats = getWeekStats(week.events)
            return (
              <TabsTrigger 
                key={week.weekNumber} 
                value={`week-${week.weekNumber}`}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <span className="font-semibold">Uke {week.weekNumber}</span>
                <span className="text-xs text-muted-foreground">
                  {week.events.length} arrangement
                </span>
                <div className={cn(
                  'text-xs font-medium',
                  stats.avgPercentage >= 80 ? 'text-green-600' :
                  stats.avgPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {stats.avgPercentage}% oppmøte
                </div>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {weeks.map((week) => {
          const weekStats = getWeekStats(week.events)
          const dateRange = getWeekDateRange(week.events)
          
          return (
            <TabsContent 
              key={week.weekNumber} 
              value={`week-${week.weekNumber}`}
              className="mt-6 space-y-6"
            >
              {/* Week overview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Uke {week.weekNumber}</h2>
                    <p className="text-gray-600">{dateRange}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold mb-1">
                      {weekStats.avgPercentage}%
                    </div>
                    <p className="text-sm text-gray-600">
                      {weekStats.totalAttending} av {weekStats.totalExpected} totalt
                    </p>
                  </div>
                </div>
              </div>

              {/* Events timeline */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
                
                {week.events.map((event) => {
                  const attendancePercentage = getAttendancePercentage(event)
                  const status = getAttendanceStatus(attendancePercentage)
                  const StatusIcon = status.icon
                  
                  return (
                    <div key={event.id} className="relative flex items-start mb-8 last:mb-0">
                      {/* Timeline node */}
                      <div className="absolute left-8 w-4 h-4 bg-white border-2 border-gray-400 rounded-full -translate-x-1/2 mt-2" />
                      
                      {/* Event card */}
                      <Card className="ml-16 p-6 flex-1 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            {/* Header */}
                            <div>
                              <h3 className="text-xl font-semibold mb-1">{event.title}</h3>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4" />
                                  {format(event.date, 'EEEE d. MMMM', { locale: nb })}
                                </div>
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
                              </div>
                            </div>

                            {/* Type badge */}
                            {event.type && (
                              <Badge variant="secondary" className="w-fit">
                                {event.type}
                              </Badge>
                            )}

                            {/* Attendance details */}
                            <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                              <div className="text-center">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                                <div className="text-2xl font-bold text-green-600">{event.attendingCount}</div>
                                <div className="text-xs text-gray-600">Kommer</div>
                              </div>
                              <div className="text-center">
                                <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                                <div className="text-2xl font-bold text-red-600">{event.notAttendingCount}</div>
                                <div className="text-xs text-gray-600">Kommer ikke</div>
                              </div>
                              <div className="text-center">
                                <Users className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                                <div className="text-2xl font-bold text-gray-600">{event.totalExpected}</div>
                                <div className="text-xs text-gray-600">Forventet</div>
                              </div>
                            </div>
                          </div>

                          {/* Attendance status */}
                          <div className="ml-6 text-center">
                            <div className={cn('p-3 rounded-full mb-2', 
                              attendancePercentage >= 80 ? 'bg-green-100' :
                              attendancePercentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                            )}>
                              <StatusIcon className={cn('h-8 w-8', status.color)} />
                            </div>
                            <div className={cn('text-3xl font-bold', status.color)}>
                              {attendancePercentage}%
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {status.label}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}