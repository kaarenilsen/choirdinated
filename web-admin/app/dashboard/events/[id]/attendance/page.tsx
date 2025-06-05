'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Search, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface Member {
  member: {
    id: string
    userProfileId: string
    voiceGroupId: string
    voiceTypeId?: string
  }
  userProfile: {
    name: string
    email: string
  }
  voiceGroup: {
    displayName: string
  }
  voiceType?: {
    displayName: string
  }
  attendance?: {
    id: string
    intendedStatus: string
    actualStatus?: string
    arrivalTime?: string
    departureTime?: string
    attendanceQuality?: string
    notes?: string
    markedAt?: string
  }
}

interface Event {
  id: string
  title: string
  startTime: string
  endTime: string
  location: string
}

export default function EventAttendancePage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [voiceGroupFilter, setVoiceGroupFilter] = useState<string>('all')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isRecordingDialogOpen, setIsRecordingDialogOpen] = useState(false)

  // Form states for attendance recording
  const [attendanceStatus, setAttendanceStatus] = useState<string>('')
  const [arrivalTime, setArrivalTime] = useState<string>('')
  const [departureTime, setDepartureTime] = useState<string>('')
  const [attendanceQuality, setAttendanceQuality] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  useEffect(() => {
    fetchEventAndAttendance()
  }, [eventId])

  useEffect(() => {
    filterMembers()
  }, [members, searchQuery, statusFilter, voiceGroupFilter])

  const fetchEventAndAttendance = async () => {
    try {
      setLoading(true)
      
      // Fetch event details
      const eventResponse = await fetch(`/api/events/${eventId}`)
      if (eventResponse.ok) {
        const eventData = await eventResponse.json()
        setEvent(eventData.event)
      }

      // Fetch attendance data
      const attendanceResponse = await fetch(`/api/events/${eventId}/attendance/record`)
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json()
        setMembers(attendanceData.members || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterMembers = () => {
    let filtered = members

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(member =>
        member.userProfile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.userProfile.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => {
        const actualStatus = member.attendance?.actualStatus
        switch (statusFilter) {
          case 'present':
            return actualStatus === 'present'
          case 'absent':
            return actualStatus === 'absent'
          case 'late':
            return actualStatus === 'late'
          case 'left_early':
            return actualStatus === 'left_early'
          case 'not_recorded':
            return !actualStatus
          default:
            return true
        }
      })
    }

    // Voice group filter
    if (voiceGroupFilter !== 'all') {
      filtered = filtered.filter(member =>
        member.member.voiceGroupId === voiceGroupFilter
      )
    }

    setFilteredMembers(filtered)
  }

  const recordAttendance = async () => {
    if (!selectedMember || !attendanceStatus) return

    try {
      const response = await fetch(`/api/events/${eventId}/attendance/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          member_id: selectedMember.member.id,
          actual_status: attendanceStatus,
          arrival_time: arrivalTime || undefined,
          departure_time: departureTime || undefined,
          attendance_quality: attendanceQuality || undefined,
          notes: notes || undefined
        })
      })

      if (response.ok) {
        // Refresh data
        await fetchEventAndAttendance()
        setIsRecordingDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(`Feil: ${error.error}`)
      }
    } catch (error) {
      console.error('Error recording attendance:', error)
      alert('Kunne ikke registrere oppmøte')
    }
  }

  const resetForm = () => {
    setAttendanceStatus('')
    setArrivalTime('')
    setDepartureTime('')
    setAttendanceQuality('')
    setNotes('')
    setSelectedMember(null)
  }

  const openRecordingDialog = (member: Member) => {
    setSelectedMember(member)
    // Pre-fill form if attendance already exists
    if (member.attendance) {
      setAttendanceStatus(member.attendance.actualStatus || '')
      setArrivalTime(member.attendance.arrivalTime ? member.attendance.arrivalTime.slice(0, 16) : '')
      setDepartureTime(member.attendance.departureTime ? member.attendance.departureTime.slice(0, 16) : '')
      setAttendanceQuality(member.attendance.attendanceQuality || '')
      setNotes(member.attendance.notes || '')
    } else {
      resetForm()
    }
    setIsRecordingDialogOpen(true)
  }

  const getStatusBadge = (member: Member) => {
    const status = member.attendance?.actualStatus
    
    if (!status) {
      return <Badge variant="outline" className="text-gray-500">Ikke registrert</Badge>
    }

    switch (status) {
      case 'present':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Tilstede</Badge>
      case 'absent':
        return <Badge className="bg-red-500 hover:bg-red-600"><XCircle className="w-3 h-3 mr-1" />Fraværende</Badge>
      case 'late':
        return <Badge className="bg-orange-500 hover:bg-orange-600"><Clock className="w-3 h-3 mr-1" />For sent</Badge>
      case 'left_early':
        return <Badge className="bg-orange-500 hover:bg-orange-600"><AlertCircle className="w-3 h-3 mr-1" />Gikk tidlig</Badge>
      default:
        return <Badge variant="outline">Ukjent</Badge>
    }
  }

  const getAttendanceSummary = () => {
    const total = members.length
    const present = members.filter(m => m.attendance?.actualStatus === 'present').length
    const absent = members.filter(m => m.attendance?.actualStatus === 'absent').length
    const late = members.filter(m => m.attendance?.actualStatus === 'late').length
    const leftEarly = members.filter(m => m.attendance?.actualStatus === 'left_early').length
    const notRecorded = members.filter(m => !m.attendance?.actualStatus).length

    return { total, present, absent, late, leftEarly, notRecorded }
  }

  const summary = getAttendanceSummary()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laster oppmøtedata...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbake
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Oppmøteregistrering</h1>
          {event && (
            <p className="text-gray-600">
              {event.title} • {new Date(event.startTime).toLocaleString('nb-NO')}
            </p>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-sm text-gray-600">Totalt</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{summary.present}</div>
            <div className="text-sm text-gray-600">Tilstede</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
            <div className="text-sm text-gray-600">Fraværende</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{summary.late}</div>
            <div className="text-sm text-gray-600">For sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{summary.leftEarly}</div>
            <div className="text-sm text-gray-600">Gikk tidlig</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{summary.notRecorded}</div>
            <div className="text-sm text-gray-600">Ikke registrert</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Søk etter navn eller e-post..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer på status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="present">Tilstede</SelectItem>
                <SelectItem value="absent">Fraværende</SelectItem>
                <SelectItem value="late">For sent</SelectItem>
                <SelectItem value="left_early">Gikk tidlig</SelectItem>
                <SelectItem value="not_recorded">Ikke registrert</SelectItem>
              </SelectContent>
            </Select>
            <Select value={voiceGroupFilter} onValueChange={setVoiceGroupFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer på stemmegruppe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle stemmegrupper</SelectItem>
                {/* Add voice group options based on available data */}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Medlemmer ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>Stemmegruppe</TableHead>
                <TableHead>Stemmetype</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ankomst</TableHead>
                <TableHead>Avgang</TableHead>
                <TableHead>Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.member.id}>
                  <TableCell className="font-medium">
                    {member.userProfile.name}
                  </TableCell>
                  <TableCell>{member.voiceGroup.displayName}</TableCell>
                  <TableCell>{member.voiceType?.displayName || '-'}</TableCell>
                  <TableCell>{getStatusBadge(member)}</TableCell>
                  <TableCell>
                    {member.attendance?.arrivalTime 
                      ? new Date(member.attendance.arrivalTime).toLocaleTimeString('nb-NO', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {member.attendance?.departureTime 
                      ? new Date(member.attendance.departureTime).toLocaleTimeString('nb-NO', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRecordingDialog(member)}
                    >
                      {member.attendance?.actualStatus ? 'Rediger' : 'Registrer'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recording Dialog */}
      <Dialog open={isRecordingDialogOpen} onOpenChange={setIsRecordingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Registrer oppmøte for {selectedMember?.userProfile.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Tilstede</SelectItem>
                  <SelectItem value="absent">Fraværende</SelectItem>
                  <SelectItem value="late">For sent</SelectItem>
                  <SelectItem value="left_early">Gikk tidlig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(attendanceStatus === 'late' || attendanceStatus === 'present') && (
              <div>
                <Label htmlFor="arrival">Ankomsttid</Label>
                <Input
                  id="arrival"
                  type="datetime-local"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                />
              </div>
            )}

            {(attendanceStatus === 'left_early' || attendanceStatus === 'present') && (
              <div>
                <Label htmlFor="departure">Avgangstid</Label>
                <Input
                  id="departure"
                  type="datetime-local"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="quality">Deltakelseskvalitet</Label>
              <Select value={attendanceQuality} onValueChange={setAttendanceQuality}>
                <SelectTrigger>
                  <SelectValue placeholder="Valgfritt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Utmerket</SelectItem>
                  <SelectItem value="good">God</SelectItem>
                  <SelectItem value="poor">Dårlig</SelectItem>
                  <SelectItem value="disruptive">Forstyrrende</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notater</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Valgfrie notater..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsRecordingDialogOpen(false)}
              >
                Avbryt
              </Button>
              <Button
                onClick={recordAttendance}
                disabled={!attendanceStatus}
              >
                Lagre
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}