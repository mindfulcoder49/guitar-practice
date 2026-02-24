'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChordMatch, ProgressionChord } from '@/types'
import { CHORD_TEMPLATES } from '@/lib/chords'

// ─── Highway constants ────────────────────────────────────────────────────────

const LANE_HEIGHT = 34
const GEM_W = 44
const GEM_H = 26
const HIT_LINE_PCT = 18
const HIGHWAY_DURATION_MS = 4000
const HIT_WINDOW_MS = 1200

// One colour per string: index 0 = Low E, index 5 = High e
const LANE_CFG = [
  { label: 'E', color: '#4ade80', dim: '#14532d' },  // green  — Low E
  { label: 'A', color: '#f87171', dim: '#7f1d1d' },  // red
  { label: 'D', color: '#facc15', dim: '#713f12' },  // yellow
  { label: 'G', color: '#60a5fa', dim: '#1e3a8a' },  // blue
  { label: 'B', color: '#fb923c', dim: '#7c2d12' },  // orange
  { label: 'e', color: '#c084fc', dim: '#581c87' },  // purple — High e
]

// Lane display order: High e on top (index 0 of LANE_DISPLAY) → Low E on bottom
const LANE_DISPLAY = [...LANE_CFG].reverse()

// ─── Horizontal chord card constants ─────────────────────────────────────────

const CARD_H        = 15   // px per string row
const CARD_FRET_W   = 20   // px per fret column
const CARD_FRETS    = 4    // fret columns to show
const CARD_LEFT_PAD = 30   // px left of nut (for labels + open/muted markers)
const CARD_TOP_PAD  = 14   // px above strings (for fret numbers)
const CARD_DOT_R    = 5    // radius of fret dot

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChordBlock {
  id: string
  chord: string
  beats: number
  startTime: number
  hit?: boolean
  missed?: boolean
  pendingRetry?: boolean   // practice mode: missed, waiting for student to play it
}

interface ChordHighwayProps {
  progression: ProgressionChord[]
  bpm: number
  running: boolean
  currentMatch: ChordMatch | null
  onScore: (hit: boolean, chord: string) => void
  mode?: 'practice' | 'test'
}

// ─── Horizontal chord card ────────────────────────────────────────────────────
// Shows strings as horizontal rows, High e on top, Low E on bottom — matches
// the highway lane orientation so the diagrams line up visually.

