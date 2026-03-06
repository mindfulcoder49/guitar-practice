import { Song, FingerpickPattern, SongOrPattern, NoteEvent } from '@/types'

// Shorthand helpers — keeps note arrays readable
// n(string, fret, duration) = a note event
// r(duration) = a rest event
function n(str: 1|2|3|4|5|6, fret: number, dur: number): NoteEvent {
  return { string: str, fret, duration: dur }
}
function r(dur: number): NoteEvent {
  return { rest: true, duration: dur }
}

// ─── Verified note positions (string, fret → MIDI = OPEN_MIDI[str] + fret) ────
// str6=E2(40), str5=A2(45), str4=D3(50), str3=G3(55), str2=B3(59), str1=E4(64)
//
// str4: f0=D3 f2=E3 f3=F3 f4=F#3 f5=G3 f6=Ab3 f9=B3 f11=C#4 f12=D4
// str5: f2=B2 f3=C3 f5=D3 f6=Eb3 f7=E3 f10=G3 f11=Ab3 f12=A3
// str3: f0=G3 f2=A3 f4=B3
// str2: f0=B3 f1=C4 f2=C#4 f3=D4
// str1: f0=E4 f2=F#4 f3=G4

export const SONGS: Song[] = [
  // ── Smoke on the Water (full main riff cycle) ──────────────────────────────
  // All on D string (str4). Main motif repeated with a turnaround.
  {
    id: 'smoke-on-the-water',
    title: 'Smoke on the Water',
    artist: 'Deep Purple',
    difficulty: 'beginner',
    type: 'melody',
    bpm: 108,
    description: 'Complete main riff cycle with repeats and a turnaround, all on one string.',
    notes: [
      // Cycle 1
      n(4, 0, 1),    // D3
      n(4, 3, 0.5),  // F3
      n(4, 5, 1.5),  // G3
      r(1),
      n(4, 0, 1),    // D3
      n(4, 3, 0.5),  // F3
      n(4, 6, 0.5),  // Ab3
      n(4, 5, 1.5),  // G3
      r(0.5),
      n(4, 0, 1),    // D3
      n(4, 3, 0.5),  // F3
      n(4, 5, 1),    // G3
      n(4, 3, 0.5),  // F3
      n(4, 0, 2),    // D3
      r(1),

      // Cycle 2
      n(4, 0, 1), n(4, 3, 0.5), n(4, 5, 1.5), r(1),
      n(4, 0, 1), n(4, 3, 0.5), n(4, 6, 0.5), n(4, 5, 1.5), r(0.5),
      n(4, 0, 1), n(4, 3, 0.5), n(4, 5, 1), n(4, 3, 0.5), n(4, 0, 1.5),

      // Turnaround
      n(4, 0, 0.5), n(4, 3, 0.5), n(4, 5, 0.5), n(4, 3, 0.5), n(4, 0, 2.5),
    ],
  },

  // ── Happy Birthday ──────────────────────────────────────────────────────────
  // In D major on strings 2, 3 and 4. Full 4-line arrangement.
  // D3=str4f0, E3=str4f2, F#3=str4f4, G3=str3f0, A3=str3f2,
  // B3=str2f0, C#4=str2f2, D4=str2f3
  {
    id: 'happy-birthday',
    title: 'Happy Birthday',
    artist: 'Traditional',
    difficulty: 'beginner',
    type: 'melody',
    bpm: 96,
    description: 'Full four-line melody in D major with natural phrase timing.',
    notes: [
      // Line 1
      n(4, 0, 0.75), n(4, 0, 0.25), n(4, 2, 1), n(4, 0, 1), n(3, 0, 1), n(4, 4, 2),
      // Line 2
      n(4, 0, 0.75), n(4, 0, 0.25), n(4, 2, 1), n(4, 0, 1), n(3, 2, 1), n(3, 0, 2),
      // Line 3
      n(4, 0, 0.75), n(4, 0, 0.25), n(2, 3, 1), n(2, 0, 1), n(3, 0, 1), n(4, 4, 0.5), n(4, 2, 1.5),
      // Line 4
      n(2, 2, 0.75), n(2, 2, 0.25), n(2, 0, 1), n(3, 0, 1), n(3, 2, 1), n(3, 0, 3),
    ],
  },

  // ── Seven Nation Army ───────────────────────────────────────────────────────
  // On A string (str5). The recognizable E3-G3 version.
  // str5: f2=B2, f3=C3, f5=D3, f6=Eb3, f7=E3, f10=G3
  {
    id: 'seven-nation-army',
    title: 'Seven Nation Army',
    artist: 'The White Stripes',
    difficulty: 'beginner',
    type: 'melody',
    bpm: 120,
    description: 'Extended riff form with repeated cycles and a chromatic turnaround.',
    notes: [
      // Cycle 1
      n(5, 7, 2), n(5, 7, 0.5), n(5, 10, 0.5), n(5, 7, 1), n(5, 5, 0.5), n(5, 3, 0.5), n(5, 2, 2),
      r(1),

      // Cycle 2
      n(5, 7, 2), n(5, 7, 0.5), n(5, 10, 0.5), n(5, 7, 1), n(5, 5, 0.5), n(5, 3, 0.5), n(5, 2, 1.5),
      r(0.5),

      // Turnaround
      n(5, 7, 1), n(5, 6, 0.5), n(5, 5, 0.5), n(5, 3, 0.5), n(5, 2, 0.5), n(5, 7, 2.5),
    ],
  },

  // ── Ode to Joy (full classroom arrangement) ────────────────────────────────
  // In C major on strings 1 and 2.
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    artist: 'Beethoven',
    difficulty: 'beginner',
    type: 'melody',
    bpm: 96,
    description: "Beethoven's theme arranged as a full A-A-B-A style classroom performance.",
    notes: [
      // A1
      n(1, 0, 1), n(1, 0, 1), n(1, 1, 1), n(1, 3, 1), n(1, 3, 1), n(1, 1, 1), n(1, 0, 1), n(2, 3, 1),
      n(2, 1, 1), n(2, 1, 1), n(2, 3, 1), n(1, 0, 1.5), n(2, 3, 0.5), n(2, 3, 2),
      r(1),
      // A2
      n(1, 0, 1), n(1, 0, 1), n(1, 1, 1), n(1, 3, 1), n(1, 3, 1), n(1, 1, 1), n(1, 0, 1), n(2, 3, 1),
      n(2, 1, 1), n(2, 1, 1), n(2, 3, 1), n(1, 0, 1), n(2, 3, 1.5), n(2, 1, 0.5), n(2, 1, 2),
      r(1),

      // B section
      n(2, 3, 1), n(2, 3, 1), n(1, 0, 1), n(2, 3, 1), n(2, 1, 1), n(2, 1, 1), n(1, 0, 1), n(1, 1, 1),
      n(1, 3, 1), n(1, 3, 1), n(1, 1, 1), n(1, 0, 1), n(2, 3, 1), n(2, 1, 2),
      r(1),

      // Final A cadence
      n(1, 0, 1), n(1, 0, 1), n(1, 1, 1), n(1, 3, 1), n(1, 3, 1), n(1, 1, 1), n(1, 0, 1), n(2, 3, 1),
      n(2, 1, 1), n(2, 1, 1), n(2, 3, 1), n(1, 0, 1), n(2, 3, 1), n(2, 1, 3),
    ],
  },

  // ── Twinkle Twinkle Little Star (complete) ─────────────────────────────────
  // In C major. C4=str2f1, D4=str2f3, E4=str1f0, F4=str1f1, G4=str1f3, A4=str1f5
  {
    id: 'twinkle-twinkle',
    title: 'Twinkle Twinkle Little Star',
    artist: 'Traditional',
    difficulty: 'beginner',
    type: 'melody',
    bpm: 92,
    description: 'Complete six-line nursery melody with clear phrase endings.',
    notes: [
      // Twinkle, twinkle, little star
      n(2, 1, 1), n(2, 1, 1), n(1, 3, 1), n(1, 3, 1), n(1, 5, 1), n(1, 5, 1), n(1, 3, 2),
      // How I wonder what you are
      n(1, 1, 1), n(1, 1, 1), n(1, 0, 1), n(1, 0, 1), n(2, 3, 1), n(2, 3, 1), n(2, 1, 2),
      // Up above the world so high
      n(1, 3, 1), n(1, 3, 1), n(1, 1, 1), n(1, 1, 1), n(1, 0, 1), n(1, 0, 1), n(2, 3, 2),
      // Like a diamond in the sky
      n(1, 3, 1), n(1, 3, 1), n(1, 1, 1), n(1, 1, 1), n(1, 0, 1), n(1, 0, 1), n(2, 3, 2),
      // Twinkle, twinkle, little star
      n(2, 1, 1), n(2, 1, 1), n(1, 3, 1), n(1, 3, 1), n(1, 5, 1), n(1, 5, 1), n(1, 3, 2),
      // How I wonder what you are
      n(1, 1, 1), n(1, 1, 1), n(1, 0, 1), n(1, 0, 1), n(2, 3, 1), n(2, 3, 1), n(2, 1, 3),
    ],
  },

  // ── Frere Jacques (complete round melody) ──────────────────────────────────
  // C major melody: C D E C | C D E C | E F G | E F G | G A G F E C | ... etc
  {
    id: 'frere-jacques',
    title: 'Frere Jacques',
    artist: 'Traditional',
    difficulty: 'beginner',
    type: 'melody',
    bpm: 98,
    description: 'Full round melody in C major; great for steady tempo and phrase memory.',
    notes: [
      n(2, 1, 1), n(2, 3, 1), n(1, 0, 1), n(2, 1, 1),
      n(2, 1, 1), n(2, 3, 1), n(1, 0, 1), n(2, 1, 1),
      n(1, 0, 1), n(1, 1, 1), n(1, 3, 2),
      n(1, 0, 1), n(1, 1, 1), n(1, 3, 2),
      n(1, 3, 0.75), n(1, 5, 0.75), n(1, 3, 0.75), n(1, 1, 0.75), n(1, 0, 1), n(2, 1, 1),
      n(1, 3, 0.75), n(1, 5, 0.75), n(1, 3, 0.75), n(1, 1, 0.75), n(1, 0, 1), n(2, 1, 1),
      n(2, 1, 1), n(1, 3, 1), n(2, 1, 2),
      n(2, 1, 1), n(1, 3, 1), n(2, 1, 3),
    ],
  },

  // ── Mary Had a Little Lamb (full verse) ────────────────────────────────────
  // In C major around E4-D4-C4.
  {
    id: 'mary-had-a-little-lamb',
    title: 'Mary Had a Little Lamb',
    artist: 'Traditional',
    difficulty: 'beginner',
    type: 'melody',
    bpm: 104,
    description: 'Complete first verse melody with repeats and ending cadence.',
    notes: [
      n(1, 0, 1), n(2, 3, 1), n(2, 1, 1), n(2, 3, 1),
      n(1, 0, 1), n(1, 0, 1), n(1, 0, 2),
      n(2, 3, 1), n(2, 3, 1), n(2, 3, 2),
      n(1, 0, 1), n(1, 3, 1), n(1, 3, 2),
      n(1, 0, 1), n(2, 3, 1), n(2, 1, 1), n(2, 3, 1),
      n(1, 0, 1), n(1, 0, 1), n(1, 0, 1), n(1, 0, 1),
      n(2, 3, 1), n(2, 3, 1), n(1, 0, 1), n(2, 3, 1), n(2, 1, 3),
    ],
  },
]

