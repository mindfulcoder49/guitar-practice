'use client'

import { Suspense, useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { NoteHighway } from '@/components/NoteHighway'
import { Metronome } from '@/components/Metronome'
import { MicrophoneSetup } from '@/components/MicrophoneSetup'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useNoteDetection } from '@/hooks/useNoteDetection'
import { AISong } from '@/types'
import { Play, Square, RotateCcw, BookmarkPlus } from 'lucide-react'
import { toast } from 'sonner'

function AIPlayContent() {
  const searchParams = useSearchParams()
  const [song, setSong] = useState<AISong | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [running, setRunning] = useState(false)
  const [bpm, setBpm] = useState(100)
  const [score, setScore] = useState(0)
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [mode, setMode] = useState<'practice' | 'test'>('practice')

  const noteMatch = useNoteDetection(stream, { enabled: running })

  useEffect(() => {
    const songParam = searchParams.get('song')
    if (songParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(songParam))
        setSong(parsed)
        setBpm(parsed.bpm ?? 100)
      } catch {
        toast.error('Failed to load song data')
      }
    }
  }, [searchParams])

  const handleScore = useCallback((hit: boolean) => {
    if (hit) {
      setHits(h => h + 1)
      setScore(s => s + 10)
    } else {
      setMisses(m => m + 1)
    }
  }, [])

  async function handleStop() {
    setRunning(false)
    const total = hits + misses
    if (total === 0) return

    try {
      await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'songSession',
          data: { songId: 'ai-generated', score, hits, misses },
        }),
      })
      toast.success(`Session saved! Score: ${score}`)
    } catch {
      toast.error('Failed to save session')
    }
  }

  function handleReset() {
    setRunning(false)
    setScore(0)
    setHits(0)
    setMisses(0)
  }

  async function handleSaveToCatalog() {
    if (!song) return
    try {
      await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: song.title || 'AI Song',
          type: song.type,
          data: JSON.stringify(song),
        }),
      })
      toast.success('Saved to catalog!')
    } catch {
      toast.error('Failed to save to catalog')
    }
  }

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0

  if (!song) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">No song data found. Go to AI Chat to generate a song.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">{song.title || 'AI Generated Song'}</h1>
        {'chordName' in song && (
          <p className="text-muted-foreground text-sm">Hold: <strong>{song.chordName}</strong></p>
        )}
        <p className="text-xs text-muted-foreground mt-1">AI-generated • {song.type}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Main lane */}
        <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
          <MicrophoneSetup onStream={setStream} />

          <NoteHighway
            notes={song.type === 'melody' ? song.notes : undefined}
            pattern={song.type === 'fingerpick' ? song.sequence : undefined}
            patternLoops={song.type === 'fingerpick' ? song.loops : 4}
            bpm={bpm}
            running={running}
            currentNoteMatch={noteMatch}
            onScore={handleScore}
            mode={mode}
          />

          <Metronome bpm={bpm} onBpmChange={setBpm} running={running} />

          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button size="sm" variant={mode === 'practice' ? 'default' : 'ghost'} className="flex-1 text-xs"
              onClick={() => setMode('practice')} disabled={running}>
              Practice
            </Button>
            <Button size="sm" variant={mode === 'test' ? 'default' : 'ghost'} className="flex-1 text-xs"
              onClick={() => setMode('test')} disabled={running}>
              Test
            </Button>
          </div>

          <div className="flex gap-3">
            {!running ? (
              <Button onClick={() => { handleReset(); setRunning(true) }} className="gap-2 flex-1" size="lg" disabled={!stream}>
                <Play className="w-5 h-5" />
                Start
              </Button>
            ) : (
              <Button onClick={handleStop} variant="destructive" className="gap-2 flex-1" size="lg">
                <Square className="w-5 h-5" />
                Stop
              </Button>
            )}
            <Button variant="outline" onClick={handleReset} size="lg">
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="order-1 lg:order-2 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between lg:block lg:text-center gap-4">
                <div>
                  <p className="text-4xl font-bold text-primary">{score}</p>
                  <p className="text-muted-foreground text-sm">Score</p>
                </div>
                <div className="flex flex-col sm:flex-row lg:justify-center gap-2 mt-0 lg:mt-3 text-sm">
                  <span className="text-green-600 font-medium">✓ {hits}</span>
                  <span className="text-red-500 font-medium">✗ {misses}</span>
                </div>
                {hits + misses > 0 && (
                  <p className="text-xs text-muted-foreground hidden sm:block">{accuracy}%</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleSaveToCatalog}>
            <BookmarkPlus className="w-4 h-4" />
            Save to Catalog
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AIPlayPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
        <AIPlayContent />
      </Suspense>
    </div>
  )
}
