'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, Plus, Search, Filter, Download, Settings, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

type Member = {
  id: string
  name: string
  email: string
  phone: string | null
  birth_date: string
  voice_group: string
  voice_type: string | null
  membership_type: string
  membership_status: string
  created_at: string
  emergency_contact: string | null
  emergency_phone: string | null
  is_on_leave: boolean
  leave_reason: string | null
}

type VoiceGroup = {
  id: string
  value: string
  display_name: string
}

type MembershipType = {
  id: string
  name: string
  display_name: string
}

type ColumnConfig = {
  key: keyof Member | 'age'
  label: string
  visible: boolean
  sortable: boolean
  width?: string
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Navn', visible: true, sortable: true },
  { key: 'email', label: 'E-post', visible: true, sortable: true },
  { key: 'phone', label: 'Telefon', visible: true, sortable: false },
  { key: 'age', label: 'Alder', visible: true, sortable: true, width: '80px' },
  { key: 'voice_group', label: 'Stemmegruppe', visible: true, sortable: true },
  { key: 'voice_type', label: 'Stemmetype', visible: false, sortable: true },
  { key: 'membership_type', label: 'Medlemstype', visible: true, sortable: true },
  { key: 'membership_status', label: 'Status', visible: true, sortable: true },
  { key: 'emergency_contact', label: 'Nødkontakt', visible: false, sortable: false },
  { key: 'emergency_phone', label: 'Nødtelefon', visible: false, sortable: false },
  { key: 'created_at', label: 'Medlem siden', visible: false, sortable: true },
]

type SortConfig = {
  key: keyof Member | 'age'
  direction: 'asc' | 'desc'
}

