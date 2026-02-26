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
  // ── Smoke on the Water ──────────────────────────────────────────────────────
  // All on D string (str4). Phrases: D-F-G | D-F-Ab-G | D-F-G-F-D
  {
    id: 'smoke-on-the-water',
    title: 'Smoke on the Water',
    artist: 'Deep Purple',
    difficulty: 'beginner',
    type: 'melody',
    bpm: 112,
    description: 'The iconic 3-note riff on the D string — every guitarist learns this one.',
    notes: [
      // Phrase 1: D – F – G (long)
      n(4, 0, 1),    // D3
      n(4, 3, 0.5),  // F3
      n(4, 5, 2.5),  // G3
      r(1),
      // Phrase 2: D – F – Ab – G (long)
      n(4, 0, 1),    // D3
      n(4, 3, 0.5),  // F3
      n(4, 6, 0.5),  // Ab3
      n(4, 5, 2.5),  // G3
      r(0.5),
      // Phrase 3: D – F – G – F – D (long)
      n(4, 0, 1),    // D3
      n(4, 3, 0.5),  // F3
      n(4, 5, 1),    // G3
      n(4, 3, 0.5),  // F3
      n(4, 0, 3),    // D3 (ring out)
    ],
  },

  // ── Happy Birthday ──────────────────────────────────────────────────────────
  // In D major on strings 2, 3 and 4. Full 4-line arrangement.
  // D3=str4f0, E3=str4f2, F#3=str4f4, G3=str3f0, A3=str3f2,
  // B3=str2f0, C#4=str2f2, D4=str2f3
  {
    id: 'happy-birthday',
    title: 'Happy Birthday',
    difficulty: 'beginner',
    type: 'melody',
    bpm: 100,
    description: 'The classic birthday melody in D major — great for beginners learning to cross strings.',
    notes: [
      // Line 1: D D E D G F# (Happy birth-day to you)
      n(4, 0, 0.75),   // D3  "Hap-"
      n(4, 0, 0.25),   // D3  "-py"
      n(4, 2, 1),      // E3  "Birth-"
      n(4, 0, 1),      // D3  "-day"
      n(3, 0, 1),      // G3  "to"
      n(4, 4, 2),      // F#3 "you"  ← was A3 (wrong), now F#3
      // Line 2: D D E D A G  (Happy birth-day to you)
      n(4, 0, 0.75),   // D3
      n(4, 0, 0.25),   // D3
      n(4, 2, 1),      // E3
      n(4, 0, 1),      // D3
      n(3, 2, 1),      // A3
      n(3, 0, 2),      // G3
      // Line 3: D D D4 B G F# E  (Happy birth-day dear ...)
      n(4, 0, 0.75),   // D3
      n(4, 0, 0.25),   // D3
      n(2, 3, 1),      // D4  (high D)
      n(2, 0, 1),      // B3
      n(3, 0, 1),      // G3
      n(4, 4, 0.5),    // F#3
      n(4, 2, 1.5),    // E3
      // Line 4: C# C# B G A G  (Happy birth-day to you)
      n(2, 2, 0.75),   // C#4
      n(2, 2, 0.25),   // C#4
      n(2, 0, 1),      // B3
      n(3, 0, 1),      // G3
      n(3, 2, 1),      // A3
      n(3, 0, 3),      // G3 (ring out)
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
    bpm: 124,
    description: 'That unstoppable riff — play it on the A string for the classic sound.',
    notes: [
      // Phrase 1: E – E – G – E – D – C – B
      n(5, 7, 2),    // E3  (long, iconic entrance)
      n(5, 7, 0.5),  // E3
      n(5, 10, 0.5), // G3
      n(5, 7, 1),    // E3
      n(5, 5, 0.5),  // D3
      n(5, 3, 0.5),  // C3
      n(5, 2, 2),    // B2  (long)
      r(1),
      // Phrase 2: E – E – G – E – Eb – E (ending variation)
      n(5, 7, 2),    // E3
      n(5, 7, 0.5),  // E3
      n(5, 10, 0.5), // G3
      n(5, 7, 1),    // E3
      n(5, 6, 0.5),  // Eb3 (chromatic slide)
      n(5, 7, 2.5),  // E3  (hold to end)
    ],
  },

  // ── Ode to Joy ──────────────────────────────────────────────────────────────
  // In C major on strings 1 and 2. Uses natural F (fret 1), not F# (fret 2).
  // str1: f0=E4, f1=F4, f3=G4
  // str2: f1=C4, f3=D4
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    artist: 'Beethoven',
    difficulty: 'beginner',
    type: 'melody',
    bpm: 96,
    description: "Beethoven's famous melody — played on the high e and B strings.",
    notes: [
      // Phrase 1: E E F G | G F E D | C C D E | E·D D
      n(1, 0, 1),    // E4
      n(1, 0, 1),    // E4
      n(1, 1, 1),    // F4  (natural — fret 1, not F# fret 2)
      n(1, 3, 1),    // G4
      n(1, 3, 1),    // G4
      n(1, 1, 1),    // F4
      n(1, 0, 1),    // E4
      n(2, 3, 1),    // D4
      n(2, 1, 1),    // C4
      n(2, 1, 1),    // C4
      n(2, 3, 1),    // D4
      n(1, 0, 1.5),  // E4  (dotted quarter)
      n(2, 3, 0.5),  // D4  (eighth)
      n(2, 3, 2),    // D4  (half — held)
      r(1),
      // Phrase 2: E E F G | G F E D | C C D E | D·C C
      n(1, 0, 1),    // E4
      n(1, 0, 1),    // E4
      n(1, 1, 1),    // F4
      n(1, 3, 1),    // G4
      n(1, 3, 1),    // G4
      n(1, 1, 1),    // F4
      n(1, 0, 1),    // E4
      n(2, 3, 1),    // D4
      n(2, 1, 1),    // C4
      n(2, 1, 1),    // C4
      n(2, 3, 1),    // D4
      n(1, 0, 1),    // E4
      n(2, 3, 1.5),  // D4  (dotted quarter)
      n(2, 1, 0.5),  // C4  (eighth)
      n(2, 1, 2),    // C4  (half — held)
    ],
  },

  // ── Sunshine of Your Love ───────────────────────────────────────────────────
  // In D blues/mixolydian. Descending figure then back up.
  // str4: f0=D3, f2=E3, f4=F#3, f5=G3, f11=C#4, f12=D4
  // str5: f7=E3, f9=F#3, f10=G3, f12=A3
  {
    id: 'sunshine-of-your-love',
    title: 'Sunshine of Your Love',
    artist: 'Cream',
    difficulty: 'intermediate',
    type: 'melody',
    bpm: 114,
    description: "Clapton's legendary bluesy riff — starts high on D4 and descends through the D blues scale.",
    notes: [
      // Descend: D4 – C#4 – A3 – G3 – F#3 – G3
      n(4, 12, 2),   // D4  (long, iconic)
      n(4, 11, 1),   // C#4 ← was C4 (wrong), now C#4
      n(5, 12, 1),   // A3
      n(5, 10, 1),   // G3
      n(5, 9, 1),    // F#3 (blue note)
      n(5, 10, 2),   // G3
      r(1),
      // Lower phrase: E3 – F#3 – E3 – D3
      n(5, 7, 2),    // E3
      n(5, 9, 1),    // F#3
      n(5, 7, 1),    // E3
      n(5, 5, 1),    // D3
      n(5, 7, 3),    // E3  (hold)
    ],
  },

  // ── Eye of the Tiger ────────────────────────────────────────────────────────
  // Simplified single-note version of the famous riff in G.
  // str3: f0=G3, f3=Bb3
  // str4: f1=Eb3, f3=F3
  // str5: f3=C3
  {
    id: 'eye-of-the-tiger',
    title: 'Eye of the Tiger',
    artist: 'Survivor',
    difficulty: 'intermediate',
    type: 'melody',
    bpm: 108,
    description: "The power-riff simplified to single notes — G-G-Bb-G-F-Eb-C on the middle strings.",
    notes: [
      // Phrase 1: G G Bb G F Eb C
      n(3, 0, 0.5),  // G3
      n(3, 0, 0.5),  // G3
      n(3, 3, 1),    // Bb3
      n(3, 0, 1),    // G3
      n(4, 3, 0.5),  // F3
      n(4, 1, 0.5),  // Eb3
      n(5, 3, 2),    // C3
      r(1),
      // Phrase 2: G G Bb G Eb G (ending climbs back)
      n(3, 0, 0.5),  // G3
      n(3, 0, 0.5),  // G3
      n(3, 3, 1),    // Bb3
      n(3, 0, 1),    // G3
      n(4, 1, 0.5),  // Eb3
      n(3, 0, 2.5),  // G3  (hold)
    ],
  },
]

