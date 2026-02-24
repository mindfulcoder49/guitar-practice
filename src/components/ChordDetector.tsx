'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ChromagramSmoother, matchChord } from '@/lib/chordDetection'
import { ChordMatch } from '@/types'

interface ChordDetectorProps {
  stream: MediaStream | null
  targetChord?: string
  onChordDetected?: (match: ChordMatch | null) => void
  children?: (match: ChordMatch | null) => React.ReactNode
}

export function ChordDetector({ stream, targetChord, onChordDetected, children }: ChordDetectorProps) {
  const [currentMatch, setCurrentMatch] = useState<ChordMatch | null>(null)
  const meydaRef = useRef<unknown>(null)
  const smootherRef = useRef(new ChromagramSmoother())
  const audioCtxRef = useRef<AudioContext | null>(null)

  const handleChroma = useCallback((chroma: number[]) => {
    const smoothed = smootherRef.current.push(chroma)
    const match = matchChord(smoothed)
    setCurrentMatch(match)
    onChordDetected?.(match)
  }, [onChordDetected])

  useEffect(() => {
    if (!stream) return

    let analyzer: unknown = null

    async function setup() {
      const Meyda = (await import('meyda')).default
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream!)

      analyzer = Meyda.createMeydaAnalyzer({
        audioContext: ctx,
        source,
        bufferSize: 4096,
        featureExtractors: ['chroma'],
        callback: (features: { chroma?: number[] }) => {
          if (features?.chroma) {
            handleChroma(features.chroma)
          }
        },
      })
      ;(analyzer as { start: () => void }).start()
      meydaRef.current = analyzer
    }

    setup()

    return () => {
      if (meydaRef.current) {
        (meydaRef.current as { stop: () => void }).stop()
        meydaRef.current = null
      }
      audioCtxRef.current?.close()
      smootherRef.current.reset()
    }
  }, [stream, handleChroma])

  if (children) return <>{children(currentMatch)}</>

  const confidence = currentMatch?.confidence ?? 0
  const isTarget = currentMatch?.chord === targetChord

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">Detected Chord</span>
        <span className={`text-2xl font-bold ${isTarget ? 'text-green-500' : 'text-foreground'}`}>
          {currentMatch?.chord ?? '—'}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Confidence</span>
          <span>{Math.round(confidence * 100)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-100 ${
              isTarget ? 'bg-green-500' : 'bg-primary'
            }`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
