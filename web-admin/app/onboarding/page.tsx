'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Music, Building, User, Settings, Upload, ArrowLeft, ArrowRight, Check, Search, Loader2 } from 'lucide-react'
import { getChoirOrganizationType } from '@/lib/services/brreg'

interface BrregData {
  name: string
  organizationNumber: string
  address?: {
    street: string
    postalCode: string
    city: string
  }
  organizationType?: string
}

type OnboardingStep = 
  | 'choir-name' 
  | 'choir-info' 
  | 'contact-person' 
  | 'voice-organization' 
  | 'billing' 
  | 'confirmation'

interface ChoirData {
  // Choir Info
  name: string
  vatNumber?: string
  foundedYear?: number
  rehearsalLocation: string
  description?: string
  organizationType: 'symphony' | 'opera' | 'independent'
  parentOrganization?: string
  logoFile?: File

  // Contact Person
  contactName: string
  contactEmail: string
  contactPhone?: string
  contactPassword: string
  contactBirthDate: string

  // Voice Organization
  voiceConfiguration: 'SATB' | 'SSAATTBB' | 'SMATBB'

  // Billing
  billingName: string
  billingAddress: string
  billingPostalCode: string
  billingCity: string
  billingEmail: string
}

const steps: { id: OnboardingStep; title: string; icon: any }[] = [
  { id: 'choir-name', title: 'Korets navn', icon: Search },
  { id: 'choir-info', title: 'Korets informasjon', icon: Building },
  { id: 'contact-person', title: 'Kontaktperson', icon: User },
  { id: 'voice-organization', title: 'Stemmeorganisering', icon: Music },
  { id: 'billing', title: 'Fakturainformasjon', icon: Settings },
  { id: 'confirmation', title: 'Bekreftelse', icon: Check },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('choir-name')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [brregData, setBrregData] = useState<BrregData | null>(null)
  const [searchCompleted, setSearchCompleted] = useState(false)
  const [data, setData] = useState<ChoirData>({
    name: '',
    rehearsalLocation: '',
    organizationType: 'independent',
    contactName: '',
    contactEmail: '',
    contactPassword: '',
    contactBirthDate: '',
    voiceConfiguration: 'SATB',
    billingName: '',
    billingAddress: '',
    billingPostalCode: '',
    billingCity: '',
    billingEmail: '',
  })

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const searchBrreg = async (name: string) => {
    if (!name.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch('/api/onboarding/lookup-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName: name.trim() })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // If data is an array (search results), take the first one
          const organization = Array.isArray(result.data) ? result.data[0] : result.data
          
          if (organization) {
            setBrregData(organization)
            // Pre-fill form data with BRREG information
            const detectedOrgType = getChoirOrganizationType(organization)
            setData(prev => ({
              ...prev,
              name: organization.name,
              vatNumber: organization.organizationNumber,
              organizationType: detectedOrgType,
              billingName: organization.name,
              billingAddress: organization.address?.street?.join(', ') || '',
              billingPostalCode: organization.address?.postalCode || '',
              billingCity: organization.address?.city || '',
              billingEmail: prev.billingEmail || prev.contactEmail // Keep existing if set
            }))
          } else {
            setBrregData(null)
            // Still set the name they searched for
            setData(prev => ({
              ...prev,
              name: name.trim()
            }))
          }
        } else {
          setBrregData(null)
          // Still set the name they searched for
          setData(prev => ({
            ...prev,
            name: name.trim()
          }))
        }
      }
    } catch (error) {
      console.error('Error searching BRREG:', error)
      setBrregData(null)
      setData(prev => ({
        ...prev,
        name: name.trim()
      }))
    }
    setIsSearching(false)
    setSearchCompleted(true)
  }

  const handleNameSearch = async () => {
    await searchBrreg(searchTerm)
    setCurrentStep('choir-info')
  }

  const updateData = (field: keyof ChoirData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id)
    }
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/onboarding/provision-choir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const result = await response.json()
        // After successful choir creation, sign in the user
        const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
        const supabase = createClientComponentClient()
        
        const { error } = await supabase.auth.signInWithPassword({
          email: data.contactEmail,
          password: data.contactPassword,
        })
        
        if (!error) {
          router.refresh()
          router.push('/dashboard')
        } else {
          // If auto-login fails, redirect to sign in page
          router.push('/auth/signin')
        }
      } else {
        const error = await response.json()
        console.error('Error provisioning choir:', error)
        alert('Det oppstod en feil under opprettelsen av koret. Prøv igjen.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Det oppstod en feil under opprettelsen av koret. Prøv igjen.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Music className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Choirdinated</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registrer ditt kor
          </h1>
          <p className="text-gray-600">
            Kom i gang med Choirdinated på 5 minutter
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = index < currentStepIndex
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-xs text-center ${
                    isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
              )
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStepIndex].title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 'choir-name' && (
              <ChoirNameStep 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSearch={handleNameSearch}
                isSearching={isSearching}
              />
            )}
            {currentStep === 'choir-info' && (
              <ChoirInfoStep 
                data={data} 
                updateData={updateData} 
                brregData={brregData}
                searchCompleted={searchCompleted}
              />
            )}
            {currentStep === 'contact-person' && (
              <ContactPersonStep data={data} updateData={updateData} />
            )}
            {currentStep === 'voice-organization' && (
              <VoiceOrganizationStep data={data} updateData={updateData} />
            )}
            {currentStep === 'billing' && (
              <BillingStep data={data} updateData={updateData} />
            )}
            {currentStep === 'confirmation' && (
              <ConfirmationStep data={data} />
            )}
          </CardContent>
          
          {/* Navigation */}
          <div className="flex justify-between p-6 pt-0">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
            </Button>
            
            {currentStep === 'choir-name' ? (
              <Button 
                onClick={handleNameSearch}
                disabled={!searchTerm.trim() || isSearching}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Søker...
                  </>
                ) : (
                  <>
                    Søk og fortsett
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            ) : currentStep === 'confirmation' ? (
              <Button onClick={handleSubmit}>
                Opprett kor
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Neste
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function ChoirNameStep({ 
  searchTerm, 
  setSearchTerm, 
  onSearch, 
  isSearching 
}: { 
  searchTerm: string
  setSearchTerm: (value: string) => void
  onSearch: () => void
  isSearching: boolean
}) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim() && !isSearching) {
      onSearch()
    }
  }

  return (
    <>
      <div className="text-center mb-6">
        <Search className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          La oss starte med korets navn
        </h3>
        <p className="text-gray-600">
          Vi søker automatisk i Brønnøysundregistrene for å finne organisasjonsinformasjon.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="choir-name">Korets navn</Label>
        <Input
          id="choir-name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="F.eks. Oslo Filharmoniske Kor"
          className="text-lg py-3"
          disabled={isSearching}
        />
        <p className="text-sm text-gray-500">
          Skriv inn korets fulle navn for best søkeresultat.
        </p>
      </div>
    </>
  )
}

