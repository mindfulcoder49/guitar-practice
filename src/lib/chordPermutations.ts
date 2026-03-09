import { ChordTemplate } from '@/types'

export type ChordQuality = 'major' | 'minor'

export const ROOT_OPTIONS = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const

type RootName = (typeof ROOT_OPTIONS)[number]
export const FORM_ID_PREFIX = 'form:'

export const ROOT_LABELS: Record<RootName, string> = {
  C: 'C',
  'C#': 'C# / Db',
  D: 'D',
  'D#': 'D# / Eb',
  E: 'E',
  F: 'F',
  'F#': 'F# / Gb',
  G: 'G',
  'G#': 'G# / Ab',
  A: 'A',
  'A#': 'A# / Bb',
  B: 'B',
}

const ROOT_TO_PC: Record<RootName, number> = {
  C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5,
  'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
}

// String index: 0=Low E ... 5=High e
const OPEN_STRING_PCS = [4, 9, 2, 7, 11, 4]
const MIN_PLAYED_STRINGS = 4
const MIN_FRET = 0
const MAX_FRET = 9

function chordTones(rootPc: number, quality: ChordQuality): number[] {
  const third = quality === 'major' ? 4 : 3
  return [rootPc, (rootPc + third) % 12, (rootPc + 7) % 12]
}

function pitchClass(strIdx: number, fret: number): number {
  return (OPEN_STRING_PCS[strIdx] + fret) % 12
}

function chromagramFromTones(tones: number[]): number[] {
  const out = new Array(12).fill(0)
  for (const pc of tones) out[pc] = 1
  return out
}

function displayName(root: string, quality: ChordQuality): string {
  return quality === 'major' ? `${root} Major` : `${root} Minor`
}

function chordName(root: string, quality: ChordQuality): string {
  return quality === 'major' ? root : `${root}m`
}

