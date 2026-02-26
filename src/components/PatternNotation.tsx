'use client'

import { PatternStep } from '@/types'

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

interface PatternNotationProps {
  sequence: PatternStep[]
  chordName: string
}

export function PatternNotation({ sequence, chordName }: PatternNotationProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Hold <span className="font-bold text-foreground">{chordName}</span> and pluck in this order:
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {sequence.map((step, i) => {
          const lane = getLane(step.string)
          return (
            <div key={i} className="flex items-center gap-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{
                  background: `${lane.color}33`,
                  border: `2px solid ${lane.color}`,
                  color: lane.color,
                }}
              >
                {lane.label}
              </div>
              {i < sequence.length - 1 && (
                <span className="text-muted-foreground text-xs">→</span>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {sequence.map((step, i) => {
          const lane = getLane(step.string)
          return (
            <span key={i} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${lane.color}22`, color: lane.color }}>
              {i + 1}. String {step.string} ({lane.label})
            </span>
          )
        })}
      </div>
    </div>
  )
}
