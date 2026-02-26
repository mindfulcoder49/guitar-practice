'use client'

import { NoteEvent } from '@/types'
import { fretToNoteName } from '@/lib/noteUtils'

// LANE_CFG: index 0 = Low E (string 6), index 5 = High e (string 1)
const LANE_CFG = [
  { label: 'E', color: '#4ade80' },
  { label: 'A', color: '#f87171' },
  { label: 'D', color: '#facc15' },
  { label: 'G', color: '#60a5fa' },
  { label: 'B', color: '#fb923c' },
  { label: 'e', color: '#c084fc' },
]

function getLane(str: number) {
  return LANE_CFG[6 - str]
}

interface SongLearnCardProps {
  notes: NoteEvent[]
}

export function SongLearnCard({ notes }: SongLearnCardProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {notes.map((note, i) => {
        // Render rests as a dashed chip
        if (note.rest || note.string === undefined || note.fret === undefined) {
          return (
            <div
              key={i}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px dashed rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              <span>rest</span>
              <span style={{ opacity: 0.6 }}>{note.duration}b</span>
            </div>
          )
        }

        const lane = getLane(note.string)
        const noteName = fretToNoteName(note.string, note.fret)

        return (
          <div
            key={i}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold"
            style={{
              background: `${lane.color}22`,
              border: `1.5px solid ${lane.color}66`,
              color: lane.color,
            }}
          >
            {/* Real note name e.g. "D3", "F#4" */}
            <span>{noteName}</span>
            {/* Duration in beats for anything non-trivial */}
            {note.duration !== 1 && (
              <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400, fontSize: 9 }}>
                {note.duration}b
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
