'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, Plus, Search, Filter, Download, Settings, ChevronUp, ChevronDown, Eye, EyeOff, GripVertical } from 'lucide-react'
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
  first_membership_date: string | null
  emergency_contact: string | null
  emergency_phone: string | null
  is_on_leave: boolean
  leave_reason: string | null
  is_active: boolean
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
  { key: 'created_at', label: 'Siste medlemsperiode startet', visible: false, sortable: true },
  { key: 'first_membership_date', label: 'Ble medlem første gang', visible: false, sortable: true },
]

type SortConfig = {
  key: keyof Member | 'age'
  direction: 'asc' | 'desc'
}

export default function MembersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
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
  const [showActiveOnly, setShowActiveOnly] = useState(true) // Default to show only active members
  const [showOnLeaveOnly, setShowOnLeaveOnly] = useState(false)
  
  // Column configuration
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    // Load saved column configuration from localStorage
    if (typeof window !== 'undefined') {
      try {
        const savedColumns = localStorage.getItem('memberTableColumns')
        // Check if we have a version mismatch (for schema changes like adding new columns)
        const currentVersion = '2024-02-activestatus' // Update this when schema changes
        const savedVersion = localStorage.getItem('memberTableColumnsVersion')
        
        if (savedVersion !== currentVersion) {
          // Clear old preferences when schema changes
          localStorage.removeItem('memberTableColumns')
          localStorage.setItem('memberTableColumnsVersion', currentVersion)
          return DEFAULT_COLUMNS
        }
        
        if (savedColumns) {
          const parsed = JSON.parse(savedColumns)
          // Validate that the parsed data has the correct structure
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].key) {
            // Merge saved columns with defaults to handle schema changes
            const mergedColumns = [...DEFAULT_COLUMNS]
            
            // Update visibility and order based on saved preferences
            const savedColumnKeys = parsed.map((col: ColumnConfig) => col.key)
            
            // First, update existing columns with saved preferences
            mergedColumns.forEach((col, index) => {
              const savedCol = parsed.find((saved: ColumnConfig) => saved.key === col.key)
              if (savedCol) {
                mergedColumns[index] = { ...col, visible: savedCol.visible }
              }
            })
            
            // Then, reorder based on saved order (only for columns that exist in both)
            const reorderedColumns: ColumnConfig[] = []
            
            // Add columns in saved order
            parsed.forEach((savedCol: ColumnConfig) => {
              const matchingCol = mergedColumns.find(col => col.key === savedCol.key)
              if (matchingCol) {
                reorderedColumns.push(matchingCol)
              }
            })
            
            // Add any new columns that weren't in saved preferences
            mergedColumns.forEach(col => {
              if (!savedColumnKeys.includes(col.key)) {
                reorderedColumns.push(col)
              }
            })
            
            return reorderedColumns
          }
        }
      } catch (error) {
        // If parsing fails, fall back to default
      }
    }
    return DEFAULT_COLUMNS
  })
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  
  // Drag state
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  
  // Sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    // Load saved sort configuration from localStorage
    if (typeof window !== 'undefined') {
      try {
        const savedSort = localStorage.getItem('memberTableSort')
        if (savedSort) {
          const parsed = JSON.parse(savedSort)
          if (parsed.key && parsed.direction) {
            return parsed
          }
        }
      } catch (error) {
        // If parsing fails, fall back to default
      }
    }
    return { key: 'name', direction: 'asc' }
  })

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
      // Data fetched successfully

      // Set the data from API response
      setMembers(data.members)
      setVoiceGroups(data.voiceGroups)
      setMembershipTypes(data.membershipTypes)

    } catch (err) {
      // Error handled in catch block
      setError('En feil oppstod ved henting av data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Load saved column order from localStorage on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem('memberTableColumns')
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns)
        // Merge with default columns to ensure new columns are included
        const mergedColumns = DEFAULT_COLUMNS.map(defaultCol => {
          const saved = parsed.find((col: ColumnConfig) => col.key === defaultCol.key)
          return saved || defaultCol
        })
        setColumns(mergedColumns)
      } catch {
        // If parsing fails, use default columns
      }
    }
  }, [])

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

      // Active/inactive filter
      if (showActiveOnly && !member.is_active) {
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
  }, [members, searchTerm, selectedVoiceGroup, selectedMembershipType, selectedStatus, showActiveOnly, showOnLeaveOnly, sortConfig, calculateAge])

  const handleSort = (key: keyof Member | 'age') => {
    setSortConfig(current => {
      const newSort = {
        key,
        direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
      } as SortConfig
      
      // Save to localStorage immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem('memberTableSort', JSON.stringify(newSort))
      }
      
      return newSort
    })
  }

  const toggleColumnVisibility = (columnKey: keyof Member | 'age') => {
    setColumns(current => {
      const updated = current.map(col => 
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      )
      // Save to localStorage immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem('memberTableColumns', JSON.stringify(updated))
      }
      return updated
    })
  }

  // Column preferences are now saved immediately when changed

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLTableCellElement>, columnKey: string) => {
    setDraggedColumn(columnKey)
    e.dataTransfer.effectAllowed = 'move'
    // Add a slight delay to distinguish between click and drag
    setTimeout(() => {
      if (draggedColumn === columnKey) {
        // This is actually a drag, not a click
      }
    }, 100)
  }

  const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (columnKey: string) => {
    setDragOverColumn(columnKey)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLTableCellElement>, targetColumnKey: string) => {
    e.preventDefault()
    
    if (!draggedColumn || draggedColumn === targetColumnKey) {
      setDraggedColumn(null)
      setDragOverColumn(null)
      return
    }

    const newColumns = [...columns]
    const draggedIndex = newColumns.findIndex(col => col.key === draggedColumn)
    const targetIndex = newColumns.findIndex(col => col.key === targetColumnKey)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedCol] = newColumns.splice(draggedIndex, 1)
      if (draggedCol) {
        newColumns.splice(targetIndex, 0, draggedCol)
        setColumns(newColumns)
        // Save to localStorage immediately after reordering
        if (typeof window !== 'undefined') {
          localStorage.setItem('memberTableColumns', JSON.stringify(newColumns))
        }
      }
    }

    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  const handleDragEnd = () => {
    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  const resetColumnOrder = () => {
    setColumns(DEFAULT_COLUMNS)
    setSortConfig({ key: 'name', direction: 'asc' })
    // Clear localStorage when resetting
    if (typeof window !== 'undefined') {
      localStorage.removeItem('memberTableColumns')
      localStorage.removeItem('memberTableSort')
    }
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
          if (col.key === 'created_at') {
            return `"${new Date(member.created_at).toLocaleDateString('nb-NO')}"`
          }
          if (col.key === 'first_membership_date') {
            return member.first_membership_date ? `"${new Date(member.first_membership_date).toLocaleDateString('nb-NO')}"` : ''
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
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Kolonneinnstillinger</CardTitle>
                <CardDescription>Velg hvilke kolonner som skal vises i tabellen. Du kan dra kolonnehodene for å endre rekkefølgen.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={resetColumnOrder}>
                Tilbakestill
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Kolonneinnstillinger lagres automatisk og huskes neste gang du besøker siden.
              </p>
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
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
                <SelectItem value="I permisjon">I permisjon</SelectItem>
                <SelectItem value="Sluttet">Sluttet</SelectItem>
              </SelectContent>
            </Select>

            <Select value={showActiveOnly ? "active" : "all"} onValueChange={(value) => setShowActiveOnly(value === "active")}>
              <SelectTrigger>
                <SelectValue placeholder="Medlemskap" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Kun aktive</SelectItem>
                <SelectItem value="all">Alle medlemmer</SelectItem>
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
                      className={`
                        ${column.sortable ? 'cursor-pointer hover:bg-muted/50' : 'cursor-grab'} 
                        ${column.width ? `w-[${column.width}]` : ''}
                        ${draggedColumn === column.key ? 'opacity-50 cursor-grabbing' : ''}
                        ${dragOverColumn === column.key ? 'bg-blue-50 border-blue-200' : ''}
                        transition-all duration-200
                      `}
                      onClick={column.sortable && !draggedColumn ? () => handleSort(column.key) : undefined}
                      draggable
                      onDragStart={(e) => handleDragStart(e, column.key)}
                      onDragOver={handleDragOver}
                      onDragEnter={() => handleDragEnter(column.key)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, column.key)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center space-x-1 group">
                        <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="select-none">{column.label}</span>
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
                    <TableRow 
                      key={member.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/members/${member.id}`)}
                    >
                      {visibleColumns.map(column => (
                        <TableCell key={column.key}>
                          {column.key === 'age' ? (
                            calculateAge(member.birth_date)
                          ) : column.key === 'membership_status' ? (
                            <Badge variant={
                              member.membership_status === 'Sluttet' ? 'destructive' :
                              member.membership_status === 'I permisjon' ? 'secondary' : 
                              'default'
                            }>
                              {member.membership_status}
                            </Badge>
                          ) : column.key === 'created_at' ? (
                            new Date(member.created_at).toLocaleDateString('nb-NO')
                          ) : column.key === 'first_membership_date' ? (
                            member.first_membership_date ? new Date(member.first_membership_date).toLocaleDateString('nb-NO') : '-'
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