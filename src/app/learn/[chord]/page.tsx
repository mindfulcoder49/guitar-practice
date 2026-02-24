'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { FlashcardMode } from '@/components/FlashcardMode'
import { Button } from '@/components/ui/button'
import { CHORD_TEMPLATES, CURRICULUM_ORDER, getNextChord } from '@/lib/chords'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface LearnChordPageProps {
  params: Promise<{ chord: string }>
}

export default function LearnChordPage({ params }: LearnChordPageProps) {
  const { chord: chordName } = use(params)
  const router = useRouter()
  const [completed, setCompleted] = useState(false)

  const chord = CHORD_TEMPLATES[chordName]

  if (!chord) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-4">Chord not found: {chordName}</p>
          <Button asChild><Link href="/learn">Back to Curriculum</Link></Button>
        </div>
      </div>
    )
  }

  const nextChord = getNextChord(chordName)
  const chordIndex = CURRICULUM_ORDER.indexOf(chordName)

  async function handleComplete(accuracy: number) {
    setCompleted(true)
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'learnChord',
          data: { chordName, accuracy },
        }),
      })
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'practiceSession',
          data: {
            mode: 'flashcard',
            chordsPlayed: [chordName],
            score: Math.round(accuracy * 100),
          },
        }),
      })
      toast.success(`${chord.displayName} learned! Accuracy: ${Math.round(accuracy * 100)}%`)
    } catch {
      toast.error('Failed to save progress')
    }
  }

  function handleNext() {
    if (nextChord) {
      router.push(`/learn/${nextChord}`)
    } else {
      router.push('/learn')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/learn" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Curriculum
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">
            Chord {chordIndex + 1} of {CURRICULUM_ORDER.length}
          </span>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">{chord.displayName}</h1>
          <p className="text-muted-foreground">
            {chordIndex === 0
              ? 'Your first chord — easy to play and sounds great!'
              : chordName === 'F'
              ? 'The classic barre chord challenge. Take your time!'
              : 'Follow the diagram and listen carefully.'}
          </p>
        </div>

        <FlashcardMode
          chord={chord}
          onComplete={handleComplete}
          onNext={handleNext}
          hasNext={!!nextChord}
        />

        {completed && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Progress saved!</p>
              {nextChord
                ? <p className="text-sm text-green-600">Ready to learn <strong>{nextChord}</strong> next?</p>
                : <p className="text-sm text-green-600">You&apos;ve completed the full curriculum!</p>
              }
            </div>
            <Button
              size="sm"
              className="ml-auto"
              onClick={handleNext}
            >
              {nextChord ? `Learn ${nextChord}` : 'View Progress'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