export const FINGERPICK_PATTERNS: FingerpickPattern[] = [
  {
    id: 'em-arpeggio',
    title: 'Em Arpeggio',
    chordName: 'Em',
    difficulty: 'beginner',
    type: 'fingerpick',
    bpm: 70,
    loops: 4,
    description: 'Classic 6-string arpeggio — thumb on bass, fingers roll up through treble strings.',
    sequence: [
      { string: 6, duration: 1 },
      { string: 4, duration: 1 },
      { string: 3, duration: 1 },
      { string: 2, duration: 1 },
      { string: 1, duration: 1 },
      { string: 2, duration: 1 },
    ],
  },
  {
    id: 'am-travis-pick',
    title: 'Am Travis Pick',
    chordName: 'Am',
    difficulty: 'intermediate',
    type: 'fingerpick',
    bpm: 80,
    loops: 4,
    description: 'Travis-style alternating bass — thumb alternates 5th/4th strings while fingers pluck melody.',
    sequence: [
      { string: 5, duration: 0.5 },
      { string: 2, duration: 0.5 },
      { string: 4, duration: 0.5 },
      { string: 3, duration: 0.5 },
      { string: 5, duration: 0.5 },
      { string: 1, duration: 0.5 },
      { string: 4, duration: 0.5 },
      { string: 2, duration: 0.5 },
    ],
  },
  {
    id: 'g-major-pattern',
    title: 'G Major Pattern',
    chordName: 'G',
    difficulty: 'beginner',
    type: 'fingerpick',
    bpm: 75,
    loops: 4,
    description: 'Simple G major picking pattern — bass note then up through the chord.',
    sequence: [
      { string: 6, duration: 1 },
      { string: 3, duration: 1 },
      { string: 2, duration: 1 },
      { string: 1, duration: 1 },
    ],
  },
  {
    id: 'c-major-waltz',
    title: 'C Major Waltz',
    chordName: 'C',
    difficulty: 'beginner',
    type: 'fingerpick',
    bpm: 90,
    loops: 4,
    description: 'Waltz-feel picking in 3/4 time — bass then two treble strings.',
    sequence: [
      { string: 5, duration: 1 },
      { string: 2, duration: 1 },
      { string: 1, duration: 1 },
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
