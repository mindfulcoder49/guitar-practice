'use client'

import { useEffect, useMemo, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { ChordDiagram } from '@/components/ChordDiagram'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ROOT_OPTIONS,
  ROOT_LABELS,
  ChordQuality,
  generateChordPermutations,
  buildChordFormId,
} from '@/lib/chordPermutations'
import { toast } from 'sonner'

function formatShape(openStrings: number[]): string {
  return openStrings.map(f => (f < 0 ? 'x' : String(f))).join(' ')
}

function playedSpan(openStrings: number[]): string {
  const fretted = openStrings.filter(f => f > 0)
  if (fretted.length === 0) return 'Open'
  return `${Math.min(...fretted)}-${Math.max(...fretted)}`
}

export default function ChordGeneratorPage() {
  const [root, setRoot] = useState<(typeof ROOT_OPTIONS)[number]>('C')
  const [quality, setQuality] = useState<ChordQuality>('major')
  const [learned, setLearned] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const chordLabel = quality === 'major' ? root : `${root}m`

  useEffect(() => {
    fetch('/api/progress')
      .then(r => r.json())
      .then(data => {
        const names = data.learnedChords?.map((c: { chordName: string }) => c.chordName) ?? []
        setLearned(names)
      })
      .catch(() => {})
  }, [])

  const voicings = useMemo(
    () => generateChordPermutations(root, quality),
    [root, quality]
  )

  async function markAsLearned(formId: string) {
    if (saving || learned.includes(formId)) return
    setSaving(true)
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'learnChord',
          data: { chordName: formId, accuracy: 1 },
        }),
      })
      if (!res.ok) throw new Error('failed')
      setLearned(prev => (prev.includes(formId) ? prev : [...prev, formId]))
      toast.success('Form marked as learned')
    } catch {
      toast.error('Could not mark form as learned')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Chord Generator</h1>
          <p className="text-muted-foreground mt-1">
            All mathematically valid voicings for {chordLabel} on 6-string guitar using frets 0-9,
            with at least 4 adjacent played strings, max 4 fingers, and fretted notes
            contained within any 4-fret window.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Choose Chord</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Root</span>
              <select
                value={root}
                onChange={e => setRoot(e.target.value as (typeof ROOT_OPTIONS)[number])}
                className="border rounded-md px-3 py-2 bg-background"
              >
                {ROOT_OPTIONS.map(n => (
                  <option key={n} value={n}>{ROOT_LABELS[n]}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Quality</span>
              <select
                value={quality}
                onChange={e => setQuality(e.target.value as ChordQuality)}
                className="border rounded-md px-3 py-2 bg-background"
              >
                <option value="major">Major</option>
                <option value="minor">Minor</option>
              </select>
            </label>

            <div className="sm:ml-auto">
              <Badge variant="secondary" className="font-mono text-sm">
                {voicings.length} voicings found
              </Badge>
            </div>
          </CardContent>
        </Card>

        {voicings.length === 0 ? (
          <p className="text-muted-foreground">No voicings found for this chord under current constraints.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {voicings.map((v, i) => (
              <Card key={`${v.openStrings.join(',')}-${i}`} className="h-full">
                <CardContent className="p-4 space-y-3">
                  {(() => {
                    const formId = buildChordFormId(root, quality, v.openStrings)
                    const learnedForm = learned.includes(formId)
                    return (
                      <Button
                        size="sm"
                        variant={learnedForm ? 'secondary' : 'outline'}
                        className="w-full"
                        disabled={saving || learnedForm}
                        onClick={() => markAsLearned(formId)}
                      >
                        {learnedForm ? 'Form Learned' : saving ? 'Saving...' : 'Mark This Form Learned'}
                      </Button>
                    )
                  })()}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{chordLabel}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {formatShape(v.openStrings)}
                    </Badge>
                  </div>
                  <ChordDiagram chord={v} size="sm" showLegend={false} />
                  <div className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>Fret span: {playedSpan(v.openStrings)}</span>
                    <span>Start fret: {v.startFret}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
