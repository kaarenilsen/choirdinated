'use client'

import React from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { CalendarIcon, MapPin, Tag, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

interface CardTimelineProps {
  weeks: WeekData[]
  className?: string
}

export function CardTimeline({ weeks, className }: CardTimelineProps) {
  const getAttendancePercentage = (event: EventData) => {
    if (event.totalExpected === 0) return 0
    return Math.round((event.attendingCount / event.totalExpected) * 100)
  }

  const getAttendanceTrend = (percentage: number) => {
    if (percentage >= 80) return { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' }
    if (percentage >= 60) return { icon: Minus, color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' }
  }

  const getEventTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'konsert':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'korprøve':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'generalprøve':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'sosialt':
        return 'bg-pink-100 text-pink-800 border-pink-300'
      case 'møte':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className={cn('max-w-5xl mx-auto', className)}>
      {weeks.map((week) => (
        <div key={week.weekNumber} className="mb-12">
          {/* Week header with custom styling */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm font-medium text-gray-700">
                Uke {week.weekNumber}
              </span>
            </div>
          </div>

          {/* Events grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {week.events.map((event) => {
              const attendancePercentage = getAttendancePercentage(event)
              const trend = getAttendanceTrend(attendancePercentage)
              const TrendIcon = trend.icon
              
              return (
                <Card key={event.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Custom border accent */}
                  <div className={cn(
                    'absolute top-0 left-0 right-0 h-1',
                    attendancePercentage >= 80 ? 'bg-green-500' :
                    attendancePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  )} />
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2 flex-1">
                        {event.title}
                      </CardTitle>
                      <div className={cn('p-2 rounded-full ml-2', trend.bg)}>
                        <TrendIcon className={cn('h-4 w-4', trend.color)} />
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-1 text-sm">
                      <CalendarIcon className="h-3 w-3" />
                      {format(event.date, 'EEE d. MMM', { locale: nb })}
                      <span className="mx-1">•</span>
                      {event.startTime} - {event.endTime}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Type and location badges */}
                    <div className="flex flex-wrap gap-2">
                      {event.type && (
                        <Badge variant="outline" className={cn('text-xs', getEventTypeColor(event.type))}>
                          <Tag className="h-3 w-3 mr-1" />
                          {event.type}
                        </Badge>
                      )}
                      {event.location && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {event.location}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Attendance visualization */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Oppmøte</span>
                        <span className={cn('text-sm font-bold', trend.color)}>
                          {attendancePercentage}%
                        </span>
                      </div>
                      
                      {/* Custom styled progress */}
                      <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <div 
                          className={cn(
                            'absolute inset-y-0 left-0 transition-all duration-500',
                            attendancePercentage >= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                            attendancePercentage >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                            'bg-gradient-to-r from-red-400 to-red-500'
                          )}
                          style={{ width: `${attendancePercentage}%` }}
                        />
                        <div className="relative h-full flex items-center justify-center text-xs font-medium">
                          {event.attendingCount} av {event.totalExpected}
                        </div>
                      </div>
                    </div>
                    
                    {/* Attendance details */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-600">Kommer:</span>
                        <span className="font-medium">{event.attendingCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-gray-600">Kommer ikke:</span>
                        <span className="font-medium">{event.notAttendingCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}