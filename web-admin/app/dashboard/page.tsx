'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Users, Settings, Calendar, Music, FileText, LucideIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TodoItem {
  id: string
  title: string
  description: string
  iconName: 'Users' | 'Music' | 'FileText' | 'Calendar' | 'Settings'
  href: string
  completed: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [showWelcome, setShowWelcome] = useState(false)

  // Icon mapping to resolve icons by name
  const iconMap: Record<string, LucideIcon> = {
    Users,
    Music,
    FileText,
    Calendar,
    Settings
  }

  useEffect(() => {
    // Check if this is a new user (no todos in localStorage)
    const savedTodos = localStorage.getItem('onboarding-todos')
    if (!savedTodos) {
      // First time user
      const initialTodos: TodoItem[] = [
        {
          id: 'import-members',
          title: 'Importer medlemmer',
          description: 'Overfør medlemmer fra ditt tidligere system',
          iconName: 'Users',
          href: '/dashboard/settings/import',
          completed: false
        },
        {
          id: 'configure-voices',
          title: 'Konfigurer stemmegrupper',
          description: 'Sett opp stemmegrupper og stemmetyper for koret',
          iconName: 'Music',
          href: '/dashboard/settings/voices',
          completed: false
        },
        {
          id: 'membership-types',
          title: 'Definer medlemskapstyper',
          description: 'Sett opp medlemskapstyper (fast medlem, prosjektsanger, etc.)',
          iconName: 'FileText',
          href: '/dashboard/settings/membership-types',
          completed: false
        },
        {
          id: 'create-event',
          title: 'Opprett første øvelse',
          description: 'Legg inn en øvelse eller konsert i kalenderen',
          iconName: 'Calendar',
          href: '/dashboard/events/new',
          completed: false
        },
        {
          id: 'configure-system',
          title: 'Tilpass systemet',
          description: 'Konfigurer roller, hendelsestyper og andre innstillinger',
          iconName: 'Settings',
          href: '/dashboard/settings',
          completed: false
        }
      ]
      localStorage.setItem('onboarding-todos', JSON.stringify(initialTodos))
      setTodos(initialTodos)
      setShowWelcome(true)
    } else {
      try {
        const savedTodosList = JSON.parse(savedTodos)
        // Check if the saved data has the old format (with 'icon' property)
        if (savedTodosList.length > 0 && 'icon' in savedTodosList[0]) {
          // Clear old format data
          localStorage.removeItem('onboarding-todos')
          window.location.reload()
          return
        }
        setTodos(savedTodosList)
        // Show welcome if not all todos are completed
        const allCompleted = savedTodosList.every((todo: TodoItem) => todo.completed)
        setShowWelcome(!allCompleted)
      } catch (error) {
        // If there's an error parsing, clear and reload
        localStorage.removeItem('onboarding-todos')
        window.location.reload()
      }
    }
  }, [])

  const toggleTodo = (id: string) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
    setTodos(updatedTodos)
    localStorage.setItem('onboarding-todos', JSON.stringify(updatedTodos))
    
    // Check if all todos are completed
    const allCompleted = updatedTodos.every(todo => todo.completed)
    if (allCompleted) {
      setShowWelcome(false)
    }
  }

  const completedCount = todos.filter(todo => todo.completed).length
  const progress = todos.length > 0 ? (completedCount / todos.length) * 100 : 0

  if (!showWelcome) {
    // Regular dashboard content
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Oversikt</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive medlemmer</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Importer medlemmer for å komme i gang
              </p>
            </CardContent>
          </Card>
          {/* Add more dashboard cards here */}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="text-2xl">Velkommen til Choirdinated! 🎵</CardTitle>
          <CardDescription className="text-base">
            La oss hjelpe deg med å komme i gang. Her er noen viktige oppgaver for å sette opp koret ditt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Fremgang</span>
              <span>{completedCount} av {todos.length} fullført</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {todos.map((todo) => {
              const Icon = iconMap[todo.iconName] || Users // Fallback to Users icon if undefined
              if (!Icon) {
                return null
              }
              return (
                <div 
                  key={todo.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    todo.completed ? 'bg-muted/50' : 'hover:bg-muted/30'
                  }`}
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className="flex-shrink-0"
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                  
                  <Icon className={`h-5 w-5 ${todo.completed ? 'text-muted-foreground' : 'text-primary'}`} />
                  
                  <div className="flex-1">
                    <h3 className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {todo.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {todo.description}
                    </p>
                  </div>

                  {!todo.completed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(todo.href)}
                    >
                      Start
                    </Button>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-6 p-4 bg-primary/10 rounded-lg">
            <p className="text-sm">
              <strong>Tips:</strong> Vi anbefaler å starte med å importere medlemmer fra ditt gamle system. 
              Dette vil spare deg for mye tid og gi deg en god oversikt over koret med en gang.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}