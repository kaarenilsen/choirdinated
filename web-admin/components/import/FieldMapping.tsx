'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowRight, AlertCircle, Sparkles, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldMappingProps {
  sourceData: any[]
  fieldMappings: Record<string, string>
  valueMappings: Record<string, Record<string, string>>
  onUpdate: (fieldMappings: Record<string, string>, valueMappings: Record<string, Record<string, string>>) => void
  sourceSystem: 'styreportalen' | 'choirmate' | 'generic'
}

const targetFields = [
  { key: 'firstName', label: 'Fornavn', required: true },
  { key: 'lastName', label: 'Etternavn', required: true },
  { key: 'email', label: 'E-post', required: true },
  { key: 'phone', label: 'Telefon', required: false },
  { key: 'birthDate', label: 'Fødselsdato', required: true },
  { key: 'voiceGroup', label: 'Stemmegruppe', required: true },
  { key: 'voiceType', label: 'Stemmetype', required: false },
  { key: 'membershipType', label: 'Medlemskapstype', required: true },
  { key: 'address', label: 'Adresse', required: false },
  { key: 'postalCode', label: 'Postnummer', required: false },
  { key: 'city', label: 'Sted', required: false },
  { key: 'emergencyContact', label: 'Kontaktperson', required: false },
  { key: 'emergencyPhone', label: 'Kontaktperson telefon', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'registrationDate', label: 'Registreringsdato', required: false }
]

