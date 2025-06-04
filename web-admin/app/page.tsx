import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Music, Users, Calendar, MessageCircle, FileText, Star, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Choirdinated</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/signin">Logg inn</Link>
            </Button>
            <Button asChild>
              <Link href="/onboarding">Start gratis prøveperiode</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-4" variant="secondary">
            🎵 Spesialbygd for symphoniorkestre og operakor
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Perfekt koordinering for ditt profesjonelle kor
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Choirdinated er det komplette medlemsadministrasjonssystemet designet spesielt for store symphoniorkestre og operakor. 
            Håndter medlemmer, fremmøte, stemmegrupper og kommunikasjon på én plass.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/onboarding">
                Start 30 dagers gratis prøveperiode
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#pricing">Se priser</Link>
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Ingen kredittkort påkrevd • Fullt sett med funksjoner • Gratis i 30 dager
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Alt du trenger for å administrere ditt kor
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Bygget av kordirigenter for kordirigenter, med dype forståelse for symphoniorkestre og operakors unike behov.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Medlemsadministrasjon</CardTitle>
                <CardDescription>
                  Komplett livssyklushåndtering med medlemskapsperioder, permisjoner og stemmegrupper
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Fleksible stemmegrupper (SATB, SSAATTBB, SMATBB)
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Automatisk permisjonshåndtering
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Komplett medlemshistorikk
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Smart fremmøtehåndtering</CardTitle>
                <CardDescription>
                  Tofase-fremmøte med intensjonsregistrering og fysisk oppmøte-markering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Automatisk kalendersynkronisering
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Stemmegruppe-spesifikk targeting
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Fremmøteanalyse og rapporter
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageCircle className="h-8 w-4 text-blue-600 mb-2" />
                <CardTitle>Målrettet kommunikasjon</CardTitle>
                <CardDescription>
                  Send beskjeder til spesifikke stemmegrupper, medlemskapstyper eller hele koret
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Stemmegruppe-chat
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Informasjonsfeed
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Push-notifikasjoner
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Noter og setlister</CardTitle>
                <CardDescription>
                  Organiser noter, dele øvingsfiler og administrer setlister for konserter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Stemmegruppe-spesifikke øvingsfiler
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Setliste-administrasjon
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Sikker fildeling
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Mobilapp for medlemmer</CardTitle>
                <CardDescription>
                  Dedikert app for medlemmer med &ldquo;Min side&rdquo;, fremmøteregistrering og kommunikasjon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Personlig medlemshistorikk
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Permisjonssøknader
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Stemmeleder-verktøy
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Music className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Avanserte stemmegrupper</CardTitle>
                <CardDescription>
                  Støtter alle vanlige kororganiseringer med hierarkisk stemmegruppe-system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    SATB (tradisjonelt)
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    SSAATTBB (symphonisk)
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    SMATBB (opera)
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Anbefalt av kordirigenter
            </h2>
            <p className="text-gray-600">
              Se hva profesjonelle kordirigenter sier om Choirdinated
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  &ldquo;Endelig et system som forstår hvordan et symfoniorkester fungerer. Stemmegruppe-funktionaliteten er genial.&rdquo;
                </p>
                <div className="text-sm">
                  <p className="font-medium">Marie Andersen</p>
                  <p className="text-gray-500">Dirigent, Bergen Filharmoniske Kor</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  &ldquo;Fremmøtehåndteringen har spart oss for timer hver uke. Medlemmene registrerer selv, og vi får automatiske rapporter.&rdquo;
                </p>
                <div className="text-sm">
                  <p className="font-medium">Lars Eriksen</p>
                  <p className="text-gray-500">Korleder, Oslo Operakor</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  &ldquo;Migrasjonen fra vårt gamle system var smertefri. Import-funksjonen fungerte perfekt med våre Choirmate-data.&rdquo;
                </p>
                <div className="text-sm">
                  <p className="font-medium">Ingrid Haugen</p>
                  <p className="text-gray-500">Administrativ leder, Trondheim Symfonikor</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Enkel og forutsigbar prising
            </h2>
            <p className="text-gray-600">
              En pris for alle funksjoner. Ingen skjulte kostnader eller begrensninger.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <Card className="border-2 border-blue-600 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                Anbefalt
              </Badge>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Choirdinated Pro</CardTitle>
                <CardDescription>Alt du trenger for ditt profesjonelle kor</CardDescription>
                <div className="text-4xl font-bold text-blue-600 mt-4">
                  500 kr
                  <span className="text-lg font-normal text-gray-500">/måned</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Ubegrenset antall medlemmer
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Alle stemmegruppe-konfigurasjoner
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Mobilapp for medlemmer
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Fremmøtehåndtering og rapporter
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Notebibliotek og setlister
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Målrettet kommunikasjon
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Datamigrering inkludert
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    E-post support
                  </li>
                </ul>
                <Button className="w-full mt-6" asChild>
                  <Link href="/onboarding">Start gratis prøveperiode</Link>
                </Button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  30 dager gratis, ingen binding
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Klar til å ta koret ditt til neste nivå?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Slutt deg til hundrevis av profesjonelle kor som allerede bruker Choirdinated for å administrere medlemmer, 
            fremmøte og kommunikasjon mer effektivt.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/onboarding">
              Start din gratis prøveperiode i dag
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Music className="h-6 w-6" />
                <span className="text-xl font-bold">Choirdinated</span>
              </div>
              <p className="text-gray-400 text-sm">
                Profesjonell medlemsadministrasjon for symphoniorkestre og operakor.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-4">Produkt</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">Funksjoner</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Priser</Link></li>
                <li><Link href="/onboarding" className="hover:text-white">Start gratis</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">Hjelpesenter</Link></li>
                <li><Link href="#" className="hover:text-white">Kontakt oss</Link></li>
                <li><Link href="#" className="hover:text-white">Datamigrering</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-4">Selskap</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">Om oss</Link></li>
                <li><Link href="#" className="hover:text-white">Personvern</Link></li>
                <li><Link href="#" className="hover:text-white">Vilkår</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Choirdinated. Alle rettigheter reservert.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}