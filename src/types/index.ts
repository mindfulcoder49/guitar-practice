export interface ChordTemplate {
  name: string
  displayName: string
  chromagram: number[] // 12-element pitch-class vector [C, C#, D, D#, E, F, F#, G, G#, A, A#, B]
  fingers: FingerPosition[]
  barres: Barre[]
  startFret: number
  strings: number // 6 for standard guitar
  openStrings: number[] // 0=open, -1=muted
}

export interface FingerPosition {
  string: number  // 1-6 (1=high e, 6=low E)
  fret: number
  finger: number  // 1-4
}

export interface Barre {
  fret: number
  fromString: number
  toString: number
  finger: number
}

export interface ChordMatch {
  chord: string
  confidence: number
}

export interface ProgressionChord {
  chord: string
  beats: number
}

export interface PracticeSessionData {
  mode: 'flashcard' | 'guitar-hero'
  chordsPlayed: string[]
  score: number
}

export interface UserProgress {
  learnedChords: string[]
  recentSessions: {
    id: string
    mode: string
    score: number
    chordsPlayed: string[]
    createdAt: string
  }[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── Note / Song types ────────────────────────────────────────────────────────

export interface NoteEvent {
  string?: 1 | 2 | 3 | 4 | 5 | 6  // undefined when rest=true
  fret?: number                       // undefined when rest=true
  duration: number
  note?: string                       // optional computed note name e.g. "D3"
  rest?: boolean                      // if true, this is a silent rest
}

export interface PatternStep {
  string: 1 | 2 | 3 | 4 | 5 | 6
  duration: number
}

export interface Song {
  id: string
  title: string
  artist?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  type: 'melody'
  bpm: number
  notes: NoteEvent[]
  description?: string
}

export interface FingerpickPattern {
  id: string
  title: string
  chordName: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  type: 'fingerpick'
  bpm: number
  loops: number
  sequence: PatternStep[]
  description?: string
}

export type SongOrPattern = Song | FingerpickPattern

// AI-generated song types (no id — generated on the fly)
export interface AIMelody {
  type: 'melody'
  title: string
  bpm: number
  notes: NoteEvent[]
}

export interface AIFingerpick {
  type: 'fingerpick'
  title: string
  chordName: string
  bpm: number
  loops: number
  sequence: PatternStep[]
}

export type AISong = AIMelody | AIFingerpick

// ─── Detection ────────────────────────────────────────────────────────────────

export interface NoteMatch {
  midi: number     // MIDI note number — primary key for melody matching (±1 semitone)
  string: number   // best-guess string (for fingerpick matching + display only)
  fret: number     // best-guess fret (display only)
  freq: number
  clarity: number
  matched: boolean
}

export interface NoteBlock {
  id: string
  string: 1 | 2 | 3 | 4 | 5 | 6
  fret: number
  duration: number
  startTime: number
  hit?: boolean
  missed?: boolean
  pendingRetry?: boolean
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

export interface CatalogItem {
  id: string
  name: string
  type: 'chord-progression' | 'melody' | 'fingerpick'
  data: string   // JSON-stringified ProgressionChord[] or AISong
  createdAt: string
}
