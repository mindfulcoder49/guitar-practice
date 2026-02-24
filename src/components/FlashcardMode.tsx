'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChordDiagram } from './ChordDiagram'
import { ChordDetector } from './ChordDetector'
import { MicrophoneSetup } from './MicrophoneSetup'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChordTemplate, ChordMatch } from '@/types'
import { CheckCircle, ChevronRight } from 'lucide-react'

interface FlashcardModeProps {
  chord: ChordTemplate
  onNext?: () => void
  onComplete?: (accuracy: number) => void
  hasNext?: boolean
}

// How long the student needs to hold the chord (ms)
const HOLD_DURATION_MS = 1500
// How long a dropout is forgiven before the hold timer resets (ms)
const GRACE_MS = 700

export function FlashcardMode({ chord, onNext, onComplete, hasNext }: FlashcardModeProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [currentMatch, setCurrentMatch] = useState<ChordMatch | null>(null)
  const [holdProgress, setHoldProgress] = useState(0)
  const [confirmed, setConfirmed] = useState(false)

  // Hold timer state — stored in refs to avoid re-creating the rAF loop
  const holdStartRef = useRef<number | null>(null)    // when the hold began
  const lastCorrectRef = useRef<number>(0)            // last time the right chord was detected
  const animRef = useRef<number | undefined>(undefined)
  const accuracyHistoryRef = useRef<number[]>([])
  const confirmedRef = useRef(false)

  // Keep a ref in sync with state so the rAF closure always sees the latest value
  const matchRef = useRef<ChordMatch | null>(null)
  matchRef.current = currentMatch

  const isCorrectDetection = useCallback((m: ChordMatch | null) =>
    m?.chord === chord.name, [chord.name])

  // Reset everything when the chord changes
  useEffect(() => {
    setConfirmed(false)
    confirmedRef.current = false
    setHoldProgress(0)
    holdStartRef.current = null
    lastCorrectRef.current = 0
    accuracyHistoryRef.current = []
  }, [chord.name])

  // Animation loop for the hold bar — runs independently of React render cycle
  useEffect(() => {
    function tick() {
      if (confirmedRef.current) return

      const now = performance.now()
      const match = matchRef.current
      const correct = isCorrectDetection(match)

      if (correct) {
        lastCorrectRef.current = now
        if (match) accuracyHistoryRef.current.push(match.confidence)

        if (holdStartRef.current === null) holdStartRef.current = now

        const elapsed = now - holdStartRef.current
        const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100)
        setHoldProgress(progress)

        if (elapsed >= HOLD_DURATION_MS) {
          confirmedRef.current = true
          setConfirmed(true)
          const hist = accuracyHistoryRef.current
          const avg = hist.length ? hist.reduce((a, b) => a + b, 0) / hist.length : 0.7
          onComplete?.(avg)
          return
        }
      } else {
        const timeSinceCorrect = now - lastCorrectRef.current
        if (timeSinceCorrect > GRACE_MS) {
          // Grace period expired — reset the hold bar
          holdStartRef.current = null
          setHoldProgress(0)
        }
        // else: hold bar pauses silently during the grace window
      }

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [chord.name, isCorrectDetection, onComplete])

  const isCorrect = isCorrectDetection(currentMatch)

  return (
    <div className="flex flex-col gap-6">
      <ChordDiagram chord={chord} size="lg" />

      <MicrophoneSetup onStream={setStream} />

      {stream && (
        <ChordDetector
          stream={stream}
          targetChord={chord.name}
          onChordDetected={setCurrentMatch}
        />
      )}

      {/* Hold progress — visible while the right chord is held OR during grace period */}
      {(isCorrect || holdProgress > 0) && !confirmed && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-muted-foreground'}`}>
              {isCorrect ? 'Sounds good — keep holding…' : 'Keep going…'}
            </span>
            <span className="text-muted-foreground text-xs">{Math.round(holdProgress)}%</span>
          </div>
          <Progress value={holdProgress} className="h-2.5" />
        </div>
      )}

      {confirmed && (
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Nice work!</p>
            <p className="text-sm text-green-600">{chord.displayName} is in the bag.</p>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        {hasNext && (
          <Button
            onClick={onNext}
            variant={confirmed ? 'default' : 'outline'}
            className="gap-2"
          >
            Next Chord
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
