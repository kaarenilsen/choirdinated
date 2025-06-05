'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  eventType: string
  startTime: string
  endTime: string
  location: string
  attendanceMode: 'opt_in' | 'opt_out'
  attendanceSummary: {
    total: number
    attending: number
    notAttending: number
    notResponded: number
  }
}

interface CalendarViewProps {
  events: Event[]
}

const DAYS = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag']
const MONTHS = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'
]

export default function CalendarView({ events }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Get first day of current month and calculate calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay()) // Start from Sunday

  const endDate = new Date(lastDayOfMonth)
  endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay())) // End on Saturday

  // Generate calendar days
  const calendarDays = []
  const current = new Date(startDate)
  while (current <= endDate) {
    calendarDays.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {}
    events.forEach(event => {
      const startDate = new Date(event.startTime)
      const endDate = new Date(event.endTime)
      
      // Handle multi-day events
      const current = new Date(startDate)
      current.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(0, 0, 0, 0)
      
      while (current <= end) {
        const dateKey = current.toISOString().split('T')[0]!
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(event)
        current.setDate(current.getDate() + 1)
      }
    })
    return grouped
  }, [events])

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'øvelse':
      case 'rehearsal':
        return 'bg-blue-500'
      case 'konsert':
      case 'concert':
        return 'bg-purple-500'
      case 'seminar':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatEventTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const isSameDay = start.toDateString() === end.toDateString()
    
    if (isSameDay) {
      return `${start.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return `${start.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })} ${end.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}`
    }
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              I dag
            </Button>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new">
            <Plus className="h-4 w-4 mr-2" />
            Ny hendelse
          </Link>
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b">
            {DAYS.map(day => (
              <div key={day} className="p-3 text-center font-medium text-sm text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              const dateKey = date.toISOString().split('T')[0]!
              const dayEvents = eventsByDate[dateKey] || []
              const isCurrentMonthDay = isCurrentMonth(date)
              const isTodayDay = isToday(date)

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b last:border-r-0 ${
                    !isCurrentMonthDay ? 'bg-muted/30' : ''
                  } ${isTodayDay ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    !isCurrentMonthDay ? 'text-muted-foreground' : 
                    isTodayDay ? 'text-blue-600' : ''
                  }`}>
                    {date.getDate()}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event, eventIndex) => (
                      <Link
                        key={`${event.id}-${eventIndex}`}
                        href={`/dashboard/events/${event.id}`}
                        className="block"
                      >
                        <div className={`p-1 rounded text-xs text-white cursor-pointer hover:opacity-80 ${getEventTypeColor(event.eventType)}`}>
                          <div className="font-medium truncate">
                            {event.title}
                          </div>
                          <div className="truncate opacity-90">
                            {formatEventTime(event.startTime, event.endTime)}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant={event.attendanceMode === 'opt_in' ? 'secondary' : 'outline'} className="text-xs py-0 px-1">
                              {event.attendanceMode === 'opt_in' ? 'Påmelding' : 'Avmelding'}
                            </Badge>
                            <span className="text-xs opacity-75">
                              {event.attendanceSummary.attending}/{event.attendanceSummary.total}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground p-1">
                        +{dayEvents.length - 3} flere...
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">Hendelsestyper:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Øvelse</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span>Konsert</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Seminar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-500 rounded"></div>
          <span>Annet</span>
        </div>
      </div>
    </div>
  )
}