function parseChordName(name: string): { root: RootName; quality: ChordQuality } | null {
  const m = name.match(/^([A-G])(#?)(m?)$/)
  if (!m) return null
  const root = `${m[1]}${m[2] ?? ''}` as RootName
  if (!(ROOT_OPTIONS as readonly string[]).includes(root)) return null
  return { root, quality: m[3] === 'm' ? 'minor' : 'major' }
}

function encodeShape(openStrings: number[]): string {
  return openStrings.map(f => (f < 0 ? 'x' : String(f))).join(',')
}

function decodeShape(encoded: string): number[] | null {
  const parts = encoded.split(',')
  if (parts.length !== 6) return null
  const out: number[] = []
  for (const p of parts) {
    if (p === 'x') {
      out.push(-1)
      continue
    }
    const n = Number(p)
    if (!Number.isInteger(n) || n < 0 || n > MAX_FRET) return null
    out.push(n)
  }
  return out
}

export function buildChordFormId(root: RootName, quality: ChordQuality, openStrings: number[]): string {
  return `${FORM_ID_PREFIX}${chordName(root, quality)}|${encodeShape(openStrings)}`
}

export function isChordFormId(value: string): boolean {
  return value.startsWith(FORM_ID_PREFIX)
}

export function baseChordNameFromValue(value: string): string {
  if (!isChordFormId(value)) return value
  const body = value.slice(FORM_ID_PREFIX.length)
  const sep = body.indexOf('|')
  return sep === -1 ? body : body.slice(0, sep)
}

export function parseChordFormId(formId: string): {
  baseChordName: string
  root: RootName
  quality: ChordQuality
  openStrings: number[]
} | null {
  if (!isChordFormId(formId)) return null
  const body = formId.slice(FORM_ID_PREFIX.length)
  const [base, shape] = body.split('|')
  if (!base || !shape) return null
  const parsed = parseChordName(base)
  if (!parsed) return null
  const openStrings = decodeShape(shape)
  if (!openStrings) return null
  return {
    baseChordName: base,
    root: parsed.root,
    quality: parsed.quality,
    openStrings,
  }
}

function isPlayableShape(openStrings: number[]): boolean {
  const fretted = openStrings.filter(f => f > 0)
  if (fretted.length === 0) return true

  // Conservative finger count: one finger per fretted string (no barre assumption).
  if (fretted.length > 4) return false

  // At most four distinct fret positions.
  const uniqueFrets = new Set(fretted)
  if (uniqueFrets.size > 4) return false

  // Fretted notes must fit within a 4-fret window (e.g. frets 2..5).
  const min = Math.min(...fretted)
  const max = Math.max(...fretted)
  return (max - min) <= 3
}

function assignFingerNumbers(openStrings: number[]): ChordTemplate['fingers'] {
  const fretted = openStrings
    .map((fret, idx) => ({ fret, string: idx + 1 }))
    .filter(x => x.fret > 0)

  const uniqueFrets = [...new Set(fretted.map(x => x.fret))].sort((a, b) => a - b)
  const fretToFinger = new Map<number, number>()
  uniqueFrets.forEach((fret, i) => {
    fretToFinger.set(fret, Math.min(4, i + 1))
  })

  return fretted.map(x => ({
    string: x.string,
    fret: x.fret,
    finger: fretToFinger.get(x.fret) ?? 1,
  }))
}

function makeTemplate(
  root: string,
  quality: ChordQuality,
  tones: number[],
  openStrings: number[],
): ChordTemplate {
  const fretted = openStrings.filter(f => f > 0)
  const startFret = fretted.length ? Math.min(...fretted) : 1

  return {
    name: chordName(root, quality),
    displayName: displayName(root, quality),
    chromagram: chromagramFromTones(tones),
    openStrings,
    fingers: assignFingerNumbers(openStrings),
    barres: [],
    startFret,
    strings: 6,
  }
}

export function generateChordPermutations(root: RootName, quality: ChordQuality): ChordTemplate[] {
  const rootPc = ROOT_TO_PC[root]
  const tones = chordTones(rootPc, quality)
  const toneSet = new Set(tones)
  const thirdPc = tones[1]

  const results = new Map<string, ChordTemplate>()

  for (let start = 0; start < 6; start++) {
    for (let end = start + MIN_PLAYED_STRINGS - 1; end < 6; end++) {
      const playedCount = end - start + 1
      if (playedCount < MIN_PLAYED_STRINGS) continue

      const candidatesPerString: number[][] = []
      for (let s = start; s <= end; s++) {
        const frets: number[] = []
        for (let fret = MIN_FRET; fret <= MAX_FRET; fret++) {
          if (toneSet.has(pitchClass(s, fret))) frets.push(fret)
        }
        if (frets.length === 0) {
          candidatesPerString.length = 0
          break
        }
        candidatesPerString.push(frets)
      }
      if (candidatesPerString.length === 0) continue

      const chosen = new Array(playedCount).fill(0)
      function backtrack(i: number) {
        if (i === playedCount) {
          const openStrings = new Array(6).fill(-1)
          for (let k = 0; k < playedCount; k++) {
            openStrings[start + k] = chosen[k]
          }

          const pcs = chosen.map((fret, idx) => pitchClass(start + idx, fret))
          const hasRoot = pcs.includes(rootPc)
          const hasThird = pcs.includes(thirdPc)
          if (!hasRoot || !hasThird) return

          const key = openStrings.join(',')
          if (!results.has(key) && isPlayableShape(openStrings)) {
            results.set(key, makeTemplate(root, quality, tones, openStrings))
          }
          return
        }

        for (const fret of candidatesPerString[i]) {
          chosen[i] = fret
          backtrack(i + 1)
        }
      }

      backtrack(0)
    }
  }

  return [...results.values()].sort((a, b) => {
    const af = a.openStrings.filter(f => f > 0)
    const bf = b.openStrings.filter(f => f > 0)
    const aStart = af.length ? Math.min(...af) : 0
    const bStart = bf.length ? Math.min(...bf) : 0
    if (aStart !== bStart) return aStart - bStart

    const aMuted = a.openStrings.filter(f => f < 0).length
    const bMuted = b.openStrings.filter(f => f < 0).length
    if (aMuted !== bMuted) return aMuted - bMuted

    return a.openStrings.join(',').localeCompare(b.openStrings.join(','))
  })
}

export function buildTemplateFromFormId(formId: string): ChordTemplate | undefined {
  const parsed = parseChordFormId(formId)
  if (!parsed) return undefined
  const rootPc = ROOT_TO_PC[parsed.root]
  const tones = chordTones(rootPc, parsed.quality)
  const template = makeTemplate(parsed.root, parsed.quality, tones, parsed.openStrings)
  return {
    ...template,
    name: parsed.baseChordName,
    displayName: parsed.quality === 'major' ? `${parsed.root} Major` : `${parsed.root} Minor`,
  }
}
