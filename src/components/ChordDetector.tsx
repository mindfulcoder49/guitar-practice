'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ChromagramSmoother, matchChord } from '@/lib/chordDetection'
import { ChordMatch } from '@/types'

// Number of Meyda frames to collect for noise calibration.
// At bufferSize=4096 / sampleRate=44100 ≈ 10.8 frames/sec → ~25 frames ≈ 2.3 s
const CALIBRATION_FRAMES = 25

interface CalibrationState {
  calibrating: boolean
  calibrated: boolean
  recalibrate: () => void
}

interface ChordDetectorProps {
  stream: MediaStream | null
  targetChord?: string
  onChordDetected?: (match: ChordMatch | null) => void
  children?: (match: ChordMatch | null, cal?: CalibrationState) => React.ReactNode
}

export function ChordDetector({ stream, targetChord, onChordDetected, children }: ChordDetectorProps) {
  const [currentMatch, setCurrentMatch] = useState<ChordMatch | null>(null)
  const [calibrating, setCalibrating]   = useState(false)
  const [calibrated, setCalibrated]     = useState(false)

  const meydaRef       = useRef<unknown>(null)
  const smootherRef    = useRef(new ChromagramSmoother())
  const audioCtxRef    = useRef<AudioContext | null>(null)
  const noiseFloorRef  = useRef<number[]>(new Array(12).fill(0))
  const calibFramesRef = useRef<number[][]>([])
  const calibratingRef = useRef(false)   // ref copy so the Meyda callback can read it

  // Kick off a fresh 2-second noise sample
  const startCalibration = useCallback(() => {
    calibFramesRef.current = []
    calibratingRef.current = true
    setCalibrated(false)
    setCalibrating(true)
    setCurrentMatch(null)
    smootherRef.current.reset()
  }, [])

  const handleChroma = useCallback((chroma: number[]) => {
    if (calibratingRef.current) {
      // Accumulate noise frames
      calibFramesRef.current.push(chroma)

      if (calibFramesRef.current.length >= CALIBRATION_FRAMES) {
        // Compute per-pitch-class average as the noise floor
        const floor = new Array(12).fill(0)
        for (const frame of calibFramesRef.current) {
          for (let i = 0; i < 12; i++) floor[i] += frame[i]
        }
        noiseFloorRef.current = floor.map(v => v / calibFramesRef.current.length)
        calibFramesRef.current  = []
        calibratingRef.current  = false
        setCalibrating(false)
        setCalibrated(true)
      }
      // Don't run detection during calibration
      return
    }

    // Subtract noise floor — clamp to 0 so values stay non-negative
    const denoised = chroma.map((v, i) => Math.max(0, v - noiseFloorRef.current[i]))

    const smoothed = smootherRef.current.push(denoised)
    const match    = matchChord(smoothed)
    setCurrentMatch(match)
    onChordDetected?.(match)
  }, [onChordDetected])

  useEffect(() => {
    if (!stream) {
      setCalibrating(false)
      setCalibrated(false)
      noiseFloorRef.current = new Array(12).fill(0)
      return
    }

    let analyzer: unknown = null

    async function setup() {
      const Meyda = (await import('meyda')).default
      const ctx   = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream!)

      analyzer = Meyda.createMeydaAnalyzer({
        audioContext: ctx,
        source,
        bufferSize: 4096,
        featureExtractors: ['chroma'],
        callback: (features: { chroma?: number[] }) => {
          if (features?.chroma) handleChroma(features.chroma)
        },
      })
      ;(analyzer as { start: () => void }).start()
      meydaRef.current = analyzer

      // Auto-calibrate as soon as the mic opens — captures whatever background
      // noise is present (space heaters, fans, hum, etc.)
      startCalibration()
    }

    setup()

    return () => {
      if (meydaRef.current) {
        (meydaRef.current as { stop: () => void }).stop()
        meydaRef.current = null
      }
      audioCtxRef.current?.close()
      smootherRef.current.reset()
      calibratingRef.current = false
    }
  }, [stream, handleChroma, startCalibration])

  const calState: CalibrationState = { calibrating, calibrated, recalibrate: startCalibration }

  // ── Custom render prop ──────────────────────────────────────────────────────
  if (children) return <>{children(currentMatch, calState)}</>

  // ── Default render ──────────────────────────────────────────────────────────
  const confidence = currentMatch?.confidence ?? 0
  const isTarget   = currentMatch?.chord === targetChord

  return (
    <div className="p-4 rounded-lg border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Detected Chord</span>
        <span className={`text-2xl font-bold ${isTarget ? 'text-green-500' : 'text-foreground'}`}>
          {calibrating ? '…' : (currentMatch?.chord ?? '—')}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Confidence</span>
          <span>{Math.round(confidence * 100)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-100 ${isTarget ? 'bg-green-500' : 'bg-primary'}`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Noise calibration status */}
      <div className="flex items-center justify-between text-xs">
        {calibrating ? (
          <span className="text-yellow-500 animate-pulse">Sampling background noise… stay quiet</span>
        ) : calibrated ? (
          <span className="text-green-600">Noise reduced ✓</span>
        ) : (
          <span className="text-muted-foreground">No calibration</span>
        )}
        {!calibrating && (
          <button
            onClick={startCalibration}
            className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            {calibrated ? 'Recalibrate' : 'Calibrate noise'}
          </button>
        )}
      </div>
    </div>
  )
}