export function FieldMapping({ sourceData, fieldMappings, valueMappings, onUpdate, sourceSystem }: FieldMappingProps) {
  const [mappings, setMappings] = useState(fieldMappings)
  const [valueMap, setValueMap] = useState(valueMappings)
  const [showValueMapping, setShowValueMapping] = useState<string | null>(null)

  const sourceHeaders = sourceData.length > 0 ? Object.keys(sourceData[0]) : []

  // Get unique values for a field
  const getUniqueValues = (field: string): string[] => {
    const values = new Set<string>()
    sourceData.forEach(row => {
      if (row[field]) values.add(row[field])
    })
    return Array.from(values).sort()
  }

  const handleFieldChange = (targetField: string, sourceField: string) => {
    const newMappings = { ...mappings }
    if (sourceField === 'none') {
      delete newMappings[targetField]
    } else {
      newMappings[targetField] = sourceField
    }
    setMappings(newMappings)
    onUpdate(newMappings, valueMap)
  }

  const handleValueMapping = (targetField: string, sourceValue: string, targetValue: string) => {
    const newValueMap = { ...valueMap }
    if (!newValueMap[targetField]) {
      newValueMap[targetField] = {}
    }
    newValueMap[targetField][sourceValue] = targetValue
    setValueMap(newValueMap)
    onUpdate(mappings, newValueMap)
  }

  const autoDetectValueMappings = (field: string) => {
    const sourceField = mappings[field]
    if (!sourceField) return

    const uniqueValues = getUniqueValues(sourceField)
    const newValueMap = { ...valueMap, [field]: {} as Record<string, string> }

    // Auto-detect voice groups
    if (field === 'voiceGroup') {
      uniqueValues.forEach(value => {
        const lower = value.toLowerCase()
        if (lower.includes('sopran') || lower === '1. sopran' || lower === '2. sopran') {
          newValueMap[field][value] = 'Sopran'
        } else if (lower.includes('alt') || lower === '1. alt' || lower === '2. alt') {
          newValueMap[field][value] = 'Alt'
        } else if (lower.includes('tenor') || lower === '1. tenor' || lower === '2. tenor') {
          newValueMap[field][value] = 'Tenor'
        } else if (lower.includes('bass') || lower === '1. bass' || lower === '2. bass') {
          newValueMap[field][value] = 'Bass'
        }
      })
    }

    // Auto-detect membership types
    if (field === 'membershipType') {
      uniqueValues.forEach(value => {
        const lower = value.toLowerCase()
        if (lower.includes('fast') || lower === 'fast medlem') {
          newValueMap[field][value] = 'Fast medlem'
        } else if (lower.includes('prosjekt')) {
          newValueMap[field][value] = 'Prosjektsanger'
        } else if (lower.includes('permisjon')) {
          newValueMap[field][value] = 'Permisjon'
        }
      })
    }

    setValueMap(newValueMap)
    onUpdate(mappings, newValueMap)
  }

  const getSampleValues = (field: string): string[] => {
    const values: string[] = []
    for (let i = 0; i < Math.min(3, sourceData.length); i++) {
      if (sourceData[i][field]) {
        values.push(sourceData[i][field])
      }
    }
    return values
  }

  const requiredFieldsMapped = targetFields
    .filter(f => f.required)
    .every(f => mappings[f.key])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Koble feltene</CardTitle>
          <CardDescription>
            Koble feltene fra {sourceSystem === 'styreportalen' ? 'Styreportalen' : sourceSystem === 'choirmate' ? 'Choirmate' : 'din fil'} til Choirdinated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!requiredFieldsMapped && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900 dark:text-amber-100">Obligatoriske felt mangler</p>
                  <p className="text-amber-700 dark:text-amber-200">Alle obligatoriske felt må kobles før du kan fortsette.</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {targetFields.map(field => (
                <div key={field.key} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <Label className="flex items-center gap-2">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                      {mappings[field.key] && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </Label>
                  </div>
                  
                  <div className="col-span-1 flex justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="col-span-4">
                    <Select
                      value={mappings[field.key] || 'none'}
                      onValueChange={(value) => handleFieldChange(field.key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg felt" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ikke koble</SelectItem>
                        {sourceHeaders.map(header => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    {mappings[field.key] && ['voiceGroup', 'voiceType', 'membershipType'].includes(field.key) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowValueMapping(showValueMapping === field.key ? null : field.key)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Verdimapping
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Value Mapping Section */}
      {showValueMapping && mappings[showValueMapping] && (
        <Card>
          <CardHeader>
            <CardTitle>Verdimapping for {targetFields.find(f => f.key === showValueMapping)?.label}</CardTitle>
            <CardDescription>
              Koble verdiene fra kildesystemet til Choirdinated sine verdier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => autoDetectValueMappings(showValueMapping)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Auto-oppdag verdier
              </Button>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kildeverdi</TableHead>
                    <TableHead>Antall</TableHead>
                    <TableHead>Choirdinated-verdi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getUniqueValues(mappings[showValueMapping]).map(value => {
                    const count = sourceData.filter(row => row[mappings[showValueMapping]] === value).length
                    return (
                      <TableRow key={value}>
                        <TableCell>
                          <Badge variant="secondary">{value}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{count}</TableCell>
                        <TableCell>
                          <Select
                            value={valueMap[showValueMapping]?.[value] || 'same'}
                            onValueChange={(targetValue) => handleValueMapping(showValueMapping, value, targetValue)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="same">Bruk samme verdi</SelectItem>
                              {showValueMapping === 'voiceGroup' && (
                                <>
                                  <SelectItem value="Sopran">Sopran</SelectItem>
                                  <SelectItem value="Alt">Alt</SelectItem>
                                  <SelectItem value="Tenor">Tenor</SelectItem>
                                  <SelectItem value="Bass">Bass</SelectItem>
                                </>
                              )}
                              {showValueMapping === 'membershipType' && (
                                <>
                                  <SelectItem value="Fast medlem">Fast medlem</SelectItem>
                                  <SelectItem value="Prosjektsanger">Prosjektsanger</SelectItem>
                                  <SelectItem value="Permisjon">Permisjon</SelectItem>
                                  <SelectItem value="Æresmedlem">Æresmedlem</SelectItem>
                                </>
                              )}
                              {showValueMapping === 'voiceType' && (
                                <>
                                  <SelectItem value="1. Sopran">1. Sopran</SelectItem>
                                  <SelectItem value="2. Sopran">2. Sopran</SelectItem>
                                  <SelectItem value="1. Alt">1. Alt</SelectItem>
                                  <SelectItem value="2. Alt">2. Alt</SelectItem>
                                  <SelectItem value="1. Tenor">1. Tenor</SelectItem>
                                  <SelectItem value="2. Tenor">2. Tenor</SelectItem>
                                  <SelectItem value="1. Bass">1. Bass</SelectItem>
                                  <SelectItem value="2. Bass">2. Bass</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Forhåndsvisning</CardTitle>
          <CardDescription>
            Slik vil de første medlemmene se ut etter mapping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {targetFields.filter(f => mappings[f.key]).map(field => (
                    <TableHead key={field.key}>{field.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourceData.slice(0, 5).map((row, index) => (
                  <TableRow key={index}>
                    {targetFields.filter(f => mappings[f.key]).map(field => {
                      let value = row[mappings[field.key]]
                      if (valueMap[field.key]?.[value]) {
                        value = valueMap[field.key][value]
                      }
                      return (
                        <TableCell key={field.key}>
                          {value || '-'}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}