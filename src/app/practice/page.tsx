'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ChordHighway } from '@/components/ChordHighway'
import { Metronome } from '@/components/Metronome'
import { MicrophoneSetup } from '@/components/MicrophoneSetup'
import { ChordDetector } from '@/components/ChordDetector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressionChord, ChordMatch } from '@/types'
import { Play, Square, RotateCcw, Zap } from 'lucide-react'
import { CURRICULUM_ORDER } from '@/lib/chords'
import { toast } from 'sonner'

const DEFAULT_PROGRESSION: ProgressionChord[] = [
  { chord: 'Em', beats: 4 },
  { chord: 'Am', beats: 4 },
  { chord: 'D', beats: 4 },
  { chord: 'G', beats: 4 },
]

function PracticeContent() {
  const searchParams = useSearchParams()
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [currentMatch, setCurrentMatch] = useState<ChordMatch | null>(null)
  const [running, setRunning] = useState(false)
  const [bpm, setBpm] = useState(60)
  const [score, setScore] = useState(0)
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [progression, setProgression] = useState<ProgressionChord[]>(DEFAULT_PROGRESSION)
  const [learnedChords, setLearnedChords] = useState<string[]>([])
  const [mode, setMode] = useState<'practice' | 'test'>('practice')

  // Load AI progression from URL if present
  useEffect(() => {
    const prog = searchParams.get('progression')
    if (prog) {
      try {
        const parsed = JSON.parse(decodeURIComponent(prog))
        setProgression(parsed)
      } catch {}
    }
  }, [searchParams])

  useEffect(() => {
    fetch('/api/progress')
      .then(r => r.json())
      .then(data => {
        const names = data.learnedChords?.map((c: { chordName: string }) => c.chordName) ?? []
        setLearnedChords(names)
      })
      .catch(() => {})
  }, [])

  const handleScore = useCallback((hit: boolean, _chord: string) => {
    if (hit) {
      setHits(h => h + 1)
      setScore(s => s + 10)
    } else {
      setMisses(m => m + 1)
    }
  }, [])

  async function handleStop() {
    setRunning(false)
    if (hits + misses > 0) {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'practiceSession',
            data: {
              mode: 'guitar-hero',
              chordsPlayed: progression.map(p => p.chord),
              score,
            },
          }),
        })
        toast.success(`Session saved! Score: ${score}`)
      } catch {
        toast.error('Failed to save session')
      }
    }
  }

  function handleReset() {
    setRunning(false)
    setScore(0)
    setHits(0)
    setMisses(0)
  }

  function useLearnedProgression() {
    const learned = CURRICULUM_ORDER.filter(c => learnedChords.includes(c))
    if (learned.length < 2) {
      toast.error('Learn at least 2 chords first!')
      return
    }
    const prog = learned.map(c => ({ chord: c, beats: 4 }))
    setProgression(prog)
    toast.success('Loaded your learned chords')
  }

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="w-8 h-8 text-yellow-500" />
          Guitar Hero Mode
        </h1>
        <p className="text-muted-foreground">Hit chords as they scroll toward the line</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main lane */}
        <div className="lg:col-span-2 space-y-4">
          <MicrophoneSetup onStream={setStream} />

          {stream && (
            <ChordDetector
              stream={stream}
              onChordDetected={setCurrentMatch}
            />
          )}

          <ChordHighway
            progression={progression}
            bpm={bpm}
            running={running}
            currentMatch={currentMatch}
            onScore={handleScore}
            mode={mode}
          />

          <Metronome
            bpm={bpm}
            onBpmChange={setBpm}
            running={running}
          />

          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              size="sm"
              variant={mode === 'practice' ? 'default' : 'ghost'}
              className="flex-1 text-xs"
              onClick={() => setMode('practice')}
              disabled={running}
              title="Scrolling pauses on a missed chord until you play it"
            >
              Practice
            </Button>
            <Button
              size="sm"
              variant={mode === 'test' ? 'default' : 'ghost'}
              className="flex-1 text-xs"
              onClick={() => setMode('test')}
              disabled={running}
              title="Scrolling never stops — scored like a real run"
            >
              Test
            </Button>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!running ? (
              <Button
                onClick={() => { handleReset(); setRunning(true) }}
                className="gap-2 flex-1"
                size="lg"
                disabled={!stream}
              >
                <Play className="w-5 h-5" />
                Start
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                variant="destructive"
                className="gap-2 flex-1"
                size="lg"
              >
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
        <div className="space-y-4">
          {/* Score */}
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-5xl font-bold text-primary">{score}</p>
              <p className="text-muted-foreground text-sm">Score</p>
              <div className="flex justify-center gap-4 mt-3 text-sm">
                <span className="text-green-600 font-medium">✓ {hits} hits</span>
                <span className="text-red-500 font-medium">✗ {misses} missed</span>
              </div>
              {hits + misses > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{accuracy}% accuracy</p>
              )}
            </CardContent>
          </Card>

          {/* Progression */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Progression</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="flex flex-wrap gap-1.5">
                {progression.map((p, i) => (
                  <Badge key={i} variant="outline" className="font-mono">
                    {p.chord} ×{p.beats}
                  </Badge>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={useLearnedProgression}
              >
                Use My Learned Chords
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function PracticePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
        <PracticeContent />
      </Suspense>
    </div>
  )
}
