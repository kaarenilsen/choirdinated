import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Music, Users, Calendar, MessageCircle, BarChart3, Shield, Clock, Star } from 'lucide-react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect to dashboard if already logged in
  if (session) {
    redirect('/dashboard')
  }
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Choirdinated</span>
          </div>
          <div className="flex space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Logg inn</Button>
            </Link>
            <Link href="/onboarding">
              <Button>Registrer ditt kor</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Profesjonelt korstyringssystem for symfoniske kor
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Choirdinated er skreddersydd for store kor tilknyttet symfonier og operaer. 
            Få fullstendig kontroll over medlemshåndtering, øvelser, noter og kommunikasjon.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding">
              <Button size="lg" className="text-lg px-8 py-4">
                Start gratis prøveperiode
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              Se demonstrasjon
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            30 dager gratis • Ingen bindingstid • Setup på 5 minutter
          </p>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Hva korene våre sier
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Vårt kor var helt fortapt til vi fant Choirdinated. Nå har vi full oversikt over 
                  alle medlemmer, øvelser og konserter. Aldri mer kaos!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">MH</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Maria Hansen</p>
                    <p className="text-sm text-gray-500">Dirigent, Oslo Filharmoniske Kor</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Choirdinated har revolusjonert måten vi administrerer vårt 120-medlems kor. 
                  Fravær, noter og kommunikasjon - alt på ett sted!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 font-semibold">AS</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Anders Solberg</p>
                    <p className="text-sm text-gray-500">Korsjef, Den Norske Opera</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Som medlem elsker jeg at jeg kan se alle øvelser, melde fravær og 
                  få noter direkte på mobilen. Enkelt og intuitivt!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-semibold">EL</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Eva Larsen</p>
                    <p className="text-sm text-gray-500">Sopran, Bergen Filharmoniske Kor</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Alt du trenger for å drive ditt kor profesjonelt
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Medlemshåndtering</h3>
              <p className="text-gray-600">
                Komplett oversikt over alle medlemmer, stemmegrupper, permisjoner og medlemshistorikk.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Øvelser & Konserter</h3>
              <p className="text-gray-600">
                Google Calendar-stil planlegging med frammøteregistrering og automatisk utsendelse.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Notehåndtering</h3>
              <p className="text-gray-600">
                Digital notearkiv med lydfiler per stemmegruppe og automatisk utsendelse til medlemmene.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Kommunikasjon</h3>
              <p className="text-gray-600">
                Målrettet kommunikasjon til stemmegrupper, chat per seksjon og nyhetsstrøm.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Rapporter & Analytics</h3>
              <p className="text-gray-600">
                Detaljerte rapporter over frammøte, medlemsutvikling og korens aktivitet.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sikkerhet & GDPR</h3>
              <p className="text-gray-600">
                Høyeste sikkerhetsstandarder med GDPR-compliance og rollbasert tilgangskontroll.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Enkel og forutsigbar prising
          </h2>
          <div className="max-w-lg mx-auto">
            <Card className="border-2 border-blue-600">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Choirdinated Professional</h3>
                <div className="text-4xl font-bold text-blue-600 mb-4">
                  500 kr
                  <span className="text-lg text-gray-500 font-normal">/måned</span>
                </div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center">
                    <Clock className="h-5 w-5 text-green-500 mr-2" />
                    30 dager gratis prøveperiode
                  </li>
                  <li className="flex items-center">
                    <Users className="h-5 w-5 text-green-500 mr-2" />
                    Ubegrenset antall medlemmer
                  </li>
                  <li className="flex items-center">
                    <Calendar className="h-5 w-5 text-green-500 mr-2" />
                    Komplett event- og frammøtehåndtering
                  </li>
                  <li className="flex items-center">
                    <Music className="h-5 w-5 text-green-500 mr-2" />
                    Noter og lydfiler med stemmegrupper
                  </li>
                  <li className="flex items-center">
                    <MessageCircle className="h-5 w-5 text-green-500 mr-2" />
                    Målrettet kommunikasjon og chat
                  </li>
                  <li className="flex items-center">
                    <Shield className="h-5 w-5 text-green-500 mr-2" />
                    Prioritert support og sikkerhet
                  </li>
                </ul>
                <Link href="/onboarding">
                  <Button size="lg" className="w-full">
                    Start gratis prøveperiode
                  </Button>
                </Link>
                <p className="text-sm text-gray-500 mt-4">
                  Ingen bindingstid • Avbryt når som helst
                </p>
              </CardContent>
            </Card>
          </div>
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
              <p className="text-gray-400">
                Profesjonelt korstyringssystem for symfoniske kor og operaorganisasjoner.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Funksjoner</Link></li>
                <li><Link href="#" className="hover:text-white">Prising</Link></li>
                <li><Link href="#" className="hover:text-white">Integrasjoner</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Dokumentasjon</Link></li>
                <li><Link href="#" className="hover:text-white">Kontakt oss</Link></li>
                <li><Link href="#" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Selskap</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Om oss</Link></li>
                <li><Link href="#" className="hover:text-white">Personvern</Link></li>
                <li><Link href="#" className="hover:text-white">Vilkår</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Choirdinated. Alle rettigheter reservert.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}