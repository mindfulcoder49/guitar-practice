'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChordMatch, ProgressionChord } from '@/types'
import { CHORD_TEMPLATES } from '@/lib/chords'
import { ChordDiagram } from '@/components/ChordDiagram'

// ─── Constants ───────────────────────────────────────────────────────────────

const LANE_HEIGHT = 34        // px per string lane
const GEM_W = 44              // px width of each gem (wider than tall so chord name fits)
const GEM_H = 26              // px height of each gem
const HIT_LINE_PCT = 18       // % from left of highway
const HIGHWAY_DURATION_MS = 4000
const HIT_WINDOW_MS = 1200    // generous ±1.2s window

// One colour per string: Low E → High e (index 0 = Low E, index 5 = High e)
const LANE_CFG = [
  { label: 'E', color: '#4ade80', dim: '#14532d' },  // green  — Low E
  { label: 'A', color: '#f87171', dim: '#7f1d1d' },  // red
  { label: 'D', color: '#facc15', dim: '#713f12' },  // yellow
  { label: 'G', color: '#60a5fa', dim: '#1e3a8a' },  // blue
  { label: 'B', color: '#fb923c', dim: '#7c2d12' },  // orange
  { label: 'e', color: '#c084fc', dim: '#581c87' },  // purple — High e
]

// Display order for lanes: High e on top, Low E on bottom (like looking at a guitar)
const LANE_DISPLAY = [...LANE_CFG].reverse()  // index 0 = High e (top), index 5 = Low E (bottom)

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChordBlock {
  id: string
  chord: string
  beats: number
  startTime: number   // ms after session start when this block reaches the hit line
  hit?: boolean
  missed?: boolean
}

interface ChordHighwayProps {
  progression: ProgressionChord[]
  bpm: number
  running: boolean
  currentMatch: ChordMatch | null
  onScore: (hit: boolean, chord: string) => void
}

// ─── Helper: which strings does this chord need? ─────────────────────────────
// Returns one entry per string (Low E index 0 → High e index 5):
//   'open'  → hollow gem (open string)
//   number  → filled gem showing fret number
//   null    → no gem (muted / don't play)
function stringGems(chordName: string): ('open' | number | null)[] {
  const t = CHORD_TEMPLATES[chordName]
  if (!t) return Array(6).fill(null)
  return t.openStrings.map(v => {
    if (v === -1) return null
    if (v === 0)  return 'open'
    return v  // fret number
  })
}

// ─── Single gem ──────────────────────────────────────────────────────────────
function Gem({
  kind, color, flash,
}: {
  kind: 'open' | number
  color: string
  flash: 'hit' | 'miss' | 'approach' | null
}) {
  const isFret = kind !== 'open'

  const bg =
    flash === 'hit'  ? '#22c55e' :
    flash === 'miss' ? '#374151' :
    isFret           ? color : 'transparent'

  const border =
    flash === 'hit'  ? '#86efac' :
    flash === 'miss' ? '#4b5563' :
    color

  return (
    <div
      style={{
        width: GEM_W,
        height: GEM_H,
        borderRadius: 6,
        background: bg,
        border: `2.5px solid ${border}`,
        boxShadow: flash === 'approach'
          ? `0 0 8px ${color}`
          : flash === 'hit'
          ? `0 0 12px #22c55e`
          : 'none',
        transition: 'box-shadow 0.05s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isFret && flash !== 'hit' && flash !== 'miss' && (
        <span style={{
          fontSize: 11,
          fontWeight: 'bold',
          color: 'rgba(0,0,0,0.72)',
          lineHeight: 1,
          userSelect: 'none',
        }}>
          {kind}
        </span>
      )}
    </div>
  )
}

