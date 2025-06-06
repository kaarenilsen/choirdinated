'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { CalendarIcon, CheckCircle2, XCircle, Users, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
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

interface AnimatedInteractiveTimelineProps {
  weeks: WeekData[]
  className?: string
}

export function AnimatedInteractiveTimeline({ weeks, className }: AnimatedInteractiveTimelineProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)

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
              const isExpanded = expandedEvent === event.id

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
                          <Card className={cn(
                            'p-4 transition-all duration-300 cursor-pointer',
                            isExpanded ? 'shadow-lg border-blue-300' : 'shadow-sm hover:shadow-md'
                          )}
                          onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                          >
                            {renderEventContent(event, attendancePercentage, isExpanded, eventDelay)}
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
                          <Card className={cn(
                            'p-4 transition-all duration-300 cursor-pointer',
                            isExpanded ? 'shadow-lg border-blue-300' : 'shadow-sm hover:shadow-md'
                          )}
                          onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                          >
                            {renderEventContent(event, attendancePercentage, isExpanded, eventDelay)}
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

  function renderEventContent(event: EventData & { weekNumber: number; globalIndex: number }, attendancePercentage: number, isExpanded: boolean, baseDelay: number) {
    return (
      <div className="space-y-3">
        {/* Title and date */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: baseDelay + 0.6 }}
        >
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg flex-1">{event.title}</h3>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="ml-2 flex-shrink-0"
            >
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </motion.div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <CalendarIcon className="h-4 w-4" />
            <span>
              {format(event.date, 'EEEE d. MMMM', { locale: nb })}
            </span>
            <span className="text-gray-400">•</span>
            <span>{event.startTime} - {event.endTime}</span>
          </div>
          {!isExpanded && (
            <motion.p 
              className="text-xs text-gray-500 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: baseDelay + 1.2 }}
            >
              Klikk for å se detaljer
            </motion.p>
          )}
        </motion.div>

        {/* Animated progress bar */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: baseDelay + 0.8 }}
        >
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Oppmøte</span>
            <span className="font-medium">{attendancePercentage}%</span>
          </div>
          <Progress 
            value={attendancePercentage} 
            className="h-3"
            indicatorClassName={getAttendanceColor(attendancePercentage)}
          />
        </motion.div>

        {/* Animated attendance badges */}
        <motion.div 
          className="flex gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: baseDelay + 1.0 }}
        >
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
        </motion.div>

        {/* Expanded details with animation */}
        {isExpanded && (
          <motion.div 
            className="pt-3 border-t space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {event.location && (
              <motion.p 
                className="text-sm text-gray-600"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span className="font-medium">Sted:</span> {event.location}
              </motion.p>
            )}
            {event.type && (
              <motion.p 
                className="text-sm text-gray-600"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <span className="font-medium">Type:</span> {event.type}
              </motion.p>
            )}
            <motion.div 
              className="text-sm text-gray-600"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="font-medium mb-2">Stemmefordeling:</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: 'Sopran', attending: 24, total: 30 },
                  { name: 'Alt', attending: 18, total: 25 },
                  { name: 'Tenor', attending: 22, total: 28 },
                  { name: 'Bass', attending: 30, total: 35 }
                ].map((voice, index) => {
                  const voicePercentage = Math.round((voice.attending / voice.total) * 100)
                  return (
                    <motion.div 
                      key={voice.name}
                      className="bg-gray-50 rounded-lg p-2"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                    >
                      <span className="text-xs text-gray-500 block">{voice.name}</span>
                      <div className="font-semibold">{voice.attending}/{voice.total}</div>
                      <div className="text-xs text-gray-600">{voicePercentage}%</div>
                      <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                          className={cn(
                            'h-full',
                            voicePercentage >= 80 ? 'bg-green-500' :
                            voicePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${voicePercentage}%` }}
                          transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    )
  }
}