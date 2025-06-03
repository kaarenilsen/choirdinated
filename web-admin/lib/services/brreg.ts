// Norwegian Business Registry (Brønnøysundregistrene) API integration
// API Documentation: https://data.brreg.no/enhetsregisteret/api/dokumentasjon/en/index.html

interface BrregEntity {
  organisasjonsnummer: string
  navn: string
  organisasjonsform: {
    kode: string
    beskrivelse: string
  }
  hjemmeside?: string
  postadresse?: {
    adresse?: string[]
    postnummer?: string
    poststed?: string
    kommunenummer?: string
    kommune?: string
    landkode?: string
    land?: string
  }
  forretningsadresse?: {
    adresse?: string[]
    postnummer?: string
    poststed?: string
    kommunenummer?: string
    kommune?: string
    landkode?: string
    land?: string
  }
  stiftelsesdato?: string
  registreringsdatoEnhetsregisteret?: string
  registrertIMvaregisteret?: boolean
  naeringskode1?: {
    beskrivelse: string
    kode: string
  }
  antallAnsatte?: number
  konkurs?: boolean
  underAvvikling?: boolean
  underTvangsavviklingEllerTvangsopplosning?: boolean
}

interface BrregResponse {
  _embedded?: {
    enheter: BrregEntity[]
  }
  _links: {
    self: {
      href: string
    }
    next?: {
      href: string
    }
    prev?: {
      href: string
    }
  }
  page: {
    size: number
    totalElements: number
    totalPages: number
    number: number
  }
}

export interface OrganizationInfo {
  organizationNumber: string
  name: string
  organizationType: string
  organizationTypeCode: string
  website?: string
  address?: {
    street?: string[]
    postalCode?: string
    city?: string
    municipality?: string
  }
  businessAddress?: {
    street?: string[]
    postalCode?: string
    city?: string
    municipality?: string
  }
  foundingDate?: string
  registrationDate?: string
  isVATRegistered?: boolean
  primaryIndustry?: {
    code: string
    description: string
  }
  employees?: number
  isBankrupt?: boolean
  isUnderLiquidation?: boolean
}

class BrregService {
  private baseUrl = 'https://data.brreg.no/enhetsregisteret/api/enheter'

  /**
   * Lookup organization by organization number (organisasjonsnummer)
   * @param orgNumber - 9-digit Norwegian organization number
   * @returns Organization information or null if not found
   */
  async lookupByOrganizationNumber(orgNumber: string): Promise<OrganizationInfo | null> {
    try {
      // Clean and validate organization number
      const cleanOrgNumber = orgNumber.replace(/\s+/g, '')
      
      if (!/^\d{9}$/.test(cleanOrgNumber)) {
        throw new Error('Organization number must be exactly 9 digits')
      }

      const response = await fetch(`${this.baseUrl}/${cleanOrgNumber}`)
      
      if (response.status === 404) {
        return null // Organization not found
      }

      if (!response.ok) {
        throw new Error(`Brreg API error: ${response.status} ${response.statusText}`)
      }

      const entity: BrregEntity = await response.json()
      return this.mapEntityToOrganizationInfo(entity)

    } catch (error) {
      console.error('Error looking up organization:', error)
      throw error
    }
  }

  /**
   * Search organizations by name
   * @param name - Organization name to search for
   * @param limit - Maximum number of results (default: 10)
   * @returns Array of organization information
   */
  async searchByName(name: string, limit: number = 10): Promise<OrganizationInfo[]> {
    try {
      if (!name || name.trim().length < 2) {
        throw new Error('Search name must be at least 2 characters')
      }

      const params = new URLSearchParams({
        navn: name.trim(),
        size: limit.toString()
      })

      const response = await fetch(`${this.baseUrl}?${params}`)

      if (!response.ok) {
        throw new Error(`Brreg API error: ${response.status} ${response.statusText}`)
      }

      const data: BrregResponse = await response.json()
      
      if (!data._embedded?.enheter) {
        return []
      }

      return data._embedded.enheter.map(entity => this.mapEntityToOrganizationInfo(entity))

    } catch (error) {
      console.error('Error searching organizations:', error)
      throw error
    }
  }

