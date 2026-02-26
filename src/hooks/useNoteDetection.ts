'use client'

import { useEffect, useRef, useState } from 'react'
import { NoteMatch } from '@/types'

// MIDI note numbers for open strings
// string 1 = high e (E4 = MIDI 64), string 6 = low E (E2 = MIDI 40)
const OPEN_MIDI: Record<number, number> = {
  1: 64, // E4
  2: 59, // B3
  3: 55, // G3
  4: 50, // D3
  5: 45, // A2
  6: 40, // E2
}

/** Direct frequency → MIDI (standard formula, unrounded). */
function freqToMidiRaw(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440)
}

/**
 * Given a detected frequency, return the best-guess guitar string + fret
 * for *display* purposes. Picks the string whose open tuning gives the
 * closest fret position, with a max error of 0.45 semitones.
 */
function freqToStringFret(midi: number): { string: number; fret: number } | null {
  let bestString = -1
  let bestFret   = -1
  let bestError  = Infinity

  for (const [strNumStr, openMidi] of Object.entries(OPEN_MIDI)) {
    const fretRaw = midi - openMidi
    const fret    = Math.round(fretRaw)
    if (fret < 0 || fret > 22) continue
    const error = Math.abs(fretRaw - fret)
    if (error < bestError) {
      bestError  = error
      bestString = Number(strNumStr)
      bestFret   = fret
    }
  }

  // Reject if no string can produce this pitch within 0.45 semitones
  if (bestString === -1 || bestError > 0.45) return null
  return { string: bestString, fret: bestFret }
}

/** Compute RMS amplitude of a float32 buffer. */
function computeRms(buf: Float32Array): number {
  let sum = 0
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
  return Math.sqrt(sum / buf.length)
}

const HOLD_MS       = 120   // hold last valid detection through brief clarity dips
const RMS_THRESHOLD = 0.005 // silence gate — ignore near-silent input

interface UseNoteDetectionOptions {
  clarityThreshold?: number
  enabled?: boolean
}

export function useNoteDetection(
  stream: MediaStream | null,
  options: UseNoteDetectionOptions = {}
): NoteMatch | null {
  // 0.88 is slightly more lenient than the tuner (0.95) because we need to catch
  // the onset of plucked notes before the tone fully stabilizes
  const { clarityThreshold = 0.88, enabled = true } = options

  const [noteMatch, setNoteMatch] = useState<NoteMatch | null>(null)

  const audioCtxRef    = useRef<AudioContext | undefined>(undefined)
  const animRef        = useRef<number | undefined>(undefined)
  const lastValidRef   = useRef<{ match: NoteMatch; time: number } | null>(null)

  useEffect(() => {
    if (!stream || !enabled) {
      setNoteMatch(null)
      lastValidRef.current = null
      return
    }

    let cancelled = false

    async function setup() {
      const { PitchDetector } = await import('pitchy')

      if (cancelled) return

      const ctx = new AudioContext()
      audioCtxRef.current = ctx

      const source   = ctx.createMediaStreamSource(stream!)
      const analyser = ctx.createAnalyser()
      // 4096-point FFT: gives ~93ms analysis window which means ~7.7 periods
      // of E2 (82Hz) — needed for reliable low-string detection.
      // 2048 only gives ~3.8 periods of E2, causing frequent misses.
      analyser.fftSize = 4096
      source.connect(analyser)

      const buf      = new Float32Array(analyser.fftSize)
      const detector = PitchDetector.forFloat32Array(analyser.fftSize)

      function tick() {
        if (cancelled) return

        analyser.getFloatTimeDomainData(buf)

        // Silence gate — skip detection if input is near-silent
        const rms = computeRms(buf)
        if (rms < RMS_THRESHOLD) {
          lastValidRef.current = null
          setNoteMatch(null)
          animRef.current = requestAnimationFrame(tick)
          return
        }

        const [freq, clarity] = detector.findPitch(buf, ctx.sampleRate)

        // Guitar range: E2 (82Hz) low E string to ~B5 (988Hz) fret 19 on high e
        if (clarity > clarityThreshold && freq > 70 && freq < 1050) {
          const midiRaw = freqToMidiRaw(freq)
          const midi    = Math.round(midiRaw)
          const sf      = freqToStringFret(midiRaw)

          if (sf) {
            const match: NoteMatch = {
              midi,
              string:  sf.string,
              fret:    sf.fret,
              freq,
              clarity,
              matched: true,
            }
            lastValidRef.current = { match, time: performance.now() }
            setNoteMatch(match)
          }
        } else {
          // Not a clean detection — hold last valid result for HOLD_MS to avoid
          // dropping hits when clarity briefly dips mid-note
          const last = lastValidRef.current
          if (last && performance.now() - last.time < HOLD_MS) {
            setNoteMatch(last.match)
          } else {
            lastValidRef.current = null
            setNoteMatch(null)
          }
        }

        animRef.current = requestAnimationFrame(tick)
      }

      tick()
    }

    setup()

    return () => {
      cancelled = true
      if (animRef.current) cancelAnimationFrame(animRef.current)
      audioCtxRef.current?.close()
      audioCtxRef.current = undefined
      lastValidRef.current = null
    }
  }, [stream, enabled, clarityThreshold])

  return noteMatch
}
