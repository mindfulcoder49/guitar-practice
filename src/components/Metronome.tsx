'use client'

import { useEffect, useRef, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Volume2, VolumeX } from 'lucide-react'

interface MetronomeProps {
  bpm: number
  onBpmChange: (bpm: number) => void
  running: boolean
  onTick?: (beat: number) => void
}

export function Metronome({ bpm, onBpmChange, running, onTick }: MetronomeProps) {
  const [beat, setBeat] = useState(0)
  const [muted, setMuted] = useState(false)
  const synthRef = useRef<unknown>(null)
  const seqRef = useRef<unknown>(null)
  const mutedRef = useRef(false)
  mutedRef.current = muted

  useEffect(() => {
    if (!running) {
      if (seqRef.current) {
        (seqRef.current as { stop: () => void; dispose: () => void }).stop()
        ;(seqRef.current as { stop: () => void; dispose: () => void }).dispose()
        seqRef.current = null
      }
      setBeat(0)
      return
    }

    let beatCount = 0

    async function start() {
      const Tone = await import('tone')
      await Tone.start()
      Tone.getTransport().bpm.value = bpm

      const synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.08 },
        volume: -6,
      }).toDestination()
      synthRef.current = synth

      const seq = new Tone.Sequence(
        (time: number) => {
          if (!mutedRef.current) {
            const isDownbeat = beatCount % 4 === 0
            synth.triggerAttackRelease(isDownbeat ? 'C5' : 'A4', '32n', time)
          }
          const b = beatCount
          Tone.getDraw().schedule(() => {
            setBeat(b % 4)
            onTick?.(b)
          }, time)
          beatCount++
        },
        [0],
        '4n'
      )
      seq.start(0)
      Tone.getTransport().start()
      seqRef.current = seq
    }

    start()

    return () => {
      if (seqRef.current) {
        (seqRef.current as { stop: () => void; dispose: () => void }).stop()
        ;(seqRef.current as { stop: () => void; dispose: () => void }).dispose()
        seqRef.current = null
      }
      import('tone').then(Tone => Tone.getTransport().stop())
    }
  }, [running, bpm, onTick])

  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
      {/* Beat dots */}
      <div className="flex gap-1 flex-shrink-0">
        {[0, 1, 2, 3].map(b => (
          <div
            key={b}
            className={`rounded-full transition-all duration-75 ${
              b === 0 ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'
            } ${
              running && beat === b
                ? b === 0 ? 'bg-primary scale-125' : 'bg-primary/70 scale-110'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* BPM slider */}
      <div className="flex-1 flex items-center gap-3">
        <Slider
          min={40}
          max={160}
          step={1}
          value={[bpm]}
          onValueChange={([v]) => onBpmChange(v)}
          className="flex-1"
        />
        <span className="text-sm font-mono w-16 text-right tabular-nums">{bpm} BPM</span>
      </div>

      {/* Mute toggle */}
      <button
        onClick={() => setMuted(m => !m)}
        className={`flex-shrink-0 p-2.5 rounded-md transition-colors touch-manipulation ${
          muted
            ? 'text-muted-foreground hover:text-foreground'
            : 'text-foreground hover:text-muted-foreground'
        }`}
        title={muted ? 'Unmute metronome' : 'Mute metronome'}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  )
}