  /**
   * Validate Norwegian organization number using modulo 11 algorithm
   * @param orgNumber - Organization number to validate
   * @returns true if valid, false otherwise
   */
  validateOrganizationNumber(orgNumber: string): boolean {
    const cleanOrgNumber = orgNumber.replace(/\s+/g, '')
    
    if (!/^\d{9}$/.test(cleanOrgNumber)) {
      return false
    }

    // Modulo 11 validation for Norwegian organization numbers
    const digits = cleanOrgNumber.split('').map(Number)
    const weights = [3, 2, 7, 6, 5, 4, 3, 2]
    
    let sum = 0
    for (let i = 0; i < 8; i++) {
      sum += digits[i] * weights[i]
    }
    
    const remainder = sum % 11
    let checkDigit = 11 - remainder
    
    if (checkDigit === 11) {
      checkDigit = 0
    } else if (checkDigit === 10) {
      return false // Invalid organization number
    }
    
    return checkDigit === digits[8]
  }

  /**
   * Format organization number with spaces for display
   * @param orgNumber - Raw organization number
   * @returns Formatted organization number (e.g., "123 456 789")
   */
  formatOrganizationNumber(orgNumber: string): string {
    const cleanOrgNumber = orgNumber.replace(/\s+/g, '')
    if (cleanOrgNumber.length === 9) {
      return `${cleanOrgNumber.slice(0, 3)} ${cleanOrgNumber.slice(3, 6)} ${cleanOrgNumber.slice(6, 9)}`
    }
    return orgNumber
  }

  private mapEntityToOrganizationInfo(entity: BrregEntity): OrganizationInfo {
    return {
      organizationNumber: entity.organisasjonsnummer,
      name: entity.navn,
      organizationType: entity.organisasjonsform.beskrivelse,
      organizationTypeCode: entity.organisasjonsform.kode,
      website: entity.hjemmeside,
      address: entity.postadresse ? {
        street: entity.postadresse.adresse,
        postalCode: entity.postadresse.postnummer,
        city: entity.postadresse.poststed,
        municipality: entity.postadresse.kommune
      } : undefined,
      businessAddress: entity.forretningsadresse ? {
        street: entity.forretningsadresse.adresse,
        postalCode: entity.forretningsadresse.postnummer,
        city: entity.forretningsadresse.poststed,
        municipality: entity.forretningsadresse.kommune
      } : undefined,
      foundingDate: entity.stiftelsesdato,
      registrationDate: entity.registreringsdatoEnhetsregisteret,
      isVATRegistered: entity.registrertIMvaregisteret,
      primaryIndustry: entity.naeringskode1 ? {
        code: entity.naeringskode1.kode,
        description: entity.naeringskode1.beskrivelse
      } : undefined,
      employees: entity.antallAnsatte,
      isBankrupt: entity.konkurs,
      isUnderLiquidation: entity.underAvvikling || entity.underTvangsavviklingEllerTvangsopplosning
    }
  }
}

export const brregService = new BrregService()

// Utility function to determine organization type for choir onboarding
export function getChoirOrganizationType(brregData: OrganizationInfo): 'symphony' | 'opera' | 'independent' {
  const orgType = brregData.organizationType.toLowerCase()
  const orgName = brregData.name.toLowerCase()
  const industry = brregData.primaryIndustry?.description.toLowerCase() || ''

  // Check for symphony/orchestra keywords
  if (orgName.includes('symfoni') || orgName.includes('orkester') || 
      orgName.includes('filharmon') || industry.includes('orkester')) {
    return 'symphony'
  }

  // Check for opera keywords
  if (orgName.includes('opera') || industry.includes('opera')) {
    return 'opera'
  }

  // Default to independent for other types
  return 'independent'
}