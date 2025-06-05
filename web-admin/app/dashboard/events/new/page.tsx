'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { X, Users, Calendar, MapPin } from 'lucide-react'

interface EventOptions {
  eventTypes: Array<{ id: string; value: string; displayName: string }>
  eventStatuses: Array<{ id: string; value: string; displayName: string }>
  voiceGroups: Array<{ id: string; value: string; displayName: string }>
  voiceTypes: Array<{ id: string; value: string; displayName: string; parentId?: string }>
  membershipTypes: Array<{ id: string; name: string; displayName: string }>
}

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<EventOptions | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    typeId: '',
    statusId: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    room: '',
    attendanceMode: 'opt_out' as 'opt_in' | 'opt_out',
    includeAllActive: true,
    targetMembershipTypes: [] as string[],
    targetVoiceGroups: [] as string[],
    targetVoiceTypes: [] as string[],
    notes: '',
    calendarSyncEnabled: true,
    excludeHolidays: true,
    isRecurring: false,
    recurrenceType: 'weekly' as 'daily' | 'weekly' | 'monthly',
    recurrenceInterval: 1,
    recurrenceEndType: 'count' as 'count' | 'until',
    recurrenceCount: 10,
    recurrenceUntil: '',
    season: '',
  })

  useEffect(() => {
    fetchOptions()
    
    // Set default date/time to today
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5)
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000).toTimeString().slice(0, 5) // +2 hours
    
    setFormData(prev => ({
      ...prev,
      startDate: today,
      endDate: today,
      startTime: currentTime,
      endTime: endTime,
    } as typeof prev))
  }, [])

  const fetchOptions = async () => {
    try {
      const response = await fetch('/api/events/options')
      if (response.ok) {
        const data = await response.json()
        setOptions(data)
        
        // Set default event type if available
        if (data.eventTypes.length > 0) {
          const rehearsalType = data.eventTypes.find((t: any) => t.value === 'rehearsal')
          if (rehearsalType) {
            setFormData(prev => ({ ...prev, typeId: rehearsalType.id }))
          }
        }
      }
    } catch (error) {
      console.error('Error fetching options:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)

      const apiUrl = formData.isRecurring ? '/api/events/recurring' : '/api/events'
      const requestData = {
        ...formData,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        const data = await response.json()
        if (formData.isRecurring) {
          router.push(`/dashboard/events?created=${data.totalCreated}`)
        } else {
          router.push(`/dashboard/events/${data.event.id}`)
        }
      } else {
        const error = await response.json()
        console.error('Error creating event:', error)
        alert('Feil ved opprettelse av hendelse')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Feil ved opprettelse av hendelse')
    } finally {
      setLoading(false)
    }
  }

  const toggleTarget = (type: 'membershipTypes' | 'voiceGroups' | 'voiceTypes', id: string) => {
    setFormData(prev => {
      const key = `target${type.charAt(0).toUpperCase() + type.slice(1)}` as 'targetMembershipTypes' | 'targetVoiceGroups' | 'targetVoiceTypes'
      const currentArray = prev[key] as string[]
      
      return {
        ...prev,
        [key]: currentArray.includes(id)
          ? currentArray.filter(item => item !== id)
          : [...currentArray, id]
      }
    })
  }

  if (!options) {
    return <div>Laster inn...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ny hendelse</h1>
        <p className="text-muted-foreground">Opprett en ny øvelse, konsert eller annen hendelse</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Grunnleggende informasjon
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Tittel *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="F.eks. Øvelse, Sommerkonsert"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.typeId} onValueChange={(value) => setFormData(prev => ({ ...prev, typeId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg type" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.eventTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Beskrivelse</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tilleggsinformasjon om hendelsen..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Startdato *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          startDate: e.target.value,
                          endDate: e.target.value // Auto-set end date to same day
                        }))
                      }}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Starttid *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Sluttdato *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Sluttid *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Lokasjon
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Sted *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="F.eks. Oslo konserthus, Sagene kirke"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="room">Rom/sal</Label>
                  <Input
                    id="room"
                    value={formData.room}
                    onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                    placeholder="F.eks. Store sal, Lille sal"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Oppmøte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Oppmøtemodus</Label>
                  <Select 
                    value={formData.attendanceMode} 
                    onValueChange={(value: 'opt_in' | 'opt_out') => setFormData(prev => ({ ...prev, attendanceMode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opt_out">Avmelding (standard)</SelectItem>
                      <SelectItem value="opt_in">Påmelding</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {formData.attendanceMode === 'opt_out' 
                      ? 'Medlemmer antas å delta med mindre de melder seg av'
                      : 'Medlemmer må melde seg på for å delta'
                    }
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeAllActive"
                    checked={formData.includeAllActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeAllActive: checked }))}
                  />
                  <Label htmlFor="includeAllActive">Inkluder alle aktive medlemmer</Label>
                </div>
              </CardContent>
            </Card>

            {!formData.includeAllActive && (
              <Card>
                <CardHeader>
                  <CardTitle>Målgruppe</CardTitle>
                  <CardDescription>Velg hvem som skal se denne hendelsen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Medlemstyper</Label>
                    <div className="flex flex-wrap gap-2">
                      {options.membershipTypes.map((type) => (
                        <Badge
                          key={type.id}
                          variant={formData.targetMembershipTypes.includes(type.id) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleTarget('membershipTypes', type.id)}
                        >
                          {type.displayName}
                          {formData.targetMembershipTypes.includes(type.id) && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Stemmegrupper</Label>
                    <div className="flex flex-wrap gap-2">
                      {options.voiceGroups.map((group) => (
                        <Badge
                          key={group.id}
                          variant={formData.targetVoiceGroups.includes(group.id) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleTarget('voiceGroups', group.id)}
                        >
                          {group.displayName}
                          {formData.targetVoiceGroups.includes(group.id) && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Stemmetyper</Label>
                    <div className="flex flex-wrap gap-2">
                      {options.voiceTypes.map((type) => (
                        <Badge
                          key={type.id}
                          variant={formData.targetVoiceTypes.includes(type.id) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleTarget('voiceTypes', type.id)}
                        >
                          {type.displayName}
                          {formData.targetVoiceTypes.includes(type.id) && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Gjentakende hendelse</CardTitle>
                <CardDescription>Opprett en serie med hendelser som gjentas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked }))}
                  />
                  <Label htmlFor="isRecurring">Gjentakende hendelse</Label>
                </div>

                {formData.isRecurring && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recurrenceType">Gjentas</Label>
                        <Select 
                          value={formData.recurrenceType} 
                          onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setFormData(prev => ({ ...prev, recurrenceType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daglig</SelectItem>
                            <SelectItem value="weekly">Ukentlig</SelectItem>
                            <SelectItem value="monthly">Månedlig</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="recurrenceInterval">Hver</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="recurrenceInterval"
                            type="number"
                            min="1"
                            max="52"
                            value={formData.recurrenceInterval}
                            onChange={(e) => setFormData(prev => ({ ...prev, recurrenceInterval: parseInt(e.target.value) || 1 }))}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">
                            {formData.recurrenceType === 'daily' ? 'dag(er)' : 
                             formData.recurrenceType === 'weekly' ? 'uke(r)' : 'måned(er)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Slutt</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="endByCount"
                            name="recurrenceEnd"
                            checked={formData.recurrenceEndType === 'count'}
                            onChange={() => setFormData(prev => ({ ...prev, recurrenceEndType: 'count' }))}
                          />
                          <Label htmlFor="endByCount" className="flex items-center gap-2">
                            Etter
                            <Input
                              type="number"
                              min="1"
                              max="365"
                              value={formData.recurrenceCount}
                              onChange={(e) => setFormData(prev => ({ ...prev, recurrenceCount: parseInt(e.target.value) || 1 }))}
                              className="w-20"
                              disabled={formData.recurrenceEndType !== 'count'}
                            />
                            hendelser
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="endByDate"
                            name="recurrenceEnd"
                            checked={formData.recurrenceEndType === 'until'}
                            onChange={() => setFormData(prev => ({ ...prev, recurrenceEndType: 'until' }))}
                          />
                          <Label htmlFor="endByDate" className="flex items-center gap-2">
                            Til og med
                            <Input
                              type="date"
                              value={formData.recurrenceUntil}
                              onChange={(e) => setFormData(prev => ({ ...prev, recurrenceUntil: e.target.value }))}
                              disabled={formData.recurrenceEndType !== 'until'}
                            />
                          </Label>
                        </div>
                      </div>
                    </div>

                    {formData.typeId && options?.eventTypes.find(t => t.id === formData.typeId)?.value === 'rehearsal' && (
                      <div className="space-y-2">
                        <Label htmlFor="season">Sesong</Label>
                        <Input
                          id="season"
                          value={formData.season}
                          onChange={(e) => setFormData(prev => ({ ...prev, season: e.target.value }))}
                          placeholder="F.eks. Høst 2025, Julekonserter 2025"
                        />
                        <p className="text-sm text-muted-foreground">
                          Grupperingsnavn for øvelser som hører sammen
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Innstillinger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="calendarSync"
                    checked={formData.calendarSyncEnabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, calendarSyncEnabled: checked }))}
                  />
                  <Label htmlFor="calendarSync">Kalendersynkronisering</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="excludeHolidays"
                    checked={formData.excludeHolidays}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, excludeHolidays: checked }))}
                  />
                  <Label htmlFor="excludeHolidays">Ekskluder helligdager</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.back()}
          >
            Avbryt
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Oppretter...' : 'Opprett hendelse'}
          </Button>
        </div>
      </form>
    </div>
  )
}