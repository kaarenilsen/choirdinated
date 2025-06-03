'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Users, Music, FileText, Shield, Bell, Database } from 'lucide-react'
import Link from 'next/link'

const settingsCategories = [
  {
    title: 'Import',
    description: 'Importer medlemmer fra andre systemer',
    icon: Upload,
    href: '/dashboard/settings/import',
    color: 'text-blue-600 bg-blue-100'
  },
  {
    title: 'Stemmegrupper',
    description: 'Konfigurer stemmegrupper og stemmetyper',
    icon: Music,
    href: '/dashboard/settings/voices',
    color: 'text-purple-600 bg-purple-100'
  },
  {
    title: 'Medlemskapstyper',
    description: 'Definer medlemskapstyper og tilganger',
    icon: FileText,
    href: '/dashboard/settings/membership-types',
    color: 'text-green-600 bg-green-100'
  },
  {
    title: 'Roller og tilganger',
    description: 'Administrer brukerroller og rettigheter',
    icon: Shield,
    href: '/dashboard/settings/roles',
    color: 'text-orange-600 bg-orange-100'
  },
  {
    title: 'Varsler',
    description: 'Konfigurer e-post og push-varsler',
    icon: Bell,
    href: '/dashboard/settings/notifications',
    color: 'text-red-600 bg-red-100'
  },
  {
    title: 'Korinformasjon',
    description: 'Rediger grunnleggende informasjon om koret',
    icon: Database,
    href: '/dashboard/settings/choir',
    color: 'text-indigo-600 bg-indigo-100'
  }
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Innstillinger</h1>
        <p className="text-muted-foreground mt-2">
          Konfigurer systemet for ditt kor
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsCategories.map((category) => {
          const Icon = category.icon
          return (
            <Link key={category.href} href={category.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}