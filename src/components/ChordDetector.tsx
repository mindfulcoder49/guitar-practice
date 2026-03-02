'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  NoteSalienceSmoother,
  buildNoteSalience, matchChordFromSalience,
  SALIENCE_SIZE,
} from '@/lib/chordDetection'
import { ChordMatch } from '@/types'

// Attack detection — only register a chord when a strum onset is detected.
const ATTACK_RATIO   = 1.8
const MIN_ATTACK_RMS = 0.003
const LOCK_MS        = 2000
const SLOW_RMS_ALPHA = 0.97

// Chroma concentration gate — white noise spreads energy evenly across all 12
// pitch classes. A guitar chord uses up to 6 strings, so up to 6 distinct pitch
// classes. We measure what fraction of total chroma energy lives in the top 6 bins.
// White noise ≈ 0.50 (6/12 equal bins). A chord concentrates energy in those 6
// bins and leaves the other 6 near zero, so it typically scores 0.70+.
const CHROMA_CONCENTRATION_THRESHOLD = 0.65

/** Returns the fraction of total chroma energy in the top 6 bins (0–1). */
function chromaConcentration(chroma: number[]): number {
  const total = chroma.reduce((a, b) => a + b, 0)
  if (total === 0) return 0
  const sorted = [...chroma].sort((a, b) => b - a)
  return (sorted[0] + sorted[1] + sorted[2] + sorted[3] + sorted[4] + sorted[5]) / total
}

interface ChordDetectorProps {
  stream: MediaStream | null
  targetChord?: string
  onChordDetected?: (match: ChordMatch | null) => void
  /** Called every audio frame with the smoothed salience vector.
   *  Use scoreChordFromSalience() on this for targeted hit detection. */
  onSalience?: (salience: number[]) => void
  children?: (match: ChordMatch | null) => React.ReactNode
}

export function ChordDetector({ stream, targetChord, onChordDetected, onSalience, children }: ChordDetectorProps) {
  const [currentMatch, setCurrentMatch] = useState<ChordMatch | null>(null)
  const [attackGate, setAttackGate]     = useState(true)
  const attackGateRef                   = useRef(true)
  const [chromaFlat, setChromaFlat]     = useState(false)

  const meydaRef      = useRef<unknown>(null)
  const smootherRef   = useRef(new NoteSalienceSmoother())
  const audioCtxRef   = useRef<AudioContext | null>(null)
  const sampleRateRef = useRef<number>(44100)
  const bufferSize    = 4096

  const slowRmsRef    = useRef<number>(0.001)
  const lastAttackRef = useRef<number>(-Infinity)
  const hasMatchRef   = useRef<boolean>(false)

  attackGateRef.current = attackGate

  const handleFeatures = useCallback((
    ampSpectrum: number[] | Float32Array,
    rms: number,
    chroma: number[],
  ) => {
    // ── Update slow-RMS baseline ────────────────────────────────────────────
    slowRmsRef.current =
      SLOW_RMS_ALPHA * slowRmsRef.current + (1 - SLOW_RMS_ALPHA) * rms

    // ── Detect strum attack ─────────────────────────────────────────────────
    const isAttack = rms >= MIN_ATTACK_RMS && rms >= slowRmsRef.current * ATTACK_RATIO

    if (isAttack) {
      smootherRef.current.reset()
      lastAttackRef.current = performance.now()
    }

    // ── Only detect chord within the lock window (skipped when gate is off) ─
    if (attackGateRef.current) {
      const timeSinceAttack = performance.now() - lastAttackRef.current
      if (timeSinceAttack > LOCK_MS) {
        if (hasMatchRef.current) {
          hasMatchRef.current = false
          setCurrentMatch(null)
          onChordDetected?.(null)
          onSalience?.(new Array(SALIENCE_SIZE).fill(0))
        }
        return
      }
    }

    // ── Chroma concentration gate — reject flat/noise-like signals ────────────
    const concentration = chromaConcentration(chroma)
    const isChordLike   = concentration >= CHROMA_CONCENTRATION_THRESHOLD
    setChromaFlat(!isChordLike)

    if (!isChordLike) {
      if (hasMatchRef.current) {
        hasMatchRef.current = false
        setCurrentMatch(null)
        onChordDetected?.(null)
        onSalience?.(new Array(SALIENCE_SIZE).fill(0))
      }
      return
    }

    // ── Note-salience detection ───────────────────────────────────────────────
    const salience = buildNoteSalience(ampSpectrum, sampleRateRef.current, bufferSize)
    const smoothed = smootherRef.current.push(salience)

    onSalience?.(smoothed)
    const match    = matchChordFromSalience(smoothed)
    hasMatchRef.current = match !== null
    setCurrentMatch(match)
    onChordDetected?.(match)
  }, [onChordDetected, onSalience])

  useEffect(() => {
    if (!stream) {
      slowRmsRef.current    = 0.001
      lastAttackRef.current = -Infinity
      hasMatchRef.current   = false
      return
    }

    async function setup() {
      const Meyda = (await import('meyda')).default
      const ctx   = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream!)

      sampleRateRef.current = ctx.sampleRate

      const analyzer = Meyda.createMeydaAnalyzer({
        audioContext: ctx,
        source,
        bufferSize: bufferSize,
        featureExtractors: ['amplitudeSpectrum', 'chroma', 'rms'],
        callback: (features: {
          amplitudeSpectrum?: Float32Array
          chroma?: number[]
          rms?: number
        }) => {
          if (features?.amplitudeSpectrum && features?.chroma) {
            handleFeatures(
              features.amplitudeSpectrum,
              features.rms ?? 0,
              features.chroma,
            )
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
  }, [stream, handleFeatures])

  // ── Custom render prop ──────────────────────────────────────────────────────
  if (children) return <>{children(currentMatch)}</>

  // ── Default render ──────────────────────────────────────────────────────────
  const confidence = currentMatch?.confidence ?? 0
  const isTarget   = currentMatch?.chord === targetChord

  return (
    <div className="p-4 rounded-lg border bg-card space-y-3">
      <div className="flex items-center justify-between">
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
            className={`h-full rounded-full transition-all duration-100 ${isTarget ? 'bg-green-500' : 'bg-primary'}`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Signal quality indicator */}
      <div className="text-xs text-center">
        {chromaFlat
          ? <span className="text-muted-foreground">Listening…</span>
          : <span className="text-green-600">Chord detected ✓</span>
        }
      </div>

      {/* Attack-gate toggle */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Attack gate: <span className={attackGate ? 'text-green-600' : 'text-yellow-500'}>{attackGate ? 'on' : 'off (continuous)'}</span>
        </span>
        <button
          onClick={() => setAttackGate(v => !v)}
          className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          {attackGate ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  )
}
