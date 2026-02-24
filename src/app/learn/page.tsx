import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChordDiagram } from '@/components/ChordDiagram'
import { CURRICULUM_ORDER, CHORD_TEMPLATES } from '@/lib/chords'
import { CheckCircle, Lock, ChevronRight } from 'lucide-react'

export default async function LearnPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const learnedChords = await prisma.learnedChord.findMany({
    where: { userId: session.user.id },
    select: { chordName: true, accuracy: true },
  })
  const learnedMap = Object.fromEntries(learnedChords.map(c => [c.chordName, c.accuracy]))

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={session.user.name} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Chord Curriculum</h1>
          <p className="text-muted-foreground">
            Learn chords in order from easiest to most challenging. Each chord unlocks the next.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CURRICULUM_ORDER.map((chordName, idx) => {
            const chord = CHORD_TEMPLATES[chordName]
            const isLearned = chordName in learnedMap
            const isUnlocked = idx === 0 || CURRICULUM_ORDER.slice(0, idx).every(c => c in learnedMap)
            const accuracy = learnedMap[chordName]

            return (
              <Link
                key={chordName}
                href={isUnlocked ? `/learn/${chordName}` : '#'}
                className={isUnlocked ? 'block' : 'block opacity-60 cursor-not-allowed'}
              >
                <Card className={`h-full transition-all ${
                  isLearned
                    ? 'border-green-300 bg-green-50'
                    : isUnlocked
                    ? 'hover:shadow-md hover:border-purple-300 cursor-pointer'
                    : 'border-dashed'
                }`}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                          {isLearned && <Badge className="bg-green-500 text-white text-xs h-5">Learned</Badge>}
                          {!isUnlocked && <Badge variant="outline" className="text-xs h-5"><Lock className="w-3 h-3 mr-1" />Locked</Badge>}
                        </div>
                        <h3 className="font-bold text-xl">{chord.displayName}</h3>
                      </div>
                      {isLearned
                        ? <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                        : isUnlocked
                        ? <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        : <Lock className="w-5 h-5 text-muted-foreground" />
                      }
                    </div>

                    <div className="flex justify-center py-2">
                      <ChordDiagram chord={chord} size="sm" />
                    </div>

                    {isLearned && accuracy !== undefined && (
                      <p className="text-xs text-center text-green-600 mt-2">
                        Accuracy: {Math.round(accuracy * 100)}%
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