function HorizontalChordCard({ chordName, opacity = 1 }: { chordName: string; opacity?: number }) {
  const template = CHORD_TEMPLATES[chordName]
  if (!template) return null

  const svgW = CARD_LEFT_PAD + CARD_FRETS * CARD_FRET_W + 6
  const svgH = CARD_TOP_PAD + 6 * CARD_H + 4

  // displayIdx 0 = High e (top), displayIdx 5 = Low E (bottom)
  const displayOrder = [5, 4, 3, 2, 1, 0]

  return (
    <div style={{ opacity }}>
      <p style={{
        fontSize: 10, fontWeight: 700,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center', marginBottom: 2,
      }}>
        {chordName}
      </p>
      <svg width={svgW} height={svgH}>

        {/* Fret position label when not starting at fret 1 */}
        {template.startFret > 1 && (
          <text x={CARD_LEFT_PAD + 2} y={CARD_TOP_PAD - 3} fontSize={7} fill="#666">
            {template.startFret}fr
          </text>
        )}

        {/* Fret number labels across the top */}
        {Array.from({ length: CARD_FRETS }, (_, f) => (
          <text
            key={f}
            x={CARD_LEFT_PAD + f * CARD_FRET_W + CARD_FRET_W / 2}
            y={CARD_TOP_PAD - 3}
            textAnchor="middle"
            fontSize={7}
            fill="#555"
          >
            {template.startFret + f}
          </text>
        ))}

        {/* Lane background stripes */}
        {displayOrder.map((stringIdx, displayIdx) => (
          <rect
            key={`bg-${stringIdx}`}
            x={CARD_LEFT_PAD}
            y={CARD_TOP_PAD + displayIdx * CARD_H}
            width={CARD_FRETS * CARD_FRET_W}
            height={CARD_H}
            fill={`${LANE_CFG[stringIdx].dim}55`}
          />
        ))}

        {/* Nut (thick left edge) */}
        <line
          x1={CARD_LEFT_PAD} y1={CARD_TOP_PAD}
          x2={CARD_LEFT_PAD} y2={CARD_TOP_PAD + 6 * CARD_H}
          stroke={template.startFret === 1 ? '#aaa' : '#555'}
          strokeWidth={template.startFret === 1 ? 3 : 1}
        />

        {/* Vertical fret lines */}
        {Array.from({ length: CARD_FRETS }, (_, f) => (
          <line
            key={`fret-${f}`}
            x1={CARD_LEFT_PAD + (f + 1) * CARD_FRET_W} y1={CARD_TOP_PAD}
            x2={CARD_LEFT_PAD + (f + 1) * CARD_FRET_W} y2={CARD_TOP_PAD + 6 * CARD_H}
            stroke="#333"
            strokeWidth={0.5}
          />
        ))}

        {/* Per-string: line, label, open/muted marker, fret dot */}
        {displayOrder.map((stringIdx, displayIdx) => {
          const lane   = LANE_CFG[stringIdx]
          const openVal = template.openStrings[stringIdx]
          const cy     = CARD_TOP_PAD + displayIdx * CARD_H + CARD_H / 2

          return (
            <g key={stringIdx}>
              {/* Horizontal string line */}
              <line
                x1={CARD_LEFT_PAD} y1={cy}
                x2={CARD_LEFT_PAD + CARD_FRETS * CARD_FRET_W} y2={cy}
                stroke={lane.color} strokeWidth={0.8} opacity={0.35}
              />

              {/* String label */}
              <text
                x={8} y={cy + 3}
                textAnchor="middle" fontSize={8}
                fill={lane.color} fontWeight="bold"
              >
                {lane.label}
              </text>

              {/* Open string ○ */}
              {openVal === 0 && (
                <circle
                  cx={CARD_LEFT_PAD - 7} cy={cy} r={3.5}
                  fill="none" stroke={lane.color} strokeWidth={1.2}
                />
              )}

              {/* Muted string × */}
              {openVal === -1 && (
                <text
                  x={CARD_LEFT_PAD - 7} y={cy + 3}
                  textAnchor="middle" fontSize={9} fill="#666"
                >
                  ×
                </text>
              )}

              {/* Fretted dot with fret number */}
              {openVal > 0 && (() => {
                const fretCol = openVal - template.startFret   // 0-indexed column
                const cx = CARD_LEFT_PAD + fretCol * CARD_FRET_W + CARD_FRET_W / 2
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={CARD_DOT_R} fill={lane.color} />
                    <text
                      x={cx} y={cy + 3}
                      textAnchor="middle" fontSize={7}
                      fill="rgba(0,0,0,0.75)" fontWeight="bold"
                    >
                      {openVal}
                    </text>
                  </g>
                )
              })()}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Helper: string gem types ─────────────────────────────────────────────────
// Returns one entry per string (index 0 = Low E, index 5 = High e):
//   'open'  → hollow gem (open string)
//   number  → filled gem showing fret number
//   null    → no gem (muted / don't play)

function stringGems(chordName: string): ('open' | number | null)[] {
  const t = CHORD_TEMPLATES[chordName]
  if (!t) return Array(6).fill(null)
  return t.openStrings.map(v => {
    if (v === -1) return null
    if (v === 0)  return 'open'
    return v
  })
}

// ─── Single gem ───────────────────────────────────────────────────────────────

function Gem({ kind, color, flash }: {
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
    <div style={{
      width: GEM_W, height: GEM_H, borderRadius: 6,
      background: bg, border: `2.5px solid ${border}`,
      boxShadow:
        flash === 'approach' ? `0 0 8px ${color}` :
        flash === 'hit'      ? '0 0 12px #22c55e' : 'none',
      transition: 'box-shadow 0.05s',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {isFret && flash !== 'hit' && flash !== 'miss' && (
        <span style={{ fontSize: 11, fontWeight: 'bold', color: 'rgba(0,0,0,0.72)', lineHeight: 1, userSelect: 'none' }}>
          {kind}
        </span>
      )}
    </div>
  )
}

// ─── Column of 6 gems for one chord ──────────────────────────────────────────
// High e at top, Low E at bottom — matches real guitar orientation

function GemColumn({ chordName, flash }: {
  chordName: string
  flash: 'hit' | 'miss' | 'approach' | null
}) {
  const gems = stringGems(chordName)          // [0]=Low E … [5]=High e
  const displayGems = [...gems].reverse()     // [0]=High e (top) … [5]=Low E (bottom)

  return (
    <div className="flex flex-col items-center">
      <div className="text-[10px] font-bold text-white/80 text-center mb-0.5 whitespace-nowrap" style={{ minWidth: GEM_W }}>
        {chordName}
      </div>
      {displayGems.map((kind, displayIdx) => (
        <div key={displayIdx} style={{ height: LANE_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {kind !== null
            ? <Gem kind={kind} color={LANE_DISPLAY[displayIdx].color} flash={flash} />
            : <div style={{ width: GEM_W, height: 2, background: '#1f2937' }} />
          }
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ChordHighway({
  progression, bpm, running, currentMatch, onScore, mode = 'test',
}: ChordHighwayProps) {

  const [blocks, setBlocks]         = useState<ChordBlock[]>([])
  const [, setFrame]                = useState(0)
  const [pausedChord, setPausedChord] = useState<string | null>(null)

  // Refs for the rAF tick loop (avoids stale closures)
  const startTimeRef       = useRef<number>(0)
  const animRef            = useRef<number | undefined>(undefined)
  const matchRef           = useRef<ChordMatch | null>(null)
  const blocksRef          = useRef<ChordBlock[]>([])
  const pausedChordRef     = useRef<string | null>(null)
  const pausedGameTimeRef  = useRef<number | undefined>(undefined)
  const pendingRetryIdRef  = useRef<string | null>(null)
  const modeRef            = useRef(mode)

  // Keep refs in sync with the latest props/state
  matchRef.current     = currentMatch
  pausedChordRef.current = pausedChord
  modeRef.current      = mode

  /** Returns current game-time in ms, or the frozen value when paused. */
  function getGameTime(): number {
    if (pausedGameTimeRef.current !== undefined) return pausedGameTimeRef.current
    return performance.now() - startTimeRef.current
  }

  // ── Build the block schedule ──────────────────────────────────────────────
  useEffect(() => {
    if (!running || progression.length === 0) {
      setBlocks([])
      blocksRef.current = []
      return
    }

    const beatMs = (60 / bpm) * 1000
    startTimeRef.current = performance.now()

    // Reset pause state on new session
    setPausedChord(null)
    pausedChordRef.current      = null
    pausedGameTimeRef.current   = undefined
    pendingRetryIdRef.current   = null

    const newBlocks: ChordBlock[] = []
    let elapsed = 0
    for (let loop = 0; loop < 4; loop++) {
      for (const item of progression) {
        newBlocks.push({
          id:        `${loop}-${item.chord}-${elapsed}`,
          chord:     item.chord,
          beats:     item.beats,
          startTime: elapsed + HIGHWAY_DURATION_MS,
        })
        elapsed += item.beats * beatMs
      }
    }
    setBlocks(newBlocks)
    blocksRef.current = newBlocks
  }, [running, progression, bpm])

  // ── Hit-detection + practice-mode pause loop ──────────────────────────────
  useEffect(() => {
    if (!running) {
      setPausedChord(null)
      pausedChordRef.current     = null
      pausedGameTimeRef.current  = undefined
      return
    }

    function tick() {
      const gameTime = getGameTime()
      const match    = matchRef.current

      setFrame(f => f + 1)   // re-render every frame so positions update

      // ── Paused (practice mode): waiting for student to play the right chord ──
      if (pausedChordRef.current !== null) {
        if (match?.chord === pausedChordRef.current) {
          // Student got it — resume
          const frozenTime = pausedGameTimeRef.current!
          startTimeRef.current       = performance.now() - frozenTime
          pausedGameTimeRef.current  = undefined

          const newBlocks = blocksRef.current.map(b =>
            b.id === pendingRetryIdRef.current
              ? { ...b, pendingRetry: false, hit: true }
              : b
          )
          blocksRef.current = newBlocks
          setBlocks(newBlocks)
          onScore(true, pausedChordRef.current)
          pausedChordRef.current  = null
          pendingRetryIdRef.current = null
          setPausedChord(null)
        }
        animRef.current = requestAnimationFrame(tick)
        return
      }

      // ── Normal processing ─────────────────────────────────────────────────
      let pauseTrigger: { chord: string; id: string } | null = null

      const newBlocks = blocksRef.current.map(block => {
        if (block.hit || block.missed || block.pendingRetry) return block

        const timeToHit = block.startTime - gameTime
        const inWindow  = timeToHit > -HIT_WINDOW_MS && timeToHit < HIT_WINDOW_MS

        if (inWindow && match?.chord === block.chord) {
          onScore(true, block.chord)
          return { ...block, hit: true }
        }

        if (timeToHit < -HIT_WINDOW_MS) {
          if (modeRef.current === 'practice' && !pauseTrigger) {
            pauseTrigger = { chord: block.chord, id: block.id }
            return { ...block, pendingRetry: true }
          } else if (modeRef.current === 'test') {
            onScore(false, block.chord)
            return { ...block, missed: true }
          }
        }

        return block
      })

      // Only call setBlocks when something actually changed
      const changed = newBlocks.some((b, i) => b !== blocksRef.current[i])
      if (changed) {
        blocksRef.current = newBlocks
        setBlocks(newBlocks)
      }

      if (pauseTrigger) {
        const pt = pauseTrigger as { chord: string; id: string }
        pausedGameTimeRef.current = gameTime
        pendingRetryIdRef.current  = pt.id
        pausedChordRef.current     = pt.chord   // set ref immediately so next tick sees it
        setPausedChord(pt.chord)
      }

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [running, onScore])

  // ── Compute upcoming chords for the preview row ────────────────────────────
  // Using getGameTime() so upcoming is frozen when paused (preserves current chord)
  const gameTimeNow = getGameTime()

  // The pendingRetry chord (if any) is shown first — it's what the student must play right now
  const pendingBlock   = blocks.find(b => b.pendingRetry)
  const nextBlocks     = blocks
    .filter(b => !b.hit && !b.missed && !b.pendingRetry && b.startTime - gameTimeNow > -HIT_WINDOW_MS)
    .sort((a, b) => a.startTime - b.startTime)
  const upcoming = running
    ? [
        ...(pendingBlock ? [pendingBlock.chord] : []),
        ...nextBlocks.slice(0, pendingBlock ? 3 : 4).map(b => b.chord),
      ]
    : []

  const totalHeight = LANE_HEIGHT * 6 + 20

  return (
    <div className="flex flex-col gap-3">

      {/* ── Upcoming chord cards (horizontal layout matching highway) ── */}
      {upcoming.length > 0 && (
        <div
          className="flex items-start gap-4 p-3 rounded-xl border border-gray-700 overflow-x-auto"
          style={{ background: '#111827' }}
        >
          <span className="text-xs font-semibold whitespace-nowrap mt-1" style={{ color: '#6b7280' }}>
            Up next:
          </span>
          <div className="flex gap-5">
            {upcoming.map((chord, i) => (
              <HorizontalChordCard
                key={`upcoming-${chord}-${i}`}
                chordName={chord}
                opacity={Math.max(0.35, 1 - i * 0.2)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Highway ── */}
      <div className="flex gap-0 rounded-xl overflow-hidden border border-gray-700">

        {/* String label column — High e on top, Low E on bottom */}
        <div
          className="flex flex-col flex-shrink-0 bg-gray-900 border-r border-gray-700"
          style={{ paddingTop: 20 }}
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

        {/* Scrolling highway */}
        <div className="relative flex-1 bg-gray-950 overflow-hidden" style={{ height: totalHeight }}>

          {/* Lane background stripes */}
          {LANE_DISPLAY.map((lane, i) => (
            <div
              key={i}
              className="absolute left-0 right-0"
              style={{
                top: 20 + i * LANE_HEIGHT, height: LANE_HEIGHT,
                background: `${lane.dim}44`,
                borderBottom: i < 5 ? '1px solid #1f2937' : 'none',
              }}
            />
          ))}

          {/* Hit line */}
          <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: `${HIT_LINE_PCT}%` }}>
            <div className="absolute inset-0 w-px bg-yellow-400/60" />
            <div className="absolute inset-0 -left-4 w-8 bg-yellow-400/5" />
          </div>
          <div
            className="absolute bottom-1 z-10 text-[8px] text-yellow-400/50 font-bold tracking-widest -translate-x-1/2"
            style={{ left: `${HIT_LINE_PCT}%` }}
          >
            PLAY
          </div>

          {/* Practice-mode pause overlay */}
          {pausedChord && (
            <div className="absolute inset-0 z-30 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.60)' }}>
              <motion.div
                className="flex flex-col items-center gap-2"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
              >
                <p className="text-gray-300 font-semibold text-sm">Now play</p>
                <p className="text-yellow-400 font-bold text-3xl leading-none">{pausedChord}</p>
                <div className="mt-1 p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.45)' }}>
                  <HorizontalChordCard chordName={pausedChord} opacity={1} />
                </div>
              </motion.div>
            </div>
          )}

          {/* Pending-retry block: pulsing at hit line, waiting for retry */}
          {blocks.filter(b => b.pendingRetry).map(block => (
            <motion.div
              key={`retry-${block.id}`}
              className="absolute top-0 z-20 -translate-x-1/2"
              style={{ left: `${HIT_LINE_PCT}%`, paddingTop: 4 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
            >
              <GemColumn chordName={block.chord} flash={null} />
            </motion.div>
          ))}

          {/* Scrolling chord blocks */}
          <AnimatePresence>
            {blocks.map(block => {
              if (block.pendingRetry) return null   // rendered above with pulse

              if (block.hit && !block.missed) {
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

              const timeToHit = block.startTime - gameTimeNow
              const xPct      = HIT_LINE_PCT + (timeToHit / HIGHWAY_DURATION_MS) * (100 - HIT_LINE_PCT)

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
