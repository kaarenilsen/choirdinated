import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Calendar, 
  Music, 
  TrendingUp,
  UserCheck,
  CalendarDays,
  Clock,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  // Get choir statistics
  const { data: member } = await supabase
    .from('members')
    .select(`
      id,
      choirId,
      choir:choirs(
        id,
        name,
        foundedYear,
        settings
      )
    `)
    .eq('userProfileId', session.user.id)
    .single()

  const choirId = member?.choirId

  // Get member count
  const { count: memberCount } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('choirId', choirId)

  // Get upcoming events count
  const { count: upcomingEventsCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('choirId', choirId)
    .gte('startTime', new Date().toISOString())

  // Get recent events
  const { data: recentEvents } = await supabase
    .from('events')
    .select(`
      id,
      title,
      startTime,
      eventType:listOfValues!events_typeId_fkey(
        displayName
      )
    `)
    .eq('choirId', choirId)
    .gte('startTime', new Date().toISOString())
    .order('startTime', { ascending: true })
    .limit(5)

  const stats = [
    {
      title: 'Medlemmer',
      value: memberCount || 0,
      icon: Users,
      href: '/dashboard/members',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Kommende arrangementer',
      value: upcomingEventsCount || 0,
      icon: Calendar,
      href: '/dashboard/events',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Aktive sanger',
      value: 0, // TODO: Implement repertoire count
      icon: Music,
      href: '/dashboard/repertoire',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Oppmøte siste måned',
      value: '0%', // TODO: Implement attendance tracking
      icon: TrendingUp,
      href: '/dashboard/attendance',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Velkommen til {member?.choir?.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Her er en oversikt over korets aktiviteter
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Kommende arrangementer</CardTitle>
              <Link href="/dashboard/events">
                <Button variant="ghost" size="sm">
                  Se alle
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentEvents && recentEvents.length > 0 ? (
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <CalendarDays className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {event.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {event.eventType?.displayName} • {new Date(event.startTime).toLocaleDateString('nb-NO')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Ingen kommende arrangementer
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Hurtighandlinger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/dashboard/events/new">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Opprett nytt arrangement
                </Button>
              </Link>
              <Link href="/dashboard/members/new">
                <Button variant="outline" className="w-full justify-start">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Legg til nytt medlem
                </Button>
              </Link>
              <Link href="/dashboard/repertoire/new">
                <Button variant="outline" className="w-full justify-start">
                  <Music className="h-4 w-4 mr-2" />
                  Legg til ny sang
                </Button>
              </Link>
              <Link href="/dashboard/attendance">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Registrer oppmøte
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}