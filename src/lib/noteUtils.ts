// Note names using flats for enharmonics that feel natural in guitar music
// (Ab, Bb, Eb preferred over G#, A#, D#)
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

// MIDI note numbers for open strings
// String 1 = high e (E4), String 6 = low E (E2)
export const OPEN_MIDI: Record<number, number> = {
  1: 64, // E4
  2: 59, // B3
  3: 55, // G3
  4: 50, // D3
  5: 45, // A2
  6: 40, // E2
}

/**
 * Returns the note name for a given guitar string and fret.
 * e.g. fretToNoteName(4, 0) → "D3", fretToNoteName(1, 2) → "F#4"
 */
export function fretToNoteName(str: number, fret: number): string {
  const midi = OPEN_MIDI[str] + fret
  const noteIdx = midi % 12
  const octave = Math.floor(midi / 12) - 1
  return NOTE_NAMES[noteIdx] + octave
}
