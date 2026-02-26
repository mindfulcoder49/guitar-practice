'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ChatBot } from '@/components/ChatBot'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare } from 'lucide-react'
import { ProgressionChord } from '@/types'

export default function ChatPage() {
  const router = useRouter()
  const [learnedChords, setLearnedChords] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/progress')
      .then(r => r.json())
      .then(data => {
        const names = data.learnedChords?.map((c: { chordName: string }) => c.chordName) ?? []
        setLearnedChords(names)
      })
      .catch(() => {})
  }, [])

  function handleLoadProgression(progression: ProgressionChord[]) {
    const encoded = encodeURIComponent(JSON.stringify(progression))
    router.push(`/practice?progression=${encoded}`)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-3xl flex-1 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-green-500" />
            AI Guitar Assistant
          </h1>
          <p className="text-muted-foreground">
            Generates progressions using only the chords you&apos;ve learned
          </p>
        </div>

        {/* Learned chords the AI knows about */}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground whitespace-nowrap">AI knows:</span>
          {learnedChords.length > 0 ? (
            learnedChords.map(c => (
              <Badge key={c} variant="secondary" className="font-mono">
                {c}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground italic">
              No chords learned yet — visit the{' '}
              <a href="/learn" className="underline text-primary">Learn</a> section first
            </span>
          )}
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden min-h-[320px] sm:min-h-[500px]">
          <ChatBot onLoadProgression={handleLoadProgression} />
        </Card>
      </div>
    </div>
  )
}
