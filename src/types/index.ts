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
