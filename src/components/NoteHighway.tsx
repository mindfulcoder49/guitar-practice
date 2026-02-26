'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NoteEvent, PatternStep, NoteBlock, NoteMatch } from '@/types'
import { fretToNoteName } from '@/lib/noteUtils'

// ─── Highway constants ────────────────────────────────────────────────────────

const LANE_HEIGHT = 46           // taller lanes — easier to read
const GEM_W      = 30
const GEM_H      = 34            // fills most of the lane height
const HIT_LINE_PCT      = 18
const HIGHWAY_DURATION_MS = 4000
const HIT_WINDOW_EARLY  = 150
const HIT_WINDOW_LATE   = 450
const MIN_HIT_GAP_MS    = 150
const LANE_HEADER_H     = 20    // px of dead space above the first lane

// One colour per string: index 0 = Low E (string 6), index 5 = High e (string 1)
const LANE_CFG = [
  { label: 'E', color: '#4ade80', dim: '#052e16' },  // green  — Low E  (string 6)
  { label: 'A', color: '#f87171', dim: '#450a0a' },  // red            (string 5)
  { label: 'D', color: '#fde047', dim: '#422006' },  // yellow         (string 4)
  { label: 'G', color: '#60a5fa', dim: '#172554' },  // blue           (string 3)
  { label: 'B', color: '#fb923c', dim: '#431407' },  // orange         (string 2)
  { label: 'e', color: '#d946ef', dim: '#3b0764' },  // purple — High e (string 1)
]

// Lane display: High e on top (index 0) → Low E on bottom (index 5)
const LANE_DISPLAY = [...LANE_CFG].reverse()

// MIDI note for each open string — used for MIDI-based hit matching
const OPEN_MIDI: Record<number, number> = {
  1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40,
}

/**
 * Returns true if the detected match should count as a hit for the block.
 * - Fingerpick (fret === -1): match on string number only
 * - Melody: ±1 semitone tolerance on MIDI note number
 */
function isNoteHit(match: NoteMatch | null, block: NoteBlock): boolean {
  if (!match) return false
  if (block.fret === -1) return match.string === block.string
  const blockMidi = OPEN_MIDI[block.string] + block.fret
  return Math.abs(match.midi - blockMidi) <= 1
}

function getLaneConfig(str: number) { return LANE_CFG[6 - str] }
function stringToDisplayIdx(str: number): number { return str - 1 }

// ─── Props ────────────────────────────────────────────────────────────────────

interface NoteHighwayProps {
  notes?: NoteEvent[]
  pattern?: PatternStep[]
  patternLoops?: number
  bpm: number
  running: boolean
  currentNoteMatch: NoteMatch | null
  onScore: (hit: boolean) => void
  mode?: 'practice' | 'test'
  immersive?: boolean
}

// ─── Single note gem ──────────────────────────────────────────────────────────

