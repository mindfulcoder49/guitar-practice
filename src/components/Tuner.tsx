'use client'

import { useEffect, useRef, useState } from 'react'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const GUITAR_STRINGS = [
  { name: 'E2', freq: 82.41, string: 6 },
  { name: 'A2', freq: 110.0, string: 5 },
  { name: 'D3', freq: 146.83, string: 4 },
  { name: 'G3', freq: 196.0, string: 3 },
  { name: 'B3', freq: 246.94, string: 2 },
  { name: 'E4', freq: 329.63, string: 1 },
]

function freqToNote(freq: number): { note: string; octave: number; cents: number } | null {
  if (freq <= 0) return null
  const A4 = 440
  const semitones = 12 * Math.log2(freq / A4)
  const rounded = Math.round(semitones)
  const cents = (semitones - rounded) * 100
  const noteIndex = ((rounded % 12) + 12 + 9) % 12 // A=9
  const octave = Math.floor((rounded + 57) / 12) // offset from C0
  return { note: NOTE_NAMES[noteIndex], octave, cents }
}

function findNearestString(freq: number) {
  let best = GUITAR_STRINGS[0]
  let bestDist = Math.abs(freq - best.freq)
  for (const s of GUITAR_STRINGS) {
    const d = Math.abs(freq - s.freq)
    if (d < bestDist) { bestDist = d; best = s }
  }
  return best
}

interface TunerDisplayProps {
  cents: number
  note: string
  octave: number
  nearestString: typeof GUITAR_STRINGS[0]
  active: boolean
}

function TunerDisplay({ cents, note, octave, nearestString, active }: TunerDisplayProps) {
  const centsDisplay = Math.round(cents)
  const inTune = active && Math.abs(cents) < 5
  const closeEnough = active && Math.abs(cents) < 15
  const color = inTune ? '#22c55e' : closeEnough ? '#eab308' : '#ef4444'
  const needleAngle = active ? Math.max(-50, Math.min(50, cents)) * 1.8 : 0

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Note display */}
      <div className="text-center">
        <div className="text-7xl font-bold tracking-tight" style={{ color: active ? color : '#9ca3af' }}>
          {active ? `${note}${octave}` : '—'}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {active ? `${centsDisplay > 0 ? '+' : ''}${centsDisplay} cents` : 'Play a string'}
        </div>
      </div>

      {/* Needle gauge */}
      <div className="relative w-64 h-36">
        <svg viewBox="0 0 200 110" className="w-full h-full">
          {/* Gauge arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Colored zones */}
          <path
            d="M 20 100 A 80 80 0 0 1 100 20"
            fill="none"
            stroke="#fca5a5"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="0 126 126 0"
          />
          <path
            d="M 100 20 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#fca5a5"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Center green zone */}
          <path
            d="M 85 25 A 80 80 0 0 1 115 25"
            fill="none"
            stroke="#86efac"
            strokeWidth="8"
          />

          {/* Tick marks */}
          {[-50, -25, 0, 25, 50].map(val => {
            const angle = (val / 50) * 90 - 90 // -90 to +90 degrees from center
            const rad = (angle * Math.PI) / 180
            const cx = 100, cy = 100, r = 80
            const x1 = cx + (r - 10) * Math.cos(rad)
            const y1 = cy + (r - 10) * Math.sin(rad)
            const x2 = cx + r * Math.cos(rad)
            const y2 = cy + r * Math.sin(rad)
            return (
              <line key={val} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={val === 0 ? '#374151' : '#9ca3af'} strokeWidth={val === 0 ? 2 : 1} />
            )
          })}

          {/* Needle */}
          <g transform={`rotate(${needleAngle}, 100, 100)`} style={{ transition: 'transform 0.1s ease-out' }}>
            <line x1="100" y1="100" x2="100" y2="28" stroke={active ? color : '#d1d5db'} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="100" cy="100" r="5" fill={active ? color : '#9ca3af'} />
          </g>

          {/* Labels */}
          <text x="22" y="115" fontSize="10" fill="#9ca3af" textAnchor="middle">−50</text>
          <text x="100" y="115" fontSize="10" fill="#374151" textAnchor="middle">0</text>
          <text x="178" y="115" fontSize="10" fill="#9ca3af" textAnchor="middle">+50</text>
        </svg>
      </div>

      {/* Guitar string indicators */}
      <div className="flex gap-2">
        {GUITAR_STRINGS.slice().reverse().map(s => (
          <div
            key={s.string}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              active && nearestString.string === s.string
                ? 'border-current text-white'
                : 'border-muted-foreground/30 text-muted-foreground'
            }`}
            style={active && nearestString.string === s.string ? { backgroundColor: color, borderColor: color } : {}}
          >
            {s.name}
          </div>
        ))}
      </div>
    </div>
  )
}

interface TunerProps {
  stream: MediaStream | null
}

export function Tuner({ stream }: TunerProps) {
  const [detected, setDetected] = useState<{ note: string; octave: number; cents: number; freq: number } | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const animRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!stream) return

    async function setup() {
      const { PitchDetector } = await import('pitchy')
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream!)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)

      const buf = new Float32Array(analyser.fftSize)
      const detector = PitchDetector.forFloat32Array(analyser.fftSize)

      function tick() {
        analyser.getFloatTimeDomainData(buf)
        const [freq, clarity] = detector.findPitch(buf, ctx.sampleRate)
        if (clarity > 0.95 && freq > 60 && freq < 400) {
          const info = freqToNote(freq)
          if (info) setDetected({ ...info, freq })
        } else {
          setDetected(null)
        }
        animRef.current = requestAnimationFrame(tick)
      }
      tick()
    }

    setup()

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      audioCtxRef.current?.close()
    }
  }, [stream])

  const nearestString = detected ? findNearestString(detected.freq) : GUITAR_STRINGS[0]

  return (
    <TunerDisplay
      cents={detected?.cents ?? 0}
      note={detected?.note ?? '—'}
      octave={detected?.octave ?? 0}
      nearestString={nearestString}
      active={!!detected}
    />
  )
}
