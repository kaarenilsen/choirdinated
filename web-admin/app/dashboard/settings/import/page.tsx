'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileSpreadsheet, AlertCircle, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { parseCSV, parseExcel } from '@/lib/import/parsers'
import { FieldMapping } from '@/components/import/FieldMapping'
import { ImportSummary } from '@/components/import/ImportSummary'
import { cn } from '@/lib/utils'

type SourceSystem = 'styreportalen' | 'choirmate' | 'generic'

interface ImportStep {
  id: number
  title: string
  description: string
}

const steps: ImportStep[] = [
  { id: 1, title: 'Last opp fil', description: 'Velg kildesystem og last opp medlemsfil' },
  { id: 2, title: 'Feltmapping', description: 'Koble feltene fra kildesystemet til Choirdinated' },
  { id: 3, title: 'Bekreft import', description: 'Se gjennom endringene før import' }
]

export default function ImportMembersPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [sourceSystem, setSourceSystem] = useState<SourceSystem | ''>('')
  const [file, setFile] = useState<File | null>(null)
  const [fileData, setFileData] = useState<any[]>([])
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({})
  const [valueMappings, setValueMappings] = useState<Record<string, Record<string, string>>>({})
  const [importSummary, setImportSummary] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile || !sourceSystem) return

    setFile(uploadedFile)
    setIsProcessing(true)

    try {
      let data: any[]
      if (uploadedFile.name.endsWith('.csv')) {
        data = await parseCSV(uploadedFile)
      } else if (uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls')) {
        data = await parseExcel(uploadedFile)
      } else {
        throw new Error('Filformat ikke støttet')
      }

      setFileData(data)
      
      // Auto-detect field mappings based on source system
      const mappings = getDefaultMappings(sourceSystem, data[0] ? Object.keys(data[0]) : [])
      setFieldMappings(mappings)
      
      // Move to next step
      setCurrentStep(2)
    } catch (error) {
      console.error('Error parsing file:', error)
      alert('Kunne ikke lese filen. Vennligst sjekk at formatet er riktig.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getDefaultMappings = (system: SourceSystem, headers: string[]): Record<string, string> => {
    if (system === 'styreportalen') {
      return {
        firstName: 'Fornavn',
        lastName: 'Etternavn',
        email: 'E-post',
        phone: 'Mobil',
        birthDate: 'Fødselsdato',
        voiceGroup: 'Avdeling', // Changed from 'Gruppe' to 'Avdeling' for Styreportalen
        voiceType: 'Gruppe', // Changed from 'Sekundærgruppe' to 'Gruppe' for Styreportalen
        membershipType: 'Medlemskapstype',
        status: 'Status',
        registrationDate: 'Registreringsdato',
        address: 'Adresse',
        postalCode: 'Postnummer',
        city: 'Sted',
        emergencyContact: 'Pårørende navn og telefonnr'
      }
    } else if (system === 'choirmate') {
      // Add Choirmate mappings based on actual Excel structure
      return {
        firstName: 'Fornavn',
        lastName: 'Etternavn',
        email: 'Epost',
        phone: 'Telefon',
        birthDate: 'Fødselsdato',
        voiceGroup: 'Stemmegruppering',
        membershipType: 'Medlemstype'
      }
    } else {
      // Generic mapping - try to auto-detect common field names
      const mapping: Record<string, string> = {}
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase()
        if (lowerHeader.includes('fornavn') || lowerHeader.includes('first')) {
          mapping.firstName = header
        } else if (lowerHeader.includes('etternavn') || lowerHeader.includes('last')) {
          mapping.lastName = header
        } else if (lowerHeader.includes('e-post') || lowerHeader.includes('email')) {
          mapping.email = header
        } else if (lowerHeader.includes('telefon') || lowerHeader.includes('mobil') || lowerHeader.includes('phone')) {
          mapping.phone = header
        }
      })
      return mapping
    }
  }

  const handleMappingUpdate = (newMappings: Record<string, string>, newValueMappings: Record<string, Record<string, string>>) => {
    setFieldMappings(newMappings)
    setValueMappings(newValueMappings)
  }

  const prepareImportSummary = async () => {
    setIsProcessing(true)
    
    // Analyze unique values that might need to be created
    const voiceGroups = new Set(fileData.map(row => row[fieldMappings.voiceGroup!]).filter(Boolean))
    const voiceTypes = new Set(fileData.map(row => row[fieldMappings.voiceType!]).filter(Boolean))
    const membershipTypes = new Set(fileData.map(row => row[fieldMappings.membershipType!]).filter(Boolean))

    // Analyze the data and prepare summary
    const summary = {
      totalMembers: fileData.length,
      newMembers: fileData.length, // In reality, check against existing members
      updatedMembers: 0,
      newVoiceGroups: Array.from(voiceGroups),
      newVoiceTypes: Array.from(voiceTypes),
      newMembershipTypes: Array.from(membershipTypes),
      configChanges: [] as any[],
      mappedData: fileData.map(row => {
        const mapped: any = {}
        const unmappedFields: any = {}
        
        // First, map the known fields
        Object.entries(fieldMappings).forEach(([targetField, sourceField]) => {
          let value = row[sourceField]
          // Apply value mappings if they exist
          if (valueMappings[targetField] && valueMappings[targetField][value]) {
            const mappedValue = valueMappings[targetField][value]
            // Only apply the mapping if it's not "same" (which means use original value)
            if (mappedValue !== 'same') {
              value = mappedValue
            }
          }
          mapped[targetField] = value
        })
        
        // Then, collect all unmapped fields
        const mappedSourceFields = new Set(Object.values(fieldMappings))
        Object.entries(row).forEach(([sourceField, value]) => {
          if (!mappedSourceFields.has(sourceField)) {
            unmappedFields[sourceField] = value
          }
        })
        
        // Include unmapped fields in a special property
        if (Object.keys(unmappedFields).length > 0) {
          mapped._unmappedFields = unmappedFields
        }
        
        return mapped
      })
    }

    setImportSummary(summary)
    setCurrentStep(3)
    setIsProcessing(false)
  }

  const handleImport = async () => {
    setIsProcessing(true)
    
    try {
      // Call API to import members
      const response = await fetch('/api/members/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSystem,
          fieldMappings,
          valueMappings,
          data: importSummary.mappedData
        })
      })

      if (!response.ok) throw new Error('Import failed')

      // Mark import task as complete
      const todos = JSON.parse(localStorage.getItem('onboarding-todos') || '[]')
      const updatedTodos = todos.map((todo: any) =>
        todo.id === 'import-members' ? { ...todo, completed: true } : todo
      )
      localStorage.setItem('onboarding-todos', JSON.stringify(updatedTodos))

      router.push('/dashboard/members?imported=true')
    } catch (error) {
      console.error('Import error:', error)
      alert('Det oppstod en feil under import. Vennligst prøv igjen.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importer medlemmer</h1>
        <p className="text-muted-foreground mt-2">
          Overfør medlemmer fra ditt tidligere korsystem til Choirdinated
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
                  currentStep > step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
              </div>
              <div className="text-center mt-2">
                <p className={cn(
                  "text-sm font-medium",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4 mt-5",
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Last opp medlemsfil</CardTitle>
            <CardDescription>
              Velg hvilket system medlemmene kommer fra og last opp filen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="source-system">Kildesystem</Label>
              <Select value={sourceSystem} onValueChange={(value) => setSourceSystem(value as SourceSystem)}>
                <SelectTrigger id="source-system">
                  <SelectValue placeholder="Velg kildesystem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="styreportalen">Styreportalen</SelectItem>
                  <SelectItem value="choirmate">Choirmate</SelectItem>
                  <SelectItem value="generic">Generisk CSV/Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sourceSystem && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Filformat for {sourceSystem === 'styreportalen' ? 'Styreportalen' : sourceSystem === 'choirmate' ? 'Choirmate' : 'generisk import'}:</p>
                      <ul className="mt-1 space-y-1 text-muted-foreground">
                        {sourceSystem === 'styreportalen' && (
                          <>
                            <li>• CSV-fil eksportert fra Styreportalen</li>
                            <li>• Må inneholde: Fornavn, Etternavn, E-post, Avdeling</li>
                            <li>• Avdeling blir stemmegruppe, Gruppe blir stemmetype</li>
                            <li>• Alle ukjente felt blir lagret for fremtidig bruk</li>
                          </>
                        )}
                        {sourceSystem === 'choirmate' && (
                          <>
                            <li>• Excel-fil (.xlsx) eksportert fra Choirmate</li>
                            <li>• Må inneholde: Fornavn, Etternavn, Epost, Stemmegruppering</li>
                          </>
                        )}
                        {sourceSystem === 'generic' && (
                          <>
                            <li>• CSV eller Excel-fil med medlemsdata</li>
                            <li>• Du kan mappe feltene manuelt i neste steg</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-upload">Velg fil</Label>
                  <div className="flex items-center gap-4">
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={isProcessing}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {file ? file.name : 'Velg fil'}
                    </Button>
                    {file && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <FieldMapping
          sourceData={fileData}
          fieldMappings={fieldMappings}
          valueMappings={valueMappings}
          onUpdate={handleMappingUpdate}
          sourceSystem={sourceSystem as SourceSystem}
        />
      )}

      {currentStep === 3 && importSummary && (
        <ImportSummary
          summary={importSummary}
          onConfirm={handleImport}
          onCancel={() => setCurrentStep(2)}
          isProcessing={isProcessing}
        />
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 1 || isProcessing}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Tilbake
        </Button>

        {currentStep < 3 && (
          <Button
            onClick={() => {
              if (currentStep === 2) {
                prepareImportSummary()
              }
            }}
            disabled={
              (currentStep === 1 && (!file || !sourceSystem)) ||
              (currentStep === 2 && Object.keys(fieldMappings).length === 0) ||
              isProcessing
            }
          >
            Neste
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}