'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, List, Sparkles } from 'lucide-react'
import Link from 'next/link'
import CalendarView from '@/components/events/CalendarView'
import { AnimatedInteractiveTimeline } from '@/components/events/AnimatedInteractiveTimeline'
import { format, getWeek } from 'date-fns'

interface Event {
  id: string
  title: string
  description?: string
  eventType: string
  startTime: string
  endTime: string
  location: string
  room?: string
  attendanceMode: 'opt_in' | 'opt_out'
  includeAllActive: boolean
  attendanceSummary: {
    total: number
    attending: number
    notAttending: number
    tentative: number
    notResponded: number
    present: number
    absent: number
    late: number
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'list'>('timeline')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatEventDate = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const isSameDay = start.toDateString() === end.toDateString()
    
    if (isSameDay) {
      return `${start.toLocaleDateString('no-NO', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })} ${start.toLocaleTimeString('no-NO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })} - ${end.toLocaleTimeString('no-NO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
    } else {
      return `${start.toLocaleDateString('no-NO', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })} ${start.toLocaleTimeString('no-NO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })} - ${end.toLocaleDateString('no-NO', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })} ${end.toLocaleTimeString('no-NO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
    }
  }

  const getAttendanceStatusColor = (event: Event) => {
    const { total, notResponded } = event.attendanceSummary
    if (total === 0) return 'bg-gray-500'
    
    const responseRate = (total - notResponded) / total
    if (responseRate < 0.5) return 'bg-red-500'
    if (responseRate < 0.8) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const transformEventsToTimelineFormat = () => {
    // Group events by week
    const eventsByWeek: { [key: number]: any[] } = {}
    
    events.forEach(event => {
      const eventDate = new Date(event.startTime)
      const weekNumber = getWeek(eventDate, { weekStartsOn: 1 })
      
      if (!eventsByWeek[weekNumber]) {
        eventsByWeek[weekNumber] = []
      }
      
      eventsByWeek[weekNumber].push({
        id: event.id,
        title: event.title,
        date: eventDate,
        startTime: format(new Date(event.startTime), 'HH:mm'),
        endTime: format(new Date(event.endTime), 'HH:mm'),
        attendingCount: event.attendanceSummary.attending,
        notAttendingCount: event.attendanceSummary.notAttending,
        totalExpected: event.attendanceSummary.total,
        location: event.location + (event.room ? `, ${event.room}` : ''),
        type: event.eventType
      })
    })
    
    // Convert to timeline format
    return Object.keys(eventsByWeek)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(weekNumber => ({
        weekNumber: parseInt(weekNumber),
        events: eventsByWeek[parseInt(weekNumber)]!.sort((a, b) => a.date.getTime() - b.date.getTime())
      }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Øvelser & Konserter</h1>
        </div>
        <div>Laster inn...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Øvelser & Konserter</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            <Sparkles className="h-4 w-4" />
            Tidslinje
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
            Liste
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="h-4 w-4" />
            Kalender
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/events/seasons">
              <Calendar className="h-4 w-4 mr-2" />
              Sesonger
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/events/new">
              <Plus className="h-4 w-4 mr-2" />
              Ny hendelse
            </Link>
          </Button>
        </div>
      </div>

      {viewMode === 'timeline' && (
        <div>
          {events.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ingen hendelser ennå</h3>
                  <p className="text-muted-foreground mb-4">
                    Opprett din første øvelse eller konsert for å se den animerte tidslinjen.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/events/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Opprett hendelse
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <AnimatedInteractiveTimeline weeks={transformEventsToTimelineFormat()} />
          )}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ingen hendelser ennå</h3>
                  <p className="text-muted-foreground mb-4">
                    Opprett din første øvelse eller konsert for å komme i gang.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/events/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Opprett hendelse
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        <Link 
                          href={`/dashboard/events/${event.id}`}
                          className="hover:underline"
                        >
                          {event.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formatEventDate(event.startTime, event.endTime)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{event.eventType}</Badge>
                      <div 
                        className={`w-3 h-3 rounded-full ${getAttendanceStatusColor(event)}`}
                        title={`${event.attendanceSummary.total - event.attendanceSummary.notResponded}/${event.attendanceSummary.total} har svart`}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      📍 {event.location}
                      {event.room && ` • ${event.room}`}
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-green-600">✓ {event.attendanceSummary.attending}</span>
                        <span className="text-red-600">✗ {event.attendanceSummary.notAttending}</span>
                        <span className="text-yellow-600">? {event.attendanceSummary.tentative}</span>
                        <span className="text-gray-500">• {event.attendanceSummary.notResponded}</span>
                      </div>
                      
                      <Badge variant={event.attendanceMode === 'opt_in' ? 'default' : 'outline'}>
                        {event.attendanceMode === 'opt_in' ? 'Påmelding' : 'Avmelding'}
                      </Badge>
                      
                      {event.includeAllActive && (
                        <Badge variant="outline">Alle aktive</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {viewMode === 'calendar' && (
        <CalendarView events={events} />
      )}
    </div>
  )
}