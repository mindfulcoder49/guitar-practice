import { CHORD_TEMPLATES, CURRICULUM_ORDER, getChordMidiNotes } from './chords'
import { ChordMatch } from '@/types'

// ─── Note-salience vector ──────────────────────────────────────────────────────
// Guitar range: MIDI 40 (E2) → MIDI 88 (E6).
// Extended upper limit so harmonics of lower strings are captured
// (e.g. E2's 5th harmonic is G#4 = MIDI 68; 8th harmonic ≈ E5 = MIDI 76).
export const GUITAR_MIDI_MIN = 40
export const GUITAR_MIDI_MAX = 88
export const SALIENCE_SIZE = GUITAR_MIDI_MAX - GUITAR_MIDI_MIN + 1   // 49 bins

// Sørensen-Dice coefficient: 2·dot(a,b) / (|a|² + |b|²)
// Penalises a template for having notes NOT present in the detection,
// so superset chords (Fmaj7 ⊇ Am) can't outscore the simpler match.
function diceSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = normA + normB
  return denom === 0 ? 0 : (2 * dot) / denom
}

// ─── Harmonic-enriched chord templates ────────────────────────────────────────
// Each chord note produces a harmonic series (partials 1–6) in the FFT.
// Templates include the expected harmonic partial energy so the matcher can
// distinguish chords whose fretted notes overlap but whose harmonic fingerprints
// diverge (e.g. E major vs Cmaj7 — E2's harmonics hit bins Cmaj7 doesn't own).
//
// Weights follow a 1/n decay (same as an ideal string).  We use Math.max so
// overlapping harmonics from different strings don't inflate the template.
const HARMONIC_PARTIALS = [
  { n: 1, w: 1.00 },
  { n: 2, w: 0.50 },
  { n: 3, w: 0.33 },
  { n: 4, w: 0.25 },
  { n: 5, w: 0.20 },
  { n: 6, w: 0.17 },
]

const NOTE_TEMPLATES: Record<string, number[]> = (() => {
  const out: Record<string, number[]> = {}
  for (const name of CURRICULUM_ORDER) {
    const chord = CHORD_TEMPLATES[name]
    if (!chord) continue
    const vec = new Array(SALIENCE_SIZE).fill(0)
    for (const midi of getChordMidiNotes(chord)) {
      const baseFreq = 440 * Math.pow(2, (midi - 69) / 12)
      for (const { n, w } of HARMONIC_PARTIALS) {
        const hFreq = baseFreq * n
        const hMidi = Math.round(69 + 12 * Math.log2(hFreq / 440))
        const idx   = hMidi - GUITAR_MIDI_MIN
        if (idx >= 0 && idx < SALIENCE_SIZE) {
          vec[idx] = Math.max(vec[idx], w)   // max avoids double-counting
        }
      }
    }
    out[name] = vec
  }
  return out
})()

// ─── Note-salience extraction from FFT ────────────────────────────────────────
/**
 * Converts Meyda's amplitudeSpectrum (one magnitude per FFT bin) into a
 * 49-element note-salience vector, one bin per semitone in the guitar range.
 * Each bin accumulates the magnitude of every FFT bin whose frequency maps to
 * that semitone, weighted by how close it is to the semitone's center frequency.
 */
export function buildNoteSalience(
  ampSpectrum: number[] | Float32Array,
  sampleRate: number,
  bufferSize: number,
): number[] {
  const freqPerBin = sampleRate / bufferSize
  const salience   = new Array(SALIENCE_SIZE).fill(0)

  for (let binIdx = 1; binIdx < ampSpectrum.length; binIdx++) {
    const freq = binIdx * freqPerBin
    if (freq < 70 || freq > 2500) continue   // covers fundamentals + harmonics

    const midiExact = 69 + 12 * Math.log2(freq / 440)
    const midi      = Math.round(midiExact)
    const idx       = midi - GUITAR_MIDI_MIN

    if (idx >= 0 && idx < SALIENCE_SIZE) {
      // Weight by proximity to semitone centre (reduces bleed from adjacent bins)
      const proximity = 1 - Math.abs(midiExact - midi)
      salience[idx] += (ampSpectrum[binIdx] as number) * proximity
    }
  }
  return salience
}

// ─── Smoother ─────────────────────────────────────────────────────────────────
// Shorter window than chroma (5 vs 15 frames) — note-salience is already more
// specific, so less temporal averaging is needed.
const ROLLING_WINDOW = 5

export class NoteSalienceSmoother {
  private window: number[][] = []
  private readonly windowSize: number

  constructor(windowSize = ROLLING_WINDOW) {
    this.windowSize = windowSize
  }

  push(frame: number[]): number[] {
    this.window.push(frame)
    if (this.window.length > this.windowSize) this.window.shift()
    return this.getAverage()
  }

  getAverage(): number[] {
    if (this.window.length === 0) return new Array(SALIENCE_SIZE).fill(0)
    const avg = new Array(SALIENCE_SIZE).fill(0)
    for (const frame of this.window) {
      for (let i = 0; i < SALIENCE_SIZE; i++) avg[i] += frame[i]
    }
    return avg.map(v => v / this.window.length)
  }

  reset() { this.window = [] }
}

// ─── Chord matching ────────────────────────────────────────────────────────────
const NOTE_DETECTION_THRESHOLD = 0.35

/**
 * Targeted scoring: how well does `salience` match one specific chord?
 * Use this instead of matchChordFromSalience when you already know which chord
 * to look for (e.g. practice mode, flashcard) — avoids the blind ranking problem
 * where a similar chord with fewer notes beats the real one.
 */
export function scoreChordFromSalience(salience: number[], chordName: string): number {
  const template = NOTE_TEMPLATES[chordName]
  if (!template) return 0
  const max = Math.max(...salience)
  if (max === 0) return 0
  return diceSimilarity(salience.map(v => v / max), template)
}

export function matchChordFromSalience(salience: number[]): ChordMatch | null {
  const max = Math.max(...salience)
  if (max === 0) return null
  const normalized = salience.map(v => v / max)

  let best: ChordMatch | null = null
  for (const name of CURRICULUM_ORDER) {
    const template = NOTE_TEMPLATES[name]
    if (!template) continue
    const score = diceSimilarity(normalized, template)
    if (!best || score > best.confidence) best = { chord: name, confidence: score }
  }

  return best && best.confidence >= NOTE_DETECTION_THRESHOLD ? best : null
}

// ─── Legacy chroma-based API (kept for the debug display in ChordDetector) ────
export class ChromagramSmoother {
  private window: number[][] = []
  private readonly windowSize: number

  constructor(windowSize = 15) { this.windowSize = windowSize }

  push(frame: number[]): number[] {
    this.window.push(frame)
    if (this.window.length > this.windowSize) this.window.shift()
    return this.getAverage()
  }

  getAverage(): number[] {
    if (this.window.length === 0) return new Array(12).fill(0)
    const avg = new Array(12).fill(0)
    for (const frame of this.window) for (let i = 0; i < 12; i++) avg[i] += frame[i]
    return avg.map(v => v / this.window.length)
  }

  reset() { this.window = [] }
}
