'use client'

import { useState } from 'react'
import { ChordTemplate } from '@/types'

interface ChordDiagramProps {
  chord: ChordTemplate
  size?: 'sm' | 'md' | 'lg'
  showLegend?: boolean
}

const SIZE_CONFIG = {
  sm: { stringSpacing: 16, fretSpacing: 22, dotRadius: 6, fontSize: 10 },
  md: { stringSpacing: 22, fretSpacing: 30, dotRadius: 8, fontSize: 12 },
  lg: { stringSpacing: 28, fretSpacing: 38, dotRadius: 10, fontSize: 14 },
}

// Standard string names from string 1 (leftmost in our layout = Low E) to string 6 (High e)
// Our layout: index 0 = Low E, index 5 = High e
const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e']
const FINGER_NAMES: Record<number, string> = {
  1: 'Index',
  2: 'Middle',
  3: 'Ring',
  4: 'Pinky',
}

export function ChordDiagram({ chord, size = 'md', showLegend }: ChordDiagramProps) {
  const [legendOpen, setLegendOpen] = useState(false)
  const cfg = SIZE_CONFIG[size]
  const { stringSpacing, fretSpacing, dotRadius, fontSize } = cfg

  const numStrings = 6
  const numFrets = 4
  const paddingLeft = 32
  const paddingTop = 32
  const labelAreaBottom = 20 // space for string name labels below grid

  const totalWidth = paddingLeft + (numStrings - 1) * stringSpacing + 20
  const totalHeight = paddingTop + numFrets * fretSpacing + labelAreaBottom

  const getStringX = (stringNum: number) =>
    paddingLeft + (stringNum - 1) * stringSpacing

  const getFretY = (fret: number) =>
    paddingTop + (fret - chord.startFret) * fretSpacing + fretSpacing / 2

  const topLineY = paddingTop
  const bottomLineY = topLineY + numFrets * fretSpacing

  // Legend is available on md/lg; shown only when user toggles it open
  const legendAvailable = (showLegend ?? size !== 'sm')

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-bold text-lg">{chord.displayName}</p>

      <svg
        width={totalWidth}
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="overflow-visible"
      >
        {/* === NUT (thick bar at top when starting at fret 1) === */}
        {chord.startFret === 1 && (
          <rect
            x={paddingLeft}
            y={topLineY - 5}
            width={(numStrings - 1) * stringSpacing}
            height={5}
            fill="#1a1a1a"
            rx={2}
          />
        )}

        {/* === Fret position label (e.g. "3fr") when not starting at fret 1 === */}
        {chord.startFret > 1 && (
          <text
            x={paddingLeft - 6}
            y={topLineY + fretSpacing / 2 + 4}
            fontSize={fontSize - 1}
            textAnchor="end"
            fill="#666"
          >
            {chord.startFret}fr
          </text>
        )}

        {/* === Fret lines (horizontal) === */}
        {Array.from({ length: numFrets + 1 }, (_, i) => (
          <line
            key={`fret-${i}`}
            x1={paddingLeft}
            y1={topLineY + i * fretSpacing}
            x2={paddingLeft + (numStrings - 1) * stringSpacing}
            y2={topLineY + i * fretSpacing}
            stroke="#ccc"
            strokeWidth={i === 0 && chord.startFret === 1 ? 0 : 1.5}
          />
        ))}

        {/* === String lines (vertical) === */}
        {Array.from({ length: numStrings }, (_, i) => (
          <line
            key={`string-${i}`}
            x1={getStringX(i + 1)}
            y1={topLineY}
            x2={getStringX(i + 1)}
            y2={bottomLineY}
            stroke="#999"
            strokeWidth={1.5}
          />
        ))}

        {/* === Open / muted string indicators above nut === */}
        {chord.openStrings.map((val, i) => {
          const x = getStringX(i + 1)
          const y = topLineY - 16
          if (val === 0) {
            // ○  open string
            return (
              <g key={`open-${i}`}>
                <circle cx={x} cy={y} r={dotRadius - 2} fill="none" stroke="#333" strokeWidth={1.5} />
              </g>
            )
          } else if (val === -1) {
            // ×  muted / don't play
            return (
              <text
                key={`muted-${i}`}
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontSize={fontSize + 2}
                fill="#888"
                fontWeight="bold"
              >
                ×
              </text>
            )
          }
          return null
        })}

        {/* === String name labels below the grid === */}
        {Array.from({ length: numStrings }, (_, i) => (
          <text
            key={`label-${i}`}
            x={getStringX(i + 1)}
            y={bottomLineY + labelAreaBottom - 4}
            textAnchor="middle"
            fontSize={fontSize - 1}
            fill="#666"
            fontStyle="italic"
          >
            {STRING_NAMES[i]}
          </text>
        ))}

        {/* === Barre bar === */}
        {chord.barres.map((barre, i) => {
          const x1 = getStringX(barre.fromString)
          const x2 = getStringX(barre.toString)
          const y = getFretY(barre.fret)
          return (
            <g key={`barre-${i}`}>
              <rect
                x={x1 - dotRadius}
                y={y - dotRadius}
                width={x2 - x1 + dotRadius * 2}
                height={dotRadius * 2}
                rx={dotRadius}
                fill="#1a1a1a"
              />
              <text
                x={x1 - dotRadius - 5}
                y={y + fontSize / 3}
                textAnchor="end"
                fontSize={fontSize - 1}
                fill="#555"
              >
                {barre.finger}
              </text>
            </g>
          )
        })}

        {/* === Finger dots with finger number inside === */}
        {chord.fingers.map((finger, i) => {
          const x = getStringX(finger.string)
          const y = getFretY(finger.fret)
          return (
            <g key={`finger-${i}`}>
              <circle cx={x} cy={y} r={dotRadius} fill="#1a1a1a" />
              <text
                x={x}
                y={y + fontSize / 3}
                textAnchor="middle"
                fontSize={fontSize - 1}
                fill="white"
                fontWeight="bold"
              >
                {finger.finger}
              </text>
            </g>
          )
        })}
      </svg>

      {/* === Collapsible legend (available on md/lg) === */}
      {legendAvailable && (
        <div className="w-full">
          <button
            onClick={() => setLegendOpen(o => !o)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <span>{legendOpen ? '▾' : '▸'}</span>
            {legendOpen ? 'Hide diagram guide' : 'How to read this diagram'}
          </button>

          {legendOpen && (
            <div className="mt-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm space-y-2">
              <div className="grid grid-cols-1 gap-1.5">
                <div className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <circle cx="9" cy="9" r="6" fill="none" stroke="#333" strokeWidth="1.5" />
                  </svg>
                  <span><strong>Open circle</strong> — strum this string without pressing any fret</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400 w-[18px] text-center leading-none">×</span>
                  <span><strong>X mark</strong> — skip this string (don&apos;t strum it)</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <circle cx="9" cy="9" r="7" fill="#1a1a1a" />
                    <text x="9" y="13" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">2</text>
                  </svg>
                  <span><strong>Filled dot</strong> — press here; number = which finger</span>
                </div>
                <div className="pt-1 border-t flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
                  <span><strong>1</strong> = Index</span>
                  <span><strong>2</strong> = Middle</span>
                  <span><strong>3</strong> = Ring</span>
                  <span><strong>4</strong> = Pinky</span>
                </div>
                <div className="text-muted-foreground text-xs">
                  Strings left → right: <span className="font-mono">E · A · D · G · B · e</span> (low to high)
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
