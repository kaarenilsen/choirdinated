import { AnimatedInteractiveTimeline } from '@/components/events/AnimatedInteractiveTimeline'

// Demo data
const demoWeeks = [
  {
    weekNumber: 24,
    events: [
      {
        id: '1',
        title: 'Avskjedskonsert Høvik kirke',
        date: new Date('2025-06-14'),
        startTime: '14:30',
        endTime: '18:45',
        attendingCount: 94,
        notAttendingCount: 20,
        totalExpected: 114,
        location: 'Høvik kirke',
        type: 'Konsert'
      },
      {
        id: '2',
        title: 'Sommer-/avskjedsfest hos Øystein (rett etter konserten)',
        date: new Date('2025-06-14'),
        startTime: '19:00',
        endTime: '23:55',
        attendingCount: 5,
        notAttendingCount: 4,
        totalExpected: 9,
        location: 'Hos Øystein',
        type: 'Sosialt'
      },
      {
        id: '3',
        title: 'Verdi korprøve',
        date: new Date('2025-06-15'),
        startTime: '16:00',
        endTime: '21:00',
        attendingCount: 73,
        notAttendingCount: 44,
        totalExpected: 117,
        location: 'Øvingslokalet',
        type: 'Korprøve'
      }
    ]
  },
  {
    weekNumber: 25,
    events: [
      {
        id: '4',
        title: 'Verdi full korprøve (m/OFK + andre sangere)',
        date: new Date('2025-06-16'),
        startTime: '17:00',
        endTime: '20:00',
        attendingCount: 83,
        notAttendingCount: 34,
        totalExpected: 117,
        location: 'Konserthuset',
        type: 'Generalprøve'
      },
      {
        id: '5',
        title: 'Årsmøte 20.00',
        date: new Date('2025-06-16'),
        startTime: '20:00',
        endTime: '21:30',
        attendingCount: 103,
        notAttendingCount: 11,
        totalExpected: 114,
        location: 'Konserthuset',
        type: 'Møte'
      }
    ]
  },
  {
    weekNumber: 27,
    events: [
      {
        id: '6',
        title: 'Sommeravslutning',
        date: new Date('2025-06-30'),
        startTime: '18:00',
        endTime: '22:00',
        attendingCount: 89,
        notAttendingCount: 25,
        totalExpected: 114,
        location: 'Utendørs',
        type: 'Sosialt'
      }
    ]
  }
]

export default function AnimatedInteractiveTimelineDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🚀 Animert + Interaktiv Tidslinje Demo</h1>
        <p className="text-gray-600 mb-4">
          Det beste fra begge verdener! Framer Motion animasjoner kombinert med rike hover-interaksjoner.
          Kort animeres inn fra vekslende sider, og stemmefordeling med mini-progresjonslinjeer vises ved hover.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            ✨ Slide-in animasjoner
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            🎯 Hover-detaljer
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            📊 Stemmefordeling
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            📈 Animerte progresjonslinjeer
          </span>
        </div>
      </div>
      
      <AnimatedInteractiveTimeline weeks={demoWeeks} />
    </div>
  )
}