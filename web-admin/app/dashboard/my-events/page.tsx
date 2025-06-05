'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, MapPin, CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import MemberAttendanceResponse from '@/components/events/MemberAttendanceResponse'

interface Event {
  id: string
  title: string
  eventType: string
  startTime: string
  endTime: string
  location: string
  room?: string
  attendanceMode: 'opt_in' | 'opt_out'
  description?: string
  attendance?: {
    id: string
    intendedStatus: 'attending' | 'not_attending' | 'tentative' | 'not_responded'
    intendedReason?: string
    memberResponseAt?: string
  }
}

export default function MyEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyEvents()
  }, [])

  const fetchMyEvents = async () => {
    try {
      const response = await fetch('/api/events/my-events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Error fetching my events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceResponse = async (eventId: string, status: 'attending' | 'not_attending' | 'tentative', reason?: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intendedStatus: status,
          intendedReason: reason,
        }),
      })

      if (response.ok) {
        // Refresh events to get updated attendance
        await fetchMyEvents()
      } else {
        throw new Error('Failed to update attendance')
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
      throw error
    }
  }

  const categorizeEvents = (events: Event[]) => {
    const now = new Date()
    const upcoming = events.filter(event => new Date(event.startTime) > now)
    const past = events.filter(event => new Date(event.startTime) <= now)
    
    return {
      upcoming: upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
      past: past.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    }
  }

  const getResponseStatusSummary = (events: Event[]) => {
    const total = events.length
    const responded = events.filter(e => e.attendance?.intendedStatus !== 'not_responded').length
    const attending = events.filter(e => e.attendance?.intendedStatus === 'attending').length
    const notAttending = events.filter(e => e.attendance?.intendedStatus === 'not_attending').length
    const tentative = events.filter(e => e.attendance?.intendedStatus === 'tentative').length
    
    return { total, responded, attending, notAttending, tentative }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Mine hendelser</h1>
        <div>Laster inn...</div>
      </div>
    )
  }

  const { upcoming, past } = categorizeEvents(events)
  const upcomingSummary = getResponseStatusSummary(upcoming)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mine hendelser</h1>
        <p className="text-muted-foreground">Se og svar på hendelser du er invitert til</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{upcomingSummary.total}</p>
                <p className="text-sm text-muted-foreground">Kommende</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{upcomingSummary.attending}</p>
                <p className="text-sm text-muted-foreground">Kommer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{upcomingSummary.notAttending}</p>
                <p className="text-sm text-muted-foreground">Kommer ikke</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{upcomingSummary.total - upcomingSummary.responded}</p>
                <p className="text-sm text-muted-foreground">Ikke svart</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            Kommende hendelser ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Tidligere hendelser ({past.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-4">
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ingen kommende hendelser</h3>
                  <p className="text-muted-foreground">
                    Du har for øyeblikket ingen hendelser å svare på.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            upcoming.map((event) => (
              <MemberAttendanceResponse
                key={event.id}
                event={event}
                attendance={event.attendance}
                onResponse={(status, reason) => handleAttendanceResponse(event.id, status, reason)}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="past" className="space-y-4">
          {past.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ingen tidligere hendelser</h3>
                  <p className="text-muted-foreground">
                    Du har ikke deltatt i noen hendelser ennå.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            past.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {event.title}
                        <Badge variant="secondary">{event.eventType}</Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {new Date(event.startTime).toLocaleDateString('no-NO', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      {event.attendance?.intendedStatus === 'attending' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {event.attendance?.intendedStatus === 'not_attending' && <XCircle className="h-5 w-5 text-red-600" />}
                      {event.attendance?.intendedStatus === 'tentative' && <HelpCircle className="h-5 w-5 text-yellow-600" />}
                      {event.attendance?.intendedStatus === 'not_responded' && <Clock className="h-5 w-5 text-gray-400" />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {event.location}{event.room && ` • ${event.room}`}
                    </div>
                    {event.attendance?.intendedReason && (
                      <div>
                        <strong>Grunn:</strong> {event.attendance.intendedReason}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}