export default function MembersPage() {
  const searchParams = useSearchParams()
  const [showImportSuccess, setShowImportSuccess] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [voiceGroups, setVoiceGroups] = useState<VoiceGroup[]>([])
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVoiceGroup, setSelectedVoiceGroup] = useState<string>('all')
  const [selectedMembershipType, setSelectedMembershipType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showOnLeaveOnly, setShowOnLeaveOnly] = useState(false)
  
  // Column configuration
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  
  // Sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' })

  useEffect(() => {
    if (searchParams.get('imported') === 'true') {
      setShowImportSuccess(true)
      const timer = setTimeout(() => setShowImportSuccess(false), 5000)
      return () => clearTimeout(timer)
    }
    return
  }, [searchParams])

  const calculateAge = useCallback((birthDate: string): number => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch members data from API route
      const response = await fetch('/api/members/list')
      
      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Kunne ikke hente medlemmer')
        return
      }

      const data = await response.json()
      console.log('Fetched members data:', data.members.length, 'members found')
      console.log('Choir ID:', data.choirId)

      // Set the data from API response
      setMembers(data.members)
      setVoiceGroups(data.voiceGroups)
      setMembershipTypes(data.membershipTypes)

    } catch (err) {
      console.error('Error in fetchData:', err)
      setError('En feil oppstod ved henting av data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members.filter(member => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          member.name.toLowerCase().includes(searchLower) ||
          member.email.toLowerCase().includes(searchLower) ||
          (member.phone && member.phone.toLowerCase().includes(searchLower))
        if (!matchesSearch) return false
      }

      // Voice group filter
      if (selectedVoiceGroup !== 'all' && member.voice_group !== selectedVoiceGroup) {
        return false
      }

      // Membership type filter
      if (selectedMembershipType !== 'all' && member.membership_type !== selectedMembershipType) {
        return false
      }

      // Status filter
      if (selectedStatus !== 'all' && member.membership_status !== selectedStatus) {
        return false
      }

      // Leave filter
      if (showOnLeaveOnly && !member.is_on_leave) {
        return false
      }

      return true
    })

    // Sort
    filtered = filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortConfig.key === 'age') {
        aValue = calculateAge(a.birth_date)
        bValue = calculateAge(b.birth_date)
      } else {
        aValue = a[sortConfig.key]
        bValue = b[sortConfig.key]
      }

      if (aValue === null || aValue === undefined) aValue = ''
      if (bValue === null || bValue === undefined) bValue = ''

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })

    return filtered
  }, [members, searchTerm, selectedVoiceGroup, selectedMembershipType, selectedStatus, showOnLeaveOnly, sortConfig, calculateAge])

  const handleSort = (key: keyof Member | 'age') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const toggleColumnVisibility = (columnKey: keyof Member | 'age') => {
    setColumns(current => 
      current.map(col => 
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      )
    )
  }

  const visibleColumns = columns.filter(col => col.visible)

  const exportMembers = () => {
    const csvContent = [
      // Header
      visibleColumns.map(col => col.label).join(','),
      // Data rows
      ...filteredAndSortedMembers.map(member => 
        visibleColumns.map(col => {
          if (col.key === 'age') {
            return calculateAge(member.birth_date)
          }
          const value = member[col.key as keyof Member]
          return value ? `"${value}"` : ''
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `medlemmer_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Medlemmer</h1>
            <p className="text-muted-foreground mt-2">Administrer korets medlemmer</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>Henter medlemmer...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Medlemmer</h1>
            <p className="text-muted-foreground mt-2">Administrer korets medlemmer</p>
          </div>
        </div>
        <Alert>
          <AlertTitle>Feil ved henting av data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Medlemmer</h1>
          <p className="text-muted-foreground mt-2">
            {filteredAndSortedMembers.length} av {members.length} medlemmer
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowColumnSettings(!showColumnSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            Kolonner
          </Button>
          <Button variant="outline" onClick={exportMembers}>
            <Download className="h-4 w-4 mr-2" />
            Eksporter
          </Button>
          <Button asChild>
            <Link href="/dashboard/members/new">
              <Plus className="h-4 w-4 mr-2" />
              Nytt medlem
            </Link>
          </Button>
        </div>
      </div>

      {showImportSuccess && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Import fullført!</AlertTitle>
          <AlertDescription>
            Medlemmene har blitt importert til systemet. Du kan nå administrere dem herfra.
          </AlertDescription>
        </Alert>
      )}

      {/* Column Configuration Panel */}
      {showColumnSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Kolonneinnstillinger</CardTitle>
            <CardDescription>Velg hvilke kolonner som skal vises i tabellen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {columns.map(column => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleColumnVisibility(column.key)}
                    className="justify-start w-full"
                  >
                    {column.visible ? (
                      <Eye className="h-4 w-4 mr-2" />
                    ) : (
                      <EyeOff className="h-4 w-4 mr-2" />
                    )}
                    {column.label}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Medlemsoversikt</CardTitle>
          <CardDescription>
            Filtrer og søk i medlemslisten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Søk navn, e-post, telefon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedVoiceGroup} onValueChange={setSelectedVoiceGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Stemmegruppe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle stemmegrupper</SelectItem>
                {voiceGroups.map(group => (
                  <SelectItem key={group.id} value={group.display_name}>
                    {group.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMembershipType} onValueChange={setSelectedMembershipType}>
              <SelectTrigger>
                <SelectValue placeholder="Medlemstype" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle medlemstyper</SelectItem>
                {membershipTypes.map(type => (
                  <SelectItem key={type.id} value={type.display_name}>
                    {type.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="Aktiv">Aktiv</SelectItem>
                <SelectItem value="På permisjon">På permisjon</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant={showOnLeaveOnly ? "default" : "outline"}
              onClick={() => setShowOnLeaveOnly(!showOnLeaveOnly)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showOnLeaveOnly ? 'Vis alle' : 'Kun permisjon'}
            </Button>
          </div>

          {/* Members Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map(column => (
                    <TableHead 
                      key={column.key} 
                      className={`${column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''} ${column.width ? `w-[${column.width}]` : ''}`}
                      onClick={column.sortable ? () => handleSort(column.key) : undefined}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        {column.sortable && sortConfig.key === column.key && (
                          sortConfig.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-muted-foreground">
                      Ingen medlemmer funnet med gjeldende filtre
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedMembers.map(member => (
                    <TableRow key={member.id}>
                      {visibleColumns.map(column => (
                        <TableCell key={column.key}>
                          {column.key === 'age' ? (
                            calculateAge(member.birth_date)
                          ) : column.key === 'membership_status' ? (
                            <Badge variant={member.is_on_leave ? 'secondary' : 'default'}>
                              {member.membership_status}
                            </Badge>
                          ) : column.key === 'created_at' ? (
                            new Date(member.created_at).toLocaleDateString('nb-NO')
                          ) : (
                            member[column.key as keyof Member] || '-'
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}