function NoteGem({ fret, color, flash }: {
  fret: number
  color: string
  flash: 'hit' | 'miss' | 'approach' | 'waiting' | null
}) {
  const isOpen = fret === 0
  const isAny  = fret === -1

  const bg =
    flash === 'hit'     ? '#22c55e' :
    flash === 'miss'    ? '#374151' :
    flash === 'waiting' ? color :
    isOpen || isAny     ? 'transparent' : color

  const border =
    flash === 'hit'     ? '#86efac' :
    flash === 'miss'    ? '#4b5563' :
    flash === 'waiting' ? '#ffffff' :
    color

  let label = ''
  if (flash !== 'hit' && flash !== 'miss') {
    if (isAny)       label = '~'
    else if (isOpen) label = '○'
    else             label = String(fret)
  }

  return (
    <div style={{
      width: GEM_W, height: GEM_H, borderRadius: 6,
      background: bg,
      border: `2.5px solid ${border}`,
      boxShadow:
        flash === 'waiting'  ? `0 0 10px ${color}, 0 0 20px ${color}44` :
        flash === 'approach' ? `0 0 8px ${color}` :
        flash === 'hit'      ? '0 0 12px #22c55e' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {label && (
        <span style={{
          fontSize: 11, fontWeight: 'bold',
          color: (isOpen || isAny) ? color : 'rgba(0,0,0,0.85)',
          lineHeight: 1, userSelect: 'none',
        }}>
          {label}
        </span>
      )}
    </div>
  )
}

// ─── A column with 6 lane rows; gem only on the target string ─────────────────

function NoteGemColumn({ block, flash }: {
  block: NoteBlock
  flash: 'hit' | 'miss' | 'approach' | 'waiting' | null
}) {
  const targetDisplayIdx = stringToDisplayIdx(block.string)
  const lane = getLaneConfig(block.string)

  return (
    // paddingTop matches LANE_HEADER_H so gems sit inside their lane stripes
    <div className="flex flex-col items-center" style={{ paddingTop: LANE_HEADER_H }}>
      {LANE_DISPLAY.map((_, displayIdx) => (
        <div
          key={displayIdx}
          style={{ height: LANE_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {displayIdx === targetDisplayIdx
            ? <NoteGem fret={block.fret} color={lane.color} flash={flash} />
            : <div style={{ width: GEM_W, height: 1 }} />
          }
        </div>
      ))}
    </div>
  )
}

// ─── Upcoming note chip ───────────────────────────────────────────────────────

function UpcomingNoteChip({ block }: { block: NoteBlock }) {
  const lane = getLaneConfig(block.string)
  const label = block.fret === -1
    ? lane.label
    : fretToNoteName(block.string, block.fret)

  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold"
      style={{
        background: `${lane.dim}cc`,
        border: `1.5px solid ${lane.color}66`,
        color: lane.color,
      }}
    >
      {label}
      {block.fret === 0 && <span style={{ opacity: 0.6, fontSize: 9 }}>open</span>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NoteHighway({
  notes, pattern, patternLoops = 4,
  bpm, running, currentNoteMatch, onScore,
  mode = 'test', immersive = false,
}: NoteHighwayProps) {

  const [blocks, setBlocks]           = useState<NoteBlock[]>([])
  const [, setFrame]                  = useState(0)
  const [pausedBlock, setPausedBlock] = useState<NoteBlock | null>(null)

  const startTimeRef      = useRef<number>(0)
  const animRef           = useRef<number | undefined>(undefined)
  const matchRef          = useRef<NoteMatch | null>(null)
  const blocksRef         = useRef<NoteBlock[]>([])
  const pausedBlockRef    = useRef<NoteBlock | null>(null)
  const pausedGameTimeRef = useRef<number | undefined>(undefined)
  const pendingRetryIdRef = useRef<string | null>(null)
  const modeRef           = useRef(mode)
  const lastHitTimeRef    = useRef<number>(0)

  matchRef.current       = currentNoteMatch
  pausedBlockRef.current = pausedBlock
  modeRef.current        = mode

  function getGameTime(): number {
    if (pausedGameTimeRef.current !== undefined) return pausedGameTimeRef.current
    return performance.now() - startTimeRef.current
  }

  // ── Build block schedule ────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) {
      setBlocks([])
      blocksRef.current = []
      return
    }

    const beatMs = (60 / bpm) * 1000
    startTimeRef.current = performance.now()

    setPausedBlock(null)
    pausedBlockRef.current    = null
    pausedGameTimeRef.current = undefined
    pendingRetryIdRef.current = null
    lastHitTimeRef.current    = 0

    const newBlocks: NoteBlock[] = []
    let elapsed = 0

    if (notes && notes.length > 0) {
      for (let loop = 0; loop < 2; loop++) {
        for (const evt of notes) {
          if (evt.rest || evt.string === undefined || evt.fret === undefined) {
            elapsed += evt.duration * beatMs
            continue
          }
          newBlocks.push({
            id:        `${loop}-note-${elapsed}`,
            string:    evt.string as 1|2|3|4|5|6,
            fret:      evt.fret,
            duration:  evt.duration,
            startTime: elapsed + HIGHWAY_DURATION_MS,
          })
          elapsed += evt.duration * beatMs
        }
        elapsed += beatMs * 2
      }
    } else if (pattern && pattern.length > 0) {
      for (let loop = 0; loop < patternLoops; loop++) {
        for (const step of pattern) {
          newBlocks.push({
            id:        `${loop}-step-${elapsed}`,
            string:    step.string,
            fret:      -1,
            duration:  step.duration,
            startTime: elapsed + HIGHWAY_DURATION_MS,
          })
          elapsed += step.duration * beatMs
        }
      }
    }

    setBlocks(newBlocks)
    blocksRef.current = newBlocks
  }, [running, notes, pattern, patternLoops, bpm])

  // ── Hit-detection loop ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) {
      setPausedBlock(null)
      pausedBlockRef.current    = null
      pausedGameTimeRef.current = undefined
      return
    }

    function tick() {
      const gameTime = getGameTime()
      const match    = matchRef.current

      setFrame(f => f + 1)

      // Practice mode: waiting for retry on missed note
      if (pausedBlockRef.current !== null) {
        const pb  = pausedBlockRef.current
        const now = performance.now()
        const isHit = isNoteHit(match, pb) && (now - lastHitTimeRef.current > MIN_HIT_GAP_MS)

        if (isHit) {
          lastHitTimeRef.current = now
          const frozenTime = pausedGameTimeRef.current!
          startTimeRef.current      = performance.now() - frozenTime
          pausedGameTimeRef.current = undefined

          const newBlocks = blocksRef.current.map(b =>
            b.id === pendingRetryIdRef.current
              ? { ...b, pendingRetry: false, hit: true }
              : b
          )
          blocksRef.current = newBlocks
          setBlocks(newBlocks)
          onScore(true)
          pausedBlockRef.current    = null
          pendingRetryIdRef.current = null
          setPausedBlock(null)
        }
        animRef.current = requestAnimationFrame(tick)
        return
      }

      let pauseTrigger: NoteBlock | null = null
      const now = performance.now()

      const newBlocks = blocksRef.current.map(block => {
        if (block.hit || block.missed || block.pendingRetry) return block

        const timeToHit = block.startTime - gameTime
        const inWindow  = timeToHit > -HIT_WINDOW_LATE && timeToHit < HIT_WINDOW_EARLY

        const isHit = isNoteHit(match, block) && (now - lastHitTimeRef.current > MIN_HIT_GAP_MS)

        if (inWindow && isHit) {
          lastHitTimeRef.current = now
          onScore(true)
          return { ...block, hit: true }
        }

        if (timeToHit < -HIT_WINDOW_LATE) {
          if (modeRef.current === 'practice' && !pauseTrigger) {
            pauseTrigger = block
            return { ...block, pendingRetry: true }
          } else if (modeRef.current === 'test') {
            onScore(false)
            return { ...block, missed: true }
          }
        }

        return block
      })

      const changed = newBlocks.some((b, i) => b !== blocksRef.current[i])
      if (changed) {
        blocksRef.current = newBlocks
        setBlocks(newBlocks)
      }

      if (pauseTrigger) {
        const pt = pauseTrigger as NoteBlock
        pausedGameTimeRef.current = gameTime
        pendingRetryIdRef.current  = pt.id
        pausedBlockRef.current     = pt
        setPausedBlock(pt)
      }

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [running, onScore])

  // ── Upcoming notes preview ─────────────────────────────────────────────────
  const gameTimeNow  = getGameTime()
  const pendingBlock = blocks.find(b => b.pendingRetry)
  const nextBlocks   = blocks
    .filter(b => !b.hit && !b.missed && !b.pendingRetry && b.startTime - gameTimeNow > -HIT_WINDOW_LATE)
    .sort((a, b) => a.startTime - b.startTime)
  const upcomingBlocks = running
    ? [
        ...(pendingBlock ? [pendingBlock] : []),
        ...nextBlocks.slice(0, pendingBlock ? 4 : 5),
      ]
    : []

  const totalHeight = immersive
    ? LANE_HEIGHT * 6 + LANE_HEADER_H + 100
    : LANE_HEIGHT * 6 + LANE_HEADER_H

  return (
    <div className="flex flex-col gap-3">

      {/* Live detection readout — always rendered to avoid layout shift */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 text-xs"
        style={{ background: '#0d1117', minHeight: 32 }}>
        <span style={{ color: '#6b7280' }}>Hearing:</span>
        {currentNoteMatch ? (
          <>
            <span style={{ color: getLaneConfig(currentNoteMatch.string).color, fontWeight: 700, fontSize: 13 }}>
              {fretToNoteName(currentNoteMatch.string, currentNoteMatch.fret)}
            </span>
            <span style={{ color: '#4b5563' }}>
              {Math.round(currentNoteMatch.freq)}Hz · {Math.round(currentNoteMatch.clarity * 100)}%
            </span>
          </>
        ) : (
          <span style={{ color: '#374151' }}>—</span>
        )}
        {/* Paused indicator */}
        {pausedBlock && (
          <span className="ml-auto text-yellow-400 font-semibold text-xs">
            ⏸ play {getLaneConfig(pausedBlock.string).label}
            {pausedBlock.fret !== -1 ? ` fret ${pausedBlock.fret}` : ''}
          </span>
        )}
      </div>

      {/* Upcoming preview */}
      {upcomingBlocks.length > 0 && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl border border-gray-700 overflow-x-auto"
          style={{ background: '#0d1117' }}
        >
          <span className="text-xs font-semibold whitespace-nowrap flex-shrink-0" style={{ color: '#6b7280' }}>
            Next:
          </span>
          <div className="flex gap-1.5">
            {upcomingBlocks.map((block, i) => (
              <div key={`upcoming-${block.id}-${i}`} style={{ opacity: Math.max(0.35, 1 - i * 0.18) }}>
                <UpcomingNoteChip block={block} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Highway */}
      <div className="flex gap-0 rounded-xl overflow-hidden border border-gray-600">

        {/* String label column — absolutely positioned to guarantee alignment with lane stripes */}
        <div
          className="relative flex-shrink-0 border-r border-gray-600"
          style={{ width: 40, height: totalHeight, background: '#0d1117' }}
        >
          {LANE_DISPLAY.map((lane, displayIdx) => {
            const strNum   = displayIdx + 1
            const isActive = currentNoteMatch !== null && currentNoteMatch.string === strNum
            return (
              <div
                key={lane.label}
                className="absolute flex items-center justify-center font-bold text-sm gap-1"
                style={{
                  top:   LANE_HEADER_H + displayIdx * LANE_HEIGHT,
                  height: LANE_HEIGHT,
                  left: 0, right: 0,
                  color: isActive ? lane.color : `${lane.color}55`,
                  borderBottom: displayIdx < 5 ? '1px solid #1f2937' : 'none',
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: isActive ? lane.color : 'transparent',
                  boxShadow:  isActive ? `0 0 5px ${lane.color}` : 'none',
                }} />
                {lane.label}
              </div>
            )
          })}
        </div>

        {/* Scrolling highway */}
        <div className="relative flex-1 overflow-hidden" style={{ height: totalHeight, background: '#060a0f' }}>

          {/* Lane background stripes */}
          {LANE_DISPLAY.map((lane, i) => (
            <div
              key={i}
              className="absolute left-0 right-0"
              style={{
                top:    LANE_HEADER_H + i * LANE_HEIGHT,
                height: LANE_HEIGHT,
                background: `${lane.dim}bb`,
                borderBottom: i < 5 ? '1px solid #1e2a3a' : 'none',
              }}
            />
          ))}

          {/* Hit line */}
          <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: `${HIT_LINE_PCT}%` }}>
            <div className="absolute inset-0 w-px bg-yellow-300/80" />
            <div className="absolute inset-0 -left-3 w-6 bg-yellow-300/8" />
          </div>
          <div
            className="absolute bottom-1 z-10 text-[8px] text-yellow-300/60 font-bold tracking-widest -translate-x-1/2"
            style={{ left: `${HIT_LINE_PCT}%` }}
          >
            PLAY
          </div>

          {/* Pending-retry block: sits static at hit line — no pulsing, interface just looks paused */}
          {blocks.filter(b => b.pendingRetry).map(block => (
            <div
              key={`retry-${block.id}`}
              className="absolute top-0 z-20 -translate-x-1/2"
              style={{ left: `${HIT_LINE_PCT}%` }}
            >
              <NoteGemColumn block={block} flash="waiting" />
            </div>
          ))}

          {/* Scrolling note blocks */}
          <AnimatePresence>
            {blocks.map(block => {
              if (block.pendingRetry) return null

              if (block.hit && !block.missed) {
                return (
                  <motion.div
                    key={`flash-${block.id}`}
                    className="absolute top-0 z-20 -translate-x-1/2"
                    style={{ left: `${HIT_LINE_PCT}%` }}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <NoteGemColumn block={block} flash="hit" />
                  </motion.div>
                )
              }

              if (block.missed || block.hit) return null

              const timeToHit = block.startTime - gameTimeNow
              const xPct      = HIT_LINE_PCT + (timeToHit / HIGHWAY_DURATION_MS) * (100 - HIT_LINE_PCT)

              if (xPct > 108 || xPct < -10) return null

              const approaching = timeToHit < HIT_WINDOW_EARLY * 2 && timeToHit > -HIT_WINDOW_LATE

              return (
                <motion.div
                  key={block.id}
                  className="absolute top-0 z-20 -translate-x-1/2"
                  style={{ left: `${xPct}%` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <NoteGemColumn block={block} flash={approaching ? 'approach' : null} />
                </motion.div>
              )
            })}
          </AnimatePresence>

          {!running && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span style={{ color: '#4b5563' }} className="text-sm">Press Start to begin</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
