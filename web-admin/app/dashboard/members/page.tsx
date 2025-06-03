'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, Plus, Search, Filter, Download } from 'lucide-react'
import Link from 'next/link'

export default function MembersPage() {
  const searchParams = useSearchParams()
  const [showImportSuccess, setShowImportSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get('imported') === 'true') {
      setShowImportSuccess(true)
      // Hide the success message after 5 seconds
      const timer = setTimeout(() => setShowImportSuccess(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Medlemmer</h1>
          <p className="text-muted-foreground mt-2">
            Administrer korets medlemmer
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
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

      <Card>
        <CardHeader>
          <CardTitle>Medlemsoversikt</CardTitle>
          <CardDescription>
            Alle medlemmer i koret
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Søk etter navn, e-post eller telefon..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <div className="text-center py-12 text-muted-foreground">
            <p>Medlemslisten vil vises her når systemet er koblet til databasen.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}