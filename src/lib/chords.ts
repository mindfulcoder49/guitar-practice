import { ChordTemplate } from '@/types'

// Pitch class indices: C=0, C#=1, D=2, D#=3, E=4, F=5, F#=6, G=7, G#=8, A=9, A#=10, B=11

// LAYOUT CONVENTION used throughout this file:
//   string position 1 = Low E (leftmost in diagram)
//   string position 6 = High e (rightmost in diagram)
//   Visual order left → right: E · A · D · G · B · e
//
// openStrings[]: index 0 = Low E … index 5 = High e
//   0  = open string  → draw ○ above nut
//  -1  = muted/skip   → draw × above nut
//  >0  = fretted      → no symbol (finger dot shows the fret)
//
// fingers[].string: same 1–6 convention (1=Low E, 6=High e)

export const CHORD_TEMPLATES: Record<string, ChordTemplate> = {
  Em: {
    name: 'Em',
    displayName: 'E Minor',
    // E minor: E(4), G(7), B(11)
    chromagram: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
    //           E   A   D   G   B   e  (open/muted/fretted)
    openStrings: [0, 2, 2, 0, 0, 0],
    // Low E: open  A: fret2  D: fret2  G: open  B: open  e: open
    fingers: [
      { string: 2, fret: 2, finger: 2 }, // middle on A string
      { string: 3, fret: 2, finger: 3 }, // ring on D string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  Am: {
    name: 'Am',
    displayName: 'A Minor',
    // A minor: A(9), C(0), E(4)
    chromagram: [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    //            E   A   D   G   B   e
    openStrings: [-1, 0, 2, 2, 1, 0],
    // Low E: mute  A: open  D: fret2  G: fret2  B: fret1  e: open
    fingers: [
      { string: 5, fret: 1, finger: 1 }, // index on B string
      { string: 3, fret: 2, finger: 2 }, // middle on D string
      { string: 4, fret: 2, finger: 3 }, // ring on G string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  E: {
    name: 'E',
    displayName: 'E Major',
    // E major: E(4), G#(8), B(11)
    chromagram: [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
    //            E   A   D   G   B   e
    openStrings: [0, 2, 2, 1, 0, 0],
    // Low E: open  A: fret2  D: fret2  G: fret1  B: open  e: open
    fingers: [
      { string: 4, fret: 1, finger: 1 }, // index on G string
      { string: 2, fret: 2, finger: 2 }, // middle on A string
      { string: 3, fret: 2, finger: 3 }, // ring on D string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  A: {
    name: 'A',
    displayName: 'A Major',
    // A major: A(9), C#(1), E(4)
    chromagram: [0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    //            E   A   D   G   B   e
    openStrings: [-1, 0, 2, 2, 2, 0],
    // Low E: mute  A: open  D: fret2  G: fret2  B: fret2  e: open
    fingers: [
      { string: 3, fret: 2, finger: 2 }, // middle on D string
      { string: 4, fret: 2, finger: 3 }, // ring on G string
      { string: 5, fret: 2, finger: 4 }, // pinky on B string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  D: {
    name: 'D',
    displayName: 'D Major',
    // D major: D(2), F#(6), A(9)
    chromagram: [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    //            E   A   D   G   B   e
    openStrings: [-1, -1, 0, 2, 3, 2],
    // Low E: mute  A: mute  D: open  G: fret2  B: fret3  e: fret2
    fingers: [
      { string: 4, fret: 2, finger: 1 }, // index on G string
      { string: 5, fret: 3, finger: 3 }, // ring on B string
      { string: 6, fret: 2, finger: 2 }, // middle on high e string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  G: {
    name: 'G',
    displayName: 'G Major',
    // G major: G(7), B(11), D(2)
    chromagram: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    //            E   A   D   G   B   e
    openStrings: [3, 2, 0, 0, 3, 3],
    // Low E: fret3  A: fret2  D: open  G: open  B: fret3  e: fret3
    fingers: [
      { string: 2, fret: 2, finger: 1 }, // index on A string
      { string: 1, fret: 3, finger: 2 }, // middle on Low E string
      { string: 5, fret: 3, finger: 3 }, // ring on B string
      { string: 6, fret: 3, finger: 4 }, // pinky on high e string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  C: {
    name: 'C',
    displayName: 'C Major',
    // C major: C(0), E(4), G(7)
    chromagram: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
    //            E   A   D   G   B   e
    openStrings: [-1, 3, 2, 0, 1, 0],
    // Low E: mute  A: fret3  D: fret2  G: open  B: fret1  e: open
    fingers: [
      { string: 5, fret: 1, finger: 1 }, // index on B string
      { string: 3, fret: 2, finger: 2 }, // middle on D string
      { string: 2, fret: 3, finger: 3 }, // ring on A string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  Dm: {
    name: 'Dm',
    displayName: 'D Minor',
    // D minor: D(2), F(5), A(9)
    chromagram: [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    //            E   A   D   G   B   e
    openStrings: [-1, -1, 0, 2, 3, 1],
    // Low E: mute  A: mute  D: open  G: fret2  B: fret3  e: fret1
    fingers: [
      { string: 6, fret: 1, finger: 1 }, // index on high e string
      { string: 4, fret: 2, finger: 2 }, // middle on G string
      { string: 5, fret: 3, finger: 3 }, // ring on B string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  F: {
    name: 'F',
    displayName: 'F Major',
    // F major: F(5), A(9), C(0)
    chromagram: [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    //            E   A   D   G   B   e
    openStrings: [1, 3, 3, 2, 1, 1],
    // All strings fretted — no open or muted symbols
    fingers: [
      { string: 4, fret: 2, finger: 2 }, // middle on G string
      { string: 3, fret: 3, finger: 4 }, // pinky on D string
      { string: 2, fret: 3, finger: 3 }, // ring on A string
    ],
    barres: [
      { fret: 1, fromString: 1, toString: 6, finger: 1 }, // index finger bars all strings at fret 1
    ],
    startFret: 1,
    strings: 6,
  },

  // ── 7th chords & variations ──────────────────────────────────────────────────

  Em7: {
    name: 'Em7',
    displayName: 'E Minor 7',
    // E minor 7: E(4), G(7), B(11), D(2)
    chromagram: [0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1],
    //            E   A   D   G   B   e
    openStrings: [0, 2, 0, 0, 0, 0],
    // Low E: open  A: fret2  D: open(D=7th!)  G: open  B: open  e: open
    fingers: [
      { string: 2, fret: 2, finger: 2 }, // middle on A string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  A7: {
    name: 'A7',
    displayName: 'A Dominant 7',
    // A dominant 7: A(9), C#(1), E(4), G(7)
    chromagram: [0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
    //            E   A   D   G   B   e
    openStrings: [-1, 0, 2, 0, 2, 0],
    // Low E: mute  A: open  D: fret2  G: open(G=7th!)  B: fret2  e: open
    fingers: [
      { string: 3, fret: 2, finger: 2 }, // middle on D string
      { string: 5, fret: 2, finger: 3 }, // ring on B string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  E7: {
    name: 'E7',
    displayName: 'E Dominant 7',
    // E dominant 7: E(4), G#(8), B(11), D(2)
    chromagram: [0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1],
    //            E   A   D   G   B   e
    openStrings: [0, 2, 0, 1, 0, 0],
    // Low E: open  A: fret2  D: open(D=7th!)  G: fret1  B: open  e: open
    fingers: [
      { string: 4, fret: 1, finger: 1 }, // index on G string
      { string: 2, fret: 2, finger: 2 }, // middle on A string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  Am7: {
    name: 'Am7',
    displayName: 'A Minor 7',
    // A minor 7: A(9), C(0), E(4), G(7)
    chromagram: [1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
    //            E   A   D   G   B   e
    openStrings: [-1, 0, 2, 0, 1, 0],
    // Low E: mute  A: open  D: fret2  G: open(G=7th!)  B: fret1  e: open
    fingers: [
      { string: 5, fret: 1, finger: 1 }, // index on B string
      { string: 3, fret: 2, finger: 2 }, // middle on D string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  D7: {
    name: 'D7',
    displayName: 'D Dominant 7',
    // D dominant 7: D(2), F#(6), A(9), C(0)
    chromagram: [1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    //            E   A   D   G   B   e
    openStrings: [-1, -1, 0, 2, 1, 2],
    // Low E: mute  A: mute  D: open  G: fret2  B: fret1  e: fret2
    fingers: [
      { string: 5, fret: 1, finger: 1 }, // index on B string
      { string: 4, fret: 2, finger: 2 }, // middle on G string
      { string: 6, fret: 2, finger: 3 }, // ring on high e string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  Cmaj7: {
    name: 'Cmaj7',
    displayName: 'C Major 7',
    // C major 7: C(0), E(4), G(7), B(11)
    chromagram: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
    //            E   A   D   G   B   e
    openStrings: [-1, 3, 2, 0, 0, 0],
    // Low E: mute  A: fret3  D: fret2  G: open  B: open(B=7th!)  e: open
    fingers: [
      { string: 3, fret: 2, finger: 2 }, // middle on D string
      { string: 2, fret: 3, finger: 3 }, // ring on A string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  Fmaj7: {
    name: 'Fmaj7',
    displayName: 'F Major 7',
    // F major 7: F(5), A(9), C(0), E(4)
    chromagram: [1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0],
    //            E   A   D   G   B   e
    openStrings: [-1, -1, 3, 2, 1, 0],
    // Low E: mute  A: mute  D: fret3  G: fret2  B: fret1  e: open(E=7th!)
    fingers: [
      { string: 5, fret: 1, finger: 1 }, // index on B string
      { string: 4, fret: 2, finger: 2 }, // middle on G string
      { string: 3, fret: 3, finger: 3 }, // ring on D string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  B7: {
    name: 'B7',
    displayName: 'B Dominant 7',
    // B dominant 7: B(11), D#(3), F#(6), A(9)
    chromagram: [0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1],
    //            E   A   D   G   B   e
    openStrings: [-1, 2, 1, 2, 0, 2],
    // Low E: mute  A: fret2  D: fret1  G: fret2  B: open  e: fret2
    fingers: [
      { string: 3, fret: 1, finger: 1 }, // index on D string
      { string: 2, fret: 2, finger: 2 }, // middle on A string
      { string: 4, fret: 2, finger: 3 }, // ring on G string
      { string: 6, fret: 2, finger: 4 }, // pinky on high e string
    ],
    barres: [],
    startFret: 1,
    strings: 6,
  },

  Bm: {
    name: 'Bm',
    displayName: 'B Minor',
    // B minor: B(11), D(2), F#(6)
    chromagram: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    //            E   A   D   G   B   e
    openStrings: [-1, 2, 4, 4, 3, 2],
    // Low E: mute  A: fret2  D: fret4  G: fret4  B: fret3  e: fret2
    fingers: [
      { string: 5, fret: 3, finger: 2 }, // middle on B string
      { string: 4, fret: 4, finger: 3 }, // ring on G string
      { string: 3, fret: 4, finger: 4 }, // pinky on D string
    ],
    barres: [
      { fret: 2, fromString: 2, toString: 6, finger: 1 }, // index bars A–e at fret 2
    ],
    startFret: 2,
    strings: 6,
  },
}

// Curriculum order: easy → harder
export const CURRICULUM_ORDER = [
  // Open major & minor (beginner)
  'Em', 'Am', 'E', 'A', 'D', 'G', 'C', 'Dm',
  // Barre chord (intermediate)
  'F',
  // 7th chords — mostly open position, great for blues/folk/pop
  'Em7', 'A7', 'E7', 'Am7', 'D7',
  // Maj7 variations (pretty, not harder than their major counterparts)
  'Cmaj7', 'Fmaj7',
  // Dominant 7th requiring 4 fingers / barre
  'B7', 'Bm',
]

export const ALL_CHORDS = Object.values(CHORD_TEMPLATES)

export function getChord(name: string): ChordTemplate | undefined {
  return CHORD_TEMPLATES[name]
}

export function getCurriculumChords(): ChordTemplate[] {
  return CURRICULUM_ORDER.map(name => CHORD_TEMPLATES[name]).filter(Boolean)
}

export function getNextChord(currentChord: string): string | null {
  const idx = CURRICULUM_ORDER.indexOf(currentChord)
  if (idx === -1 || idx === CURRICULUM_ORDER.length - 1) return null
  return CURRICULUM_ORDER[idx + 1]
}
