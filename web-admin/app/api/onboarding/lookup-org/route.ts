import { NextResponse } from 'next/server'
import { brregService } from '@/lib/services/brreg'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orgNumber, orgName } = body

    if (!orgNumber && !orgName) {
      return NextResponse.json(
        { error: 'Either organization number or name is required' },
        { status: 400 }
      )
    }

    let organizationInfo

    if (orgNumber) {
      // Validate organization number format
      if (!brregService.validateOrganizationNumber(orgNumber)) {
        return NextResponse.json(
          { error: 'Invalid organization number format' },
          { status: 400 }
        )
      }

      // Lookup organization by number
      organizationInfo = await brregService.lookupByOrganizationNumber(orgNumber)
    } else if (orgName) {
      // Search organizations by name
      const searchResults = await brregService.searchByName(orgName)
      
      if (searchResults && searchResults.length > 0) {
        return NextResponse.json({
          success: true,
          data: searchResults
        })
      }
    }

    if (!organizationInfo && !orgName) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: organizationInfo
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to lookup organization' },
      { status: 500 }
    )
  }
}