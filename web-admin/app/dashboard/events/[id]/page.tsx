'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Circle,
  UserCheck,
  UserX,
  UserMinus
} from 'lucide-react'
import Link from 'next/link'

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
  attendanceRecords: Array<{
    id: string
    memberId: string
    memberName: string
    memberEmail: string
    voiceGroup: string
    intendedStatus: string
    intendedReason?: string
    actualStatus?: string
    notes?: string
    memberResponseAt?: string
    markedAt?: string
  }>
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvent()
  }, [params.id])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data.event)
      } else if (response.status === 404) {
        router.push('/dashboard/events')
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatEventDate = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const isSameDay = start.toDateString() === end.toDateString()
    
    if (isSameDay) {
      return {
        date: start.toLocaleDateString('no-NO', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        time: `${start.toLocaleTimeString('no-NO', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })} - ${end.toLocaleTimeString('no-NO', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`
      }
    } else {
      return {
        date: `${start.toLocaleDateString('no-NO', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })} - ${end.toLocaleDateString('no-NO', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })}`,
        time: `${start.toLocaleTimeString('no-NO', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })} - ${end.toLocaleTimeString('no-NO', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'attending':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'not_attending':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'tentative':
        return <HelpCircle className="h-4 w-4 text-yellow-600" />
      case 'present':
        return <UserCheck className="h-4 w-4 text-green-600" />
      case 'absent':
        return <UserX className="h-4 w-4 text-red-600" />
      case 'late':
        return <UserMinus className="h-4 w-4 text-yellow-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'attending': return 'Kommer'
      case 'not_attending': return 'Kommer ikke'
      case 'tentative': return 'Usikker'
      case 'not_responded': return 'Ikke svart'
      case 'present': return 'Til stede'
      case 'absent': return 'Fraværende'
      case 'late': return 'Forsinket'
      default: return status
    }
  }

  if (loading) {
    return <div>Laster inn...</div>
  }

  if (!event) {
    return <div>Hendelse ikke funnet</div>
  }

  const { date, time } = formatEventDate(event.startTime, event.endTime)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          <p className="text-muted-foreground text-lg">{date}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/events/${event.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Rediger
            </Link>
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}{event.room && ` • ${event.room}`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">{event.eventType}</Badge>
                </div>
              </div>

              {event.description && (
                <div>
                  <h4 className="font-medium mb-2">Beskrivelse</h4>
                  <p className="text-muted-foreground">{event.description}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Badge variant={event.attendanceMode === 'opt_in' ? 'default' : 'outline'}>
                  {event.attendanceMode === 'opt_in' ? 'Påmelding' : 'Avmelding'}
                </Badge>
                {event.includeAllActive && (
                  <Badge variant="outline">Alle aktive medlemmer</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="responses" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="responses">Responser ({event.attendanceSummary.total})</TabsTrigger>
              <TabsTrigger value="attendance">Oppmøte</TabsTrigger>
            </TabsList>
            
            <TabsContent value="responses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Medlemsresponser</CardTitle>
                  <CardDescription>
                    Oversikt over hvem som har svart på hendelsen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {event.attendanceRecords.map((record) => {
                      // For opt-out events, show non-responders as "assumed attending"
                      const isOptOut = event.attendanceMode === 'opt_out'
                      const displayStatus = (isOptOut && record.intendedStatus === 'not_responded') 
                        ? 'assumed_attending' 
                        : record.intendedStatus
                      
                      return (
                        <div key={record.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                          <div className="flex items-center gap-3">
                            {displayStatus === 'assumed_attending' ? (
                              <CheckCircle className="h-4 w-4 text-green-600 opacity-60" />
                            ) : (
                              getStatusIcon(record.intendedStatus)
                            )}
                            <div>
                              <div className="font-medium">{record.memberName}</div>
                              <div className="text-sm text-muted-foreground">{record.voiceGroup}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {displayStatus === 'assumed_attending' ? (
                                <span className="text-green-600 opacity-75">Regnes som kommer</span>
                              ) : (
                                getStatusText(record.intendedStatus)
                              )}
                            </div>
                            {record.memberResponseAt && (
                              <div className="text-xs text-muted-foreground">
                                {new Date(record.memberResponseAt).toLocaleDateString('no-NO')}
                              </div>
                            )}
                            {displayStatus === 'assumed_attending' && (
                              <div className="text-xs text-muted-foreground">
                                (Ikke svart - avmelding)
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="attendance" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Registrer oppmøte</CardTitle>
                    <CardDescription>
                      Marker hvem som var til stede under hendelsen
                    </CardDescription>
                  </div>
                  <Button asChild>
                    <Link href={`/dashboard/events/${event.id}/attendance`}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Åpne oppmøtesiden
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {event.attendanceRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(record.actualStatus || 'not_marked')}
                          <div>
                            <div className="font-medium">{record.memberName}</div>
                            <div className="text-sm text-muted-foreground">{record.voiceGroup}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <UserX className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Oppmøtestatistikk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Totalt</span>
                  <span className="font-medium">{event.attendanceSummary.total}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span className="text-sm">Kommer</span>
                  <span className="font-medium">{event.attendanceSummary.attending}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span className="text-sm">Kommer ikke</span>
                  <span className="font-medium">{event.attendanceSummary.notAttending}</span>
                </div>
                <div className="flex justify-between text-yellow-600">
                  <span className="text-sm">Usikker</span>
                  <span className="font-medium">{event.attendanceSummary.tentative}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="text-sm">Ikke svart</span>
                  <span className="font-medium">{event.attendanceSummary.notResponded}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Faktisk oppmøte</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm">Til stede</span>
                    <span className="font-medium">{event.attendanceSummary.present}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span className="text-sm">Fraværende</span>
                    <span className="font-medium">{event.attendanceSummary.absent}</span>
                  </div>
                  <div className="flex justify-between text-yellow-600">
                    <span className="text-sm">Forsinket</span>
                    <span className="font-medium">{event.attendanceSummary.late}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Handlinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/events/${event.id}/attendance`}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Registrer oppmøte
                </Link>
              </Button>
              <Button variant="outline" className="w-full">
                Send påminnelse
              </Button>
              <Button variant="outline" className="w-full">
                Eksporter liste
              </Button>
              <Button variant="outline" className="w-full">
                Kalenderlink
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}