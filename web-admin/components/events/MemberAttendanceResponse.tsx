'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, HelpCircle, Clock } from 'lucide-react'

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
}

interface AttendanceRecord {
  id: string
  intendedStatus: 'attending' | 'not_attending' | 'tentative' | 'not_responded'
  intendedReason?: string
  memberResponseAt?: string
}

interface MemberAttendanceResponseProps {
  event: Event
  attendance?: AttendanceRecord | undefined
  onResponse: (status: 'attending' | 'not_attending' | 'tentative', reason?: string) => Promise<void>
}

export default function MemberAttendanceResponse({ 
  event, 
  attendance, 
  onResponse 
}: MemberAttendanceResponseProps) {
  const [selectedStatus, setSelectedStatus] = useState<'attending' | 'not_attending' | 'tentative' | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

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

  const handleSubmit = async () => {
    if (!selectedStatus) return

    setLoading(true)
    try {
      await onResponse(selectedStatus, reason.trim() || undefined)
      setSelectedStatus(null)
      setReason('')
    } catch (error) {
      console.error('Error submitting response:', error)
      alert('Feil ved lagring av svar')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'attending':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'not_attending':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'tentative':
        return <HelpCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'attending': return 'Kommer'
      case 'not_attending': return 'Kommer ikke'
      case 'tentative': return 'Usikker'
      default: return 'Ikke svart'
    }
  }

  const { date, time } = formatEventDate(event.startTime, event.endTime)
  const currentStatus = attendance?.intendedStatus || 'not_responded'

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {event.title}
              <Badge variant="secondary">{event.eventType}</Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              {date} • {time}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(currentStatus)}
            <Badge variant={event.attendanceMode === 'opt_in' ? 'default' : 'outline'}>
              {event.attendanceMode === 'opt_in' ? 'Påmelding' : 'Avmelding'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          📍 {event.location}{event.room && ` • ${event.room}`}
        </div>

        {event.description && (
          <div className="text-sm">
            <strong>Beskrivelse:</strong> {event.description}
          </div>
        )}

        {/* Current Status Display */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">Din status:</span>
            {getStatusIcon(currentStatus)}
            <span>{getStatusText(currentStatus)}</span>
          </div>
          
          {currentStatus === 'not_responded' && (
            <div className="text-sm text-muted-foreground">
              {event.attendanceMode === 'opt_out' 
                ? `Du regnes som deltakende med mindre du melder deg av.`
                : `Du må melde deg på for å delta.`
              }
            </div>
          )}

          {attendance?.intendedReason && (
            <div className="text-sm text-muted-foreground mt-1">
              <strong>Grunn:</strong> {attendance.intendedReason}
            </div>
          )}

          {attendance?.memberResponseAt && (
            <div className="text-xs text-muted-foreground mt-1">
              Svart {new Date(attendance.memberResponseAt).toLocaleString('no-NO')}
            </div>
          )}
        </div>

        {/* Response Options */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Endre svar:</div>
          
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant={selectedStatus === 'attending' ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => setSelectedStatus('attending')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Jeg kommer
            </Button>
            
            <Button
              variant={selectedStatus === 'tentative' ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => setSelectedStatus('tentative')}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Jeg er usikker
            </Button>
            
            <Button
              variant={selectedStatus === 'not_attending' ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => setSelectedStatus('not_attending')}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Jeg kommer ikke
            </Button>
          </div>

          {(selectedStatus === 'not_attending' || selectedStatus === 'tentative') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Grunn (valgfritt):
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="F.eks. jobb, sykdom, ferie..."
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Denne informasjonen er kun synlig for dirigenter og gruppeleder(e).
              </p>
            </div>
          )}

          {selectedStatus && (
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Lagrer...' : 'Lagre svar'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedStatus(null)
                  setReason('')
                }}
              >
                Avbryt
              </Button>
            </div>
          )}
        </div>

        {/* Information about attendance mode */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          {event.attendanceMode === 'opt_in' ? (
            <div className="flex items-center gap-1">
              <span className="font-medium">Påmelding:</span>
              Du må aktivt melde deg på for å delta i denne hendelsen.
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="font-medium">Avmelding:</span>
              Du regnes som deltakende med mindre du melder deg av.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}