import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Calendar, 
  Music, 
  Settings, 
  Home,
  LogOut,
  Menu
} from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/signin')
  }

  // Get user's choir membership
  const { data: member } = await supabase
    .from('members')
    .select(`
      id,
      choir:choirs(
        id,
        name,
        logoUrl
      ),
      membershipType:membership_types(
        name,
        displayName
      )
    `)
    .eq('userProfileId', session.user.id)
    .single()

  const navItems = [
    { href: '/dashboard', label: 'Oversikt', icon: Home },
    { href: '/dashboard/members', label: 'Medlemmer', icon: Users },
    { href: '/dashboard/events', label: 'Arrangementer', icon: Calendar },
    { href: '/dashboard/repertoire', label: 'Repertoar', icon: Music },
    { href: '/dashboard/settings', label: 'Innstillinger', icon: Settings },
  ]

  const handleSignOut = async () => {
    'use server'
    const supabase = createServerComponentClient({ cookies })
    await supabase.auth.signOut()
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button className="lg:hidden p-2 rounded-md hover:bg-gray-100">
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center ml-4 lg:ml-0">
                <Music className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {(member?.choir as any)?.[0]?.name || 'Choirdinated'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {(member?.membershipType as any)?.[0]?.displayName}
                  </p>
                </div>
              </div>
            </div>
            
            <form action={handleSignOut}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Logg ut
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col flex-grow bg-white border-r pt-5 pb-4">
              <div className="flex-grow flex flex-col">
                <nav className="flex-1 px-2 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      >
                        <Icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}