import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MousePointer, 
  Play, 
  ChevronDown, 
  LayoutGrid, 
  Menu, 
  Calendar,
  ExternalLink 
} from 'lucide-react'

const timelineVariants = [
  {
    id: 'interactive',
    title: 'Interaktiv Tidslinje',
    description: 'Focus på hover-interaksjoner og progresjonslinjeer. Kort som utvider seg med mer informasjon ved museover.',
    icon: MousePointer,
    url: '/dashboard/events/timeline-demo',
    features: ['Hover-effekter', 'Stemmefordeling', 'Progresjonslinjeer', 'Alternerende layout'],
    complexity: 'Middels',
    bestFor: 'Datavisualisering med interaktivitet'
  },
  {
    id: 'animated',
    title: 'Animert Tidslinje',
    description: 'Framer Motion animasjoner med kort som glir inn fra vekslende sider. Linjen tegner seg selv.',
    icon: Play,
    url: '/dashboard/events/animated-timeline-demo',
    features: ['Slide-in animasjoner', 'Selvtegnende linje', 'Forsinkede animasjoner', 'Spring-effekter'],
    complexity: 'Høy',
    bestFor: 'Visuell impact og engasjement'
  },
  {
    id: 'hybrid',
    title: '🚀 Animert + Interaktiv (Hybrid)',
    description: 'Det beste fra begge verdener! Framer Motion animasjoner kombinert med rike hover-interaksjoner og stemmefordeling.',
    icon: Play,
    url: '/dashboard/events/animated-interactive-timeline-demo',
    features: ['Slide-in animasjoner', 'Hover-detaljer', 'Stemmefordeling', 'Animerte progresjonslinjeer'],
    complexity: 'Høy',
    bestFor: 'Maksimal visuell appell og funksjonalitet'
  },
  {
    id: 'accordion',
    title: 'Trekkspill Tidslinje',
    description: 'Sammenleggbar struktur med ukevisning. Viser sammendrag når lukket, full detaljer når åpnet.',
    icon: ChevronDown,
    url: '/dashboard/events/accordion-timeline-demo',
    features: ['Sammenleggbare seksjoner', 'Ukesammendrag', 'Plassbesparende', 'Oversiktlig'],
    complexity: 'Lav',
    bestFor: 'Store datamengder og oversikt'
  },
  {
    id: 'card',
    title: 'Kortbasert Tidslinje',
    description: 'Grid-layout med tilpassede kort og badges. Fargekodede arrangementtyper og trendikoner.',
    icon: LayoutGrid,
    url: '/dashboard/events/card-timeline-demo',
    features: ['Grid-layout', 'Fargekoding', 'Trendikoner', 'Gradienter'],
    complexity: 'Middels',
    bestFor: 'Visuell kategorisering og sammenligning'
  },
  {
    id: 'tabs',
    title: 'Fanebasert Tidslinje',
    description: 'Ukenavigering med faner. Hver uke vises detaljert med omfattende statistikk og tidslinje.',
    icon: Menu,
    url: '/dashboard/events/tab-timeline-demo',
    features: ['Fanenavigering', 'Detaljerte statistikker', 'Ukesammendrag', 'Ryddig organisering'],
    complexity: 'Middels',
    bestFor: 'Fokus på én periode av gangen'
  },
  {
    id: 'split',
    title: 'Delt Visning Tidslinje',
    description: 'Kalender til venstre, arrangementsdetaljer til høyre. Klikk på datoer for å se arrangementer.',
    icon: Calendar,
    url: '/dashboard/events/split-view-timeline-demo',
    features: ['Kalenderoversikt', 'Dagsvisning', 'Fargekodede indikatorer', 'Månedsnavigering'],
    complexity: 'Høy',
    bestFor: 'Kalenderintegrering og dagsvisning'
  }
]

const getComplexityColor = (complexity: string) => {
  switch (complexity) {
    case 'Lav': return 'bg-green-100 text-green-800'
    case 'Middels': return 'bg-yellow-100 text-yellow-800'
    case 'Høy': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function TimelineComparisonPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Tidslinje Sammenligning</h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Sammenlign alle de forskjellige tilnærmingene til tidslinje-visning. 
          Hver variant har sine styrker og er optimert for ulike bruksområder.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {timelineVariants.map((variant) => {
          const Icon = variant.icon
          
          return (
            <Card key={variant.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{variant.title}</CardTitle>
                      <Badge className={getComplexityColor(variant.complexity)}>
                        {variant.complexity} kompleksitet
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  {variant.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Hovedfunksjoner:</h4>
                  <div className="flex flex-wrap gap-1">
                    {variant.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Best for:</h4>
                  <p className="text-sm text-gray-600">{variant.bestFor}</p>
                </div>
                
                <div className="pt-4">
                  <Button asChild className="w-full">
                    <Link href={variant.url} className="flex items-center gap-2">
                      Se Demo
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Anbefalinger</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold mb-2">🎯 For datavisualisering</h3>
            <p className="text-sm text-gray-700">
              Bruk <strong>Interaktiv Tidslinje</strong> eller <strong>Kortbasert Tidslinje</strong> 
              for best visualisering av oppmøtedata og trender.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">📱 For mobile enheter</h3>
            <p className="text-sm text-gray-700">
              <strong>Trekkspill Tidslinje</strong> eller <strong>Fanebasert Tidslinje</strong> 
              fungerer best på mindre skjermer.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">✨ For visuell appell</h3>
            <p className="text-sm text-gray-700">
              <strong>Animert Tidslinje</strong> gir den beste første inntrykket og 
              brukerengasjementet.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">📅 For kalenderintegrasjon</h3>
            <p className="text-sm text-gray-700">
              <strong>Delt Visning Tidslinje</strong> er perfekt når brukere tenker 
              i kalenderdatoer fremfor uker.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}