export const FINGERPICK_PATTERNS: FingerpickPattern[] = [
  {
    id: 'em-travis-flow',
    title: 'Em Travis Flow',
    chordName: 'Em',
    difficulty: 'beginner',
    type: 'fingerpick',
    bpm: 78,
    loops: 6,
    description: '8-step alternating bass with a smooth top-string answer.',
    sequence: [
      { string: 6, duration: 0.5 },
      { string: 3, duration: 0.5 },
      { string: 4, duration: 0.5 },
      { string: 2, duration: 0.5 },
      { string: 6, duration: 0.5 },
      { string: 3, duration: 0.5 },
      { string: 4, duration: 0.5 },
      { string: 1, duration: 0.5 },
    ],
  },
  {
    id: 'am-ballad-roll',
    title: 'Am Ballad Roll',
    chordName: 'Am',
    difficulty: 'intermediate',
    type: 'fingerpick',
    bpm: 82,
    loops: 6,
    description: '12-step ballad pattern with alternating bass and repeated melody tones.',
    sequence: [
      { string: 5, duration: 0.5 },
      { string: 2, duration: 0.5 },
      { string: 4, duration: 0.5 },
      { string: 1, duration: 0.5 },
      { string: 5, duration: 0.5 },
      { string: 3, duration: 0.5 },
      { string: 4, duration: 0.5 },
      { string: 2, duration: 0.5 },
      { string: 5, duration: 0.5 },
      { string: 3, duration: 0.5 },
      { string: 4, duration: 0.5 },
      { string: 1, duration: 0.5 },
    ],
  },
  {
    id: 'g-folk-drive',
    title: 'G Folk Drive',
    chordName: 'G',
    difficulty: 'beginner',
    type: 'fingerpick',
    bpm: 88,
    loops: 6,
    description: 'Driving 8th-note folk pattern with bass pulse and upper-string movement.',
    sequence: [
      { string: 6, duration: 0.5 },
      { string: 3, duration: 0.5 },
      { string: 2, duration: 0.5 },
      { string: 1, duration: 0.5 },
      { string: 6, duration: 0.5 },
      { string: 3, duration: 0.5 },
      { string: 2, duration: 0.5 },
      { string: 1, duration: 0.5 },
    ],
  },
  {
    id: 'c-crosspick-12',
    title: 'C Crosspick 12',
    chordName: 'C',
    difficulty: 'intermediate',
    type: 'fingerpick',
    bpm: 84,
    loops: 5,
    description: '12-step crosspicking figure that cycles through inner and outer strings.',
    sequence: [
      { string: 5, duration: 0.5 },
      { string: 3, duration: 0.5 },
      { string: 2, duration: 0.5 },
      { string: 4, duration: 0.5 },
      { string: 1, duration: 0.5 },
      { string: 2, duration: 0.5 },
      { string: 5, duration: 0.5 },
      { string: 3, duration: 0.5 },
      { string: 2, duration: 0.5 },
      { string: 4, duration: 0.5 },
      { string: 1, duration: 0.5 },
      { string: 2, duration: 0.5 },
    ],
  },
  {
    id: 'dm-cinematic-pulse',
    title: 'Dm Cinematic Pulse',
    chordName: 'Dm',
    difficulty: 'intermediate',
    type: 'fingerpick',
    bpm: 76,
    loops: 6,
    description: 'Moody 8-step pulse built around low-to-high movement.',
    sequence: [
      { string: 4, duration: 0.5 },
      { string: 3, duration: 0.5 },
      { string: 2, duration: 0.5 },
      { string: 1, duration: 0.5 },
      { string: 4, duration: 0.5 },
      { string: 2, duration: 0.5 },
      { string: 3, duration: 0.5 },
      { string: 1, duration: 0.5 },
    ],
  },
  {
    id: 'd-folk-waltz',
    title: 'D Folk Waltz',
    chordName: 'D',
    difficulty: 'beginner',
    type: 'fingerpick',
    bpm: 92,
    loops: 6,
    description: '3/4-style pattern with alternating bass and bright treble response.',
    sequence: [
      { string: 4, duration: 1 },
      { string: 2, duration: 0.5 },
      { string: 1, duration: 0.5 },
      { string: 3, duration: 1 },
      { string: 2, duration: 0.5 },
      { string: 1, duration: 0.5 },
    ],
  },
]

export function getSong(id: string): Song | undefined {
  return SONGS.find(s => s.id === id)
}

export function getPattern(id: string): FingerpickPattern | undefined {
  return FINGERPICK_PATTERNS.find(p => p.id === id)
}

export function getSongOrPattern(id: string): SongOrPattern | undefined {
  return getSong(id) ?? getPattern(id)
}