function ChoirInfoStep({ 
  data, 
  updateData, 
  brregData, 
  searchCompleted 
}: { 
  data: ChoirData
  updateData: (field: keyof ChoirData, value: any) => void
  brregData: BrregData | null
  searchCompleted: boolean
}) {
  return (
    <>
      {searchCompleted && brregData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <Check className="h-5 w-5 text-green-600 mr-2" />
            <h4 className="font-semibold text-green-800">Funnet i Brønnøysundregistrene!</h4>
          </div>
          <p className="text-green-700 text-sm">
            Vi har hentet organisasjonsinformasjon og fylt ut feltene nedenfor. 
            Du kan endre informasjonen hvis nødvendig.
          </p>
        </div>
      )}

      {searchCompleted && !brregData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <Search className="h-5 w-5 text-blue-600 mr-2" />
            <h4 className="font-semibold text-blue-800">Ikke funnet i registrene</h4>
          </div>
          <p className="text-blue-700 text-sm">
            Vi fant ikke organisasjonen i Brønnøysundregistrene. 
            Fyll ut informasjonen manuelt nedenfor.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Korets navn *</Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => updateData('name', e.target.value)}
          placeholder="F.eks. Oslo Filharmoniske Kor"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vatNumber">Organisasjonsnummer {brregData && '(fra BRREG)'}</Label>
        <Input
          id="vatNumber"
          value={data.vatNumber || ''}
          onChange={(e) => updateData('vatNumber', e.target.value)}
          placeholder="123 456 789"
        />
        {!brregData && (
          <p className="text-sm text-gray-500">
            Valgfritt. Brukes for automatisk fakturering og integrasjoner.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizationType">Type organisasjon</Label>
        <Select value={data.organizationType} onValueChange={(value) => updateData('organizationType', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Velg organisasjonstype" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="symphony">Tilknyttet symfoniorkester</SelectItem>
            <SelectItem value="opera">Tilknyttet opera</SelectItem>
            <SelectItem value="independent">Selvstendig kor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(data.organizationType === 'symphony' || data.organizationType === 'opera') && (
        <div className="space-y-2">
          <Label htmlFor="parentOrganization">Navn på moderorganisasjon</Label>
          <Input
            id="parentOrganization"
            value={data.parentOrganization || ''}
            onChange={(e) => updateData('parentOrganization', e.target.value)}
            placeholder="F.eks. Oslo Filharmonien"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="foundedYear">Grunnlagt år (valgfritt)</Label>
        <Input
          id="foundedYear"
          type="number"
          value={data.foundedYear || ''}
          onChange={(e) => updateData('foundedYear', parseInt(e.target.value) || undefined)}
          placeholder="1990"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rehearsalLocation">Øvelseslokale *</Label>
        <Input
          id="rehearsalLocation"
          value={data.rehearsalLocation}
          onChange={(e) => updateData('rehearsalLocation', e.target.value)}
          placeholder="Adresse til hovedøvelseslokalet"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
        <Textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => updateData('description', e.target.value)}
          placeholder="Kort beskrivelse av koret..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo">Logo (valgfritt)</Label>
        <Input
          id="logo"
          type="file"
          accept="image/*"
          onChange={(e) => updateData('logoFile', e.target.files?.[0])}
        />
        <p className="text-sm text-gray-500">
          Logoer brukes i appen og på utskrifter. Maks 5MB.
        </p>
      </div>
    </>
  )
}

function ContactPersonStep({ data, updateData }: { data: ChoirData, updateData: (field: keyof ChoirData, value: any) => void }) {
  return (
    <>
      <p className="text-gray-600 mb-4">
        Denne personen blir hovedadministrator for koret og får tilgang til alle administrative funksjoner.
      </p>

      <div className="space-y-2">
        <Label htmlFor="contactName">Fullt navn *</Label>
        <Input
          id="contactName"
          value={data.contactName}
          onChange={(e) => updateData('contactName', e.target.value)}
          placeholder="Ola Nordmann"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactEmail">E-postadresse *</Label>
        <Input
          id="contactEmail"
          type="email"
          value={data.contactEmail}
          onChange={(e) => updateData('contactEmail', e.target.value)}
          placeholder="ola@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactBirthDate">Fødselsdato *</Label>
        <Input
          id="contactBirthDate"
          type="date"
          value={data.contactBirthDate}
          onChange={(e) => updateData('contactBirthDate', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPhone">Telefonnummer (valgfritt)</Label>
        <Input
          id="contactPhone"
          type="tel"
          value={data.contactPhone || ''}
          onChange={(e) => updateData('contactPhone', e.target.value)}
          placeholder="+47 123 45 678"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPassword">Passord *</Label>
        <Input
          id="contactPassword"
          type="password"
          value={data.contactPassword}
          onChange={(e) => updateData('contactPassword', e.target.value)}
          placeholder="Minimum 8 tegn"
        />
        <p className="text-sm text-gray-500">
          Passordet må være minst 8 tegn langt og inneholde både bokstaver og tall.
        </p>
      </div>
    </>
  )
}

function VoiceOrganizationStep({ data, updateData }: { data: ChoirData, updateData: (field: keyof ChoirData, value: any) => void }) {
  return (
    <>
      <p className="text-gray-600 mb-4">
        Velg stemmeorganisering som passer best for ditt kor. Dette kan endres senere i innstillingene.
      </p>

      <div className="space-y-4">
        <Card 
          className={`cursor-pointer border-2 ${data.voiceConfiguration === 'SATB' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
          onClick={() => updateData('voiceConfiguration', 'SATB')}
        >
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2">SATB - Tradisjonell</h3>
            <p className="text-gray-600 mb-3">
              Standard firepart kororganisering. Ideell for de fleste kor.
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="bg-blue-100 px-2 py-1 rounded">Sopran</span>
              <span className="bg-green-100 px-2 py-1 rounded">Alt</span>
              <span className="bg-orange-100 px-2 py-1 rounded">Tenor</span>
              <span className="bg-red-100 px-2 py-1 rounded">Bass</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer border-2 ${data.voiceConfiguration === 'SSAATTBB' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
          onClick={() => updateData('voiceConfiguration', 'SSAATTBB')}
        >
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2">SSAATTBB - Symfonisk</h3>
            <p className="text-gray-600 mb-3">
              Åttepart kororganisering med 1. og 2. stemmer. For store symfoniske kor.
            </p>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <span className="bg-blue-100 px-2 py-1 rounded">1. Sopran</span>
              <span className="bg-blue-200 px-2 py-1 rounded">2. Sopran</span>
              <span className="bg-green-100 px-2 py-1 rounded">1. Alt</span>
              <span className="bg-green-200 px-2 py-1 rounded">2. Alt</span>
              <span className="bg-orange-100 px-2 py-1 rounded">1. Tenor</span>
              <span className="bg-orange-200 px-2 py-1 rounded">2. Tenor</span>
              <span className="bg-red-100 px-2 py-1 rounded">1. Bass</span>
              <span className="bg-red-200 px-2 py-1 rounded">2. Bass</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer border-2 ${data.voiceConfiguration === 'SMATBB' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
          onClick={() => updateData('voiceConfiguration', 'SMATBB')}
        >
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2">SMATBB - Operatisk</h3>
            <p className="text-gray-600 mb-3">
              Sekspart kororganisering med mezzosopran og baryton. For operakor.
            </p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="bg-blue-100 px-2 py-1 rounded">Sopran</span>
              <span className="bg-purple-100 px-2 py-1 rounded">Mezzosopran</span>
              <span className="bg-green-100 px-2 py-1 rounded">Alt</span>
              <span className="bg-orange-100 px-2 py-1 rounded">Tenor</span>
              <span className="bg-yellow-100 px-2 py-1 rounded">Baryton</span>
              <span className="bg-red-100 px-2 py-1 rounded">Bass</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function BillingStep({ data, updateData }: { data: ChoirData, updateData: (field: keyof ChoirData, value: any) => void }) {
  return (
    <>
      <p className="text-gray-600 mb-4">
        Fakturainformasjon for månedlig betaling på 500 kr. Du får 30 dager gratis prøveperiode.
      </p>

      <div className="space-y-2">
        <Label htmlFor="billingName">Organisasjonsnavn *</Label>
        <Input
          id="billingName"
          value={data.billingName}
          onChange={(e) => updateData('billingName', e.target.value)}
          placeholder="Navn som skal stå på fakturaen"
        />
        {data.billingName && data.name && data.billingName === data.name && (
          <p className="text-sm text-green-600">
            ✓ Bruker korets navn fra BRREG
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="billingAddress">Fakturaadresse *</Label>
        <Input
          id="billingAddress"
          value={data.billingAddress}
          onChange={(e) => updateData('billingAddress', e.target.value)}
          placeholder="Gateadresse"
        />
        {data.billingAddress && data.vatNumber && (
          <p className="text-sm text-green-600">
            ✓ Hentet fra BRREG
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="billingPostalCode">Postnummer *</Label>
          <Input
            id="billingPostalCode"
            value={data.billingPostalCode}
            onChange={(e) => updateData('billingPostalCode', e.target.value)}
            placeholder="0123"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billingCity">Poststed *</Label>
          <Input
            id="billingCity"
            value={data.billingCity}
            onChange={(e) => updateData('billingCity', e.target.value)}
            placeholder="Oslo"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="billingEmail">E-post for fakturaer *</Label>
        <Input
          id="billingEmail"
          type="email"
          value={data.billingEmail}
          onChange={(e) => updateData('billingEmail', e.target.value)}
          placeholder="faktura@example.com"
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Prøveperiode og betaling</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 30 dager gratis prøveperiode</li>
          <li>• 500 kr per måned etter prøveperioden</li>
          <li>• Fakturaer sendes månedlig på e-post</li>
          <li>• Avbryt når som helst uten bindingstid</li>
        </ul>
      </div>
    </>
  )
}

function ConfirmationStep({ data }: { data: ChoirData }) {
  return (
    <>
      <div className="text-center mb-6">
        <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Klar til å opprette ditt kor!
        </h3>
        <p className="text-gray-600">
          Sjekk at informasjonen er riktig før du fortsetter.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Korinformasjon</h4>
          <p><strong>Navn:</strong> {data.name}</p>
          {data.vatNumber && <p><strong>Org.nr:</strong> {data.vatNumber}</p>}
          <p><strong>Type:</strong> {
            data.organizationType === 'symphony' ? 'Tilknyttet symfoniorkester' :
            data.organizationType === 'opera' ? 'Tilknyttet opera' :
            'Selvstendig kor'
          }</p>
          <p><strong>Øvelseslokale:</strong> {data.rehearsalLocation}</p>
          <p><strong>Stemmeorganisering:</strong> {data.voiceConfiguration}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Administrator</h4>
          <p><strong>Navn:</strong> {data.contactName}</p>
          <p><strong>E-post:</strong> {data.contactEmail}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Fakturering</h4>
          <p><strong>Organisasjon:</strong> {data.billingName}</p>
          <p><strong>Adresse:</strong> {data.billingAddress}, {data.billingPostalCode} {data.billingCity}</p>
          <p><strong>Fakturaadresse:</strong> {data.billingEmail}</p>
        </div>
      </div>
    </>
  )
}