// ─── One chord's column of gems ──────────────────────────────────────────────
// Renders High e at top, Low E at bottom (matches real guitar orientation)
function GemColumn({
  chordName, flash,
}: {
  chordName: string
  flash: 'hit' | 'miss' | 'approach' | null
}) {
  const gems = stringGems(chordName)  // [0]=Low E … [5]=High e
  const displayGems = [...gems].reverse()  // [0]=High e (top) … [5]=Low E (bottom)

  return (
    <div className="flex flex-col items-center">
      {/* Chord name badge above the column */}
      <div
        className="text-[10px] font-bold text-white/80 text-center mb-0.5 whitespace-nowrap"
        style={{ minWidth: GEM_W }}
      >
        {chordName}
      </div>
      {displayGems.map((kind, displayIdx) => (
        <div
          key={displayIdx}
          style={{ height: LANE_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {kind !== null ? (
            <Gem
              kind={kind}
              color={LANE_DISPLAY[displayIdx].color}
              flash={flash}
            />
          ) : (
            // Muted string — faint dash so the lane still looks connected
            <div style={{ width: GEM_W, height: 2, background: '#1f2937' }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ChordHighway({
  progression, bpm, running, currentMatch, onScore,
}: ChordHighwayProps) {
  const [blocks, setBlocks] = useState<ChordBlock[]>([])
  const [, setFrame] = useState(0)   // tick counter — forces re-render each frame so positions update
  const startTimeRef   = useRef<number>(0)
  const animRef        = useRef<number | undefined>(undefined)
  const matchRef       = useRef<ChordMatch | null>(null)
  matchRef.current = currentMatch

  // Build the block schedule
  useEffect(() => {
    if (!running || progression.length === 0) { setBlocks([]); return }

    const beatMs = (60 / bpm) * 1000
    startTimeRef.current = performance.now()

    const newBlocks: ChordBlock[] = []
    let elapsed = 0
    for (let loop = 0; loop < 4; loop++) {
      for (const item of progression) {
        newBlocks.push({
          id: `${loop}-${item.chord}-${elapsed}`,
          chord: item.chord,
          beats: item.beats,
          startTime: elapsed + HIGHWAY_DURATION_MS,
        })
        elapsed += item.beats * beatMs
      }
    }
    setBlocks(newBlocks)
  }, [running, progression, bpm])

  // Hit detection loop
  useEffect(() => {
    if (!running) return
    function tick() {
      const now   = performance.now() - startTimeRef.current
      const match = matchRef.current

      // Force a re-render every frame so block x-positions (calculated from
      // performance.now() during render) update smoothly
      setFrame(f => f + 1)

      setBlocks(prev => prev.map(block => {
        if (block.hit || block.missed) return block
        const timeToHit = block.startTime - now
        const inWindow  = timeToHit > -HIT_WINDOW_MS && timeToHit < HIT_WINDOW_MS

        if (inWindow && match?.chord === block.chord) {
          onScore(true, block.chord)
          return { ...block, hit: true }
        }
        if (timeToHit < -HIT_WINDOW_MS) {
          onScore(false, block.chord)
          return { ...block, missed: true }
        }
        return block
      }))

      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [running, onScore])

  // ─── Compute upcoming chords for the preview row ─────────────────────────
  // Derived from current blocks on every render (setFrame tick keeps this fresh)
  const now = performance.now() - startTimeRef.current
  const upcoming = running
    ? blocks
        .filter(b => !b.hit && !b.missed && b.startTime - now > -HIT_WINDOW_MS)
        .sort((a, b) => a.startTime - b.startTime)
        .slice(0, 4)
        .map(b => b.chord)
    : []

  const totalHeight = LANE_HEIGHT * 6 + 20  // 20px for the chord name badge row

  return (
    <div className="flex flex-col gap-3">

      {/* ── Upcoming chord flashcards ── */}
      {upcoming.length > 0 && (
        <div
          className="flex items-start gap-4 p-3 rounded-xl border border-gray-700 overflow-x-auto"
          style={{ background: '#111827' }}
        >
          <span
            className="text-xs font-semibold whitespace-nowrap mt-1"
            style={{ color: '#6b7280' }}
          >
            Up next:
          </span>
          <div className="flex gap-5">
            {upcoming.map((chord, i) => {
              const template = CHORD_TEMPLATES[chord]
              if (!template) return null
              return (
                <div
                  key={`upcoming-${chord}-${i}`}
                  style={{ opacity: Math.max(0.35, 1 - i * 0.2) }}
                >
                  <ChordDiagram chord={template} size="sm" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Highway ── */}
      <div className="flex gap-0 rounded-xl overflow-hidden border border-gray-700">

        {/* ── String label column (fixed, outside scroll area) ── */}
        {/* High e at top, Low E at bottom — matching real guitar orientation */}
        <div
          className="flex flex-col flex-shrink-0 bg-gray-900 border-r border-gray-700"
          style={{ paddingTop: 20 }}   // align with badge row
        >
          {LANE_DISPLAY.map(lane => (
            <div
              key={lane.label}
              className="flex items-center justify-center font-bold text-xs"
              style={{ height: LANE_HEIGHT, width: 28, color: lane.color }}
            >
              {lane.label}
            </div>
          ))}
        </div>

        {/* ── Scrolling highway ── */}
        <div
          className="relative flex-1 bg-gray-950 overflow-hidden"
          style={{ height: totalHeight }}
        >
          {/* Lane background stripes — High e at top, Low E at bottom */}
          {LANE_DISPLAY.map((lane, i) => (
            <div
              key={i}
              className="absolute left-0 right-0"
              style={{
                top:    20 + i * LANE_HEIGHT,
                height: LANE_HEIGHT,
                background: `${lane.dim}44`,
                borderBottom: i < 5 ? '1px solid #1f2937' : 'none',
              }}
            />
          ))}

          {/* Hit line */}
          <div
            className="absolute top-0 bottom-0 z-10 pointer-events-none"
            style={{ left: `${HIT_LINE_PCT}%` }}
          >
            <div className="absolute inset-0 w-px bg-yellow-400/60" />
            <div className="absolute inset-0 -left-4 w-8 bg-yellow-400/5" />
          </div>
          <div
            className="absolute bottom-1 z-10 text-[8px] text-yellow-400/50 font-bold tracking-widest -translate-x-1/2"
            style={{ left: `${HIT_LINE_PCT}%` }}
          >
            PLAY
          </div>

          {/* Chord blocks */}
          <AnimatePresence>
            {blocks.map(block => {
              if (block.hit && !block.missed) {
                // Show a brief hit flash at the hit line
                return (
                  <motion.div
                    key={`flash-${block.id}`}
                    className="absolute top-0 z-20 -translate-x-1/2"
                    style={{ left: `${HIT_LINE_PCT}%`, paddingTop: 20 }}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <GemColumn chordName={block.chord} flash="hit" />
                  </motion.div>
                )
              }

              if (block.missed || block.hit) return null

              const nowRender  = performance.now() - startTimeRef.current
              const timeToHit  = block.startTime - nowRender
              const xPct       = HIT_LINE_PCT + (timeToHit / HIGHWAY_DURATION_MS) * (100 - HIT_LINE_PCT)

              if (xPct > 108 || xPct < -10) return null

              const approaching = Math.abs(timeToHit) < HIT_WINDOW_MS * 1.5

              return (
                <motion.div
                  key={block.id}
                  className="absolute top-0 z-20 -translate-x-1/2"
                  style={{ left: `${xPct}%`, paddingTop: 4 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <GemColumn chordName={block.chord} flash={approaching ? 'approach' : null} />
                </motion.div>
              )
            })}
          </AnimatePresence>

          {!running && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gray-500 text-sm">Press Start to begin</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
