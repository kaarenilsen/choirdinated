'use client'

import React from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { CalendarIcon, CheckCircle2, XCircle, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
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

interface AnimatedTimelineProps {
  weeks: WeekData[]
  className?: string
}

export function AnimatedTimeline({ weeks, className }: AnimatedTimelineProps) {
  const getAttendancePercentage = (event: EventData) => {
    if (event.totalExpected === 0) return 0
    return Math.round((event.attendingCount / event.totalExpected) * 100)
  }

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-700 bg-green-50 border-green-300'
    if (percentage >= 60) return 'text-yellow-700 bg-yellow-50 border-yellow-300'
    return 'text-red-700 bg-red-50 border-red-300'
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
      {/* Animated vertical line */}
      <motion.div 
        className="absolute left-1/2 top-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200 -translate-x-1/2"
        initial={{ height: 0 }}
        animate={{ height: '100%' }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
      
      {weeks.map((week, weekIndex) => {
        const weekEvents = allEvents.filter(e => e.weekNumber === week.weekNumber)
        const weekDelay = weekIndex * 0.3
        
        return (
          <div key={week.weekNumber} className="relative">
            {/* Animated week marker */}
            <motion.div 
              className="relative flex justify-center items-center mb-8"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: weekDelay,
                type: 'spring',
                stiffness: 200
              }}
            >
              <div className="absolute left-1/2 w-4 h-4 bg-white border-4 border-blue-400 rounded-full -translate-x-1/2 z-10" />
              <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 rounded-md text-sm font-medium z-10 shadow-sm">
                Uke {week.weekNumber}
              </div>
            </motion.div>

            {/* Events */}
            {weekEvents.map((event, eventIndex) => {
              const attendancePercentage = getAttendancePercentage(event)
              const isLeft = event.globalIndex % 2 === 0
              const eventDelay = weekDelay + (eventIndex + 1) * 0.2

              return (
                <motion.div
                  key={event.id}
                  className="relative grid grid-cols-2 gap-8 mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: eventDelay }}
                >
                  {/* Left side */}
                  <div className={cn(
                    'relative',
                    !isLeft && 'opacity-0 pointer-events-none'
                  )}>
                    {isLeft && (
                      <>
                        {/* Animated connection line */}
                        <motion.div 
                          className="absolute top-6 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-gray-300"
                          initial={{ width: 0 }}
                          animate={{ width: '2rem' }}
                          transition={{ duration: 0.3, delay: eventDelay + 0.2 }}
                        />
                        {/* Connection dot */}
                        <motion.div 
                          className="absolute top-6 -right-1 w-3 h-3 bg-white border-2 border-gray-400 rounded-full translate-x-1/2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2, delay: eventDelay + 0.4 }}
                        />
                        
                        {/* Event card sliding from left */}
                        <motion.div
                          initial={{ x: -100, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ 
                            duration: 0.5, 
                            delay: eventDelay,
                            type: 'spring',
                            stiffness: 100
                          }}
                          whileHover={{ scale: 1.02 }}
                          className="mr-8"
                        >
                          <Card className="p-4 shadow-sm hover:shadow-lg transition-shadow duration-300">
                            {renderEventContent(event, attendancePercentage)}
                          </Card>
                        </motion.div>
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
                        {/* Animated connection line */}
                        <motion.div 
                          className="absolute top-6 left-0 h-0.5 bg-gradient-to-l from-transparent via-gray-300 to-gray-300"
                          initial={{ width: 0 }}
                          animate={{ width: '2rem' }}
                          transition={{ duration: 0.3, delay: eventDelay + 0.2 }}
                        />
                        {/* Connection dot */}
                        <motion.div 
                          className="absolute top-6 -left-1 w-3 h-3 bg-white border-2 border-gray-400 rounded-full -translate-x-1/2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2, delay: eventDelay + 0.4 }}
                        />
                        
                        {/* Event card sliding from right */}
                        <motion.div
                          initial={{ x: 100, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ 
                            duration: 0.5, 
                            delay: eventDelay,
                            type: 'spring',
                            stiffness: 100
                          }}
                          whileHover={{ scale: 1.02 }}
                          className="ml-8"
                        >
                          <Card className="p-4 shadow-sm hover:shadow-lg transition-shadow duration-300">
                            {renderEventContent(event, attendancePercentage)}
                          </Card>
                        </motion.div>
                      </>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )
      })}
    </div>
  )

  function renderEventContent(event: EventData & { weekNumber: number; globalIndex: number }, attendancePercentage: number) {
    const attendanceColorClass = getAttendanceColor(attendancePercentage)
    
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

        {/* Animated attendance meter */}
        <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className={cn("h-full flex items-center justify-end pr-2", attendanceColorClass)}
            initial={{ width: 0 }}
            animate={{ width: `${attendancePercentage}%` }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          >
            <span className="text-xs font-medium">{attendancePercentage}%</span>
          </motion.div>
          <div className="absolute inset-0 flex items-center px-2">
            <span className="text-xs font-medium text-gray-700">Oppmøte</span>
          </div>
        </div>

        {/* Attendance badges */}
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-300 bg-green-50">
            <CheckCircle2 className="h-3 w-3" />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {event.attendingCount}
            </motion.span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-red-700 border-red-300 bg-red-50">
            <XCircle className="h-3 w-3" />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              {event.notAttendingCount}
            </motion.span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-gray-700 border-gray-300">
            <Users className="h-3 w-3" />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              {event.totalExpected} forventet
            </motion.span>
          </Badge>
        </div>

        {/* Additional info */}
        {(event.location || event.type) && (
          <motion.div 
            className="pt-3 border-t space-y-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
          >
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
          </motion.div>
        )}
      </div>
    )
  }
}