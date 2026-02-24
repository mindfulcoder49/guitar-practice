import { CHORD_TEMPLATES, CURRICULUM_ORDER } from './chords'
import { ChordMatch } from '@/types'

const ROLLING_WINDOW = 15   // more frames = smoother, less jittery
const DETECTION_THRESHOLD = 0.55  // lenient — soft strums still register

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  if (denom === 0) return 0
  return dot / denom
}

function normalize(vec: number[]): number[] {
  const max = Math.max(...vec)
  if (max === 0) return vec
  return vec.map(v => v / max)
}

export function matchChord(chromagram: number[]): ChordMatch | null {
  const normalizedInput = normalize(chromagram)
  let bestMatch: ChordMatch | null = null

  for (const chordName of CURRICULUM_ORDER) {
    const template = CHORD_TEMPLATES[chordName]
    if (!template) continue
    const similarity = cosineSimilarity(normalizedInput, template.chromagram)
    if (!bestMatch || similarity > bestMatch.confidence) {
      bestMatch = { chord: chordName, confidence: similarity }
    }
  }

  if (bestMatch && bestMatch.confidence >= DETECTION_THRESHOLD) {
    return bestMatch
  }
  return null
}

export class ChromagramSmoother {
  private window: number[][] = []
  private windowSize: number

  constructor(windowSize = ROLLING_WINDOW) {
    this.windowSize = windowSize
  }

  push(frame: number[]): number[] {
    this.window.push(frame)
    if (this.window.length > this.windowSize) {
      this.window.shift()
    }
    return this.getAverage()
  }

  getAverage(): number[] {
    if (this.window.length === 0) return new Array(12).fill(0)
    const avg = new Array(12).fill(0)
    for (const frame of this.window) {
      for (let i = 0; i < 12; i++) {
        avg[i] += frame[i]
      }
    }
    return avg.map(v => v / this.window.length)
  }

  reset() {
    this.window = []
  }
}
