'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Tuner } from '@/components/Tuner'
import { MicrophoneSetup } from '@/components/MicrophoneSetup'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Music2 } from 'lucide-react'

export default function TunerPage() {
  const [stream, setStream] = useState<MediaStream | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Music2 className="w-7 h-7 sm:w-8 sm:h-8 text-blue-500" />
            Guitar Tuner
          </h1>
          <p className="text-muted-foreground">
            Chromatic tuner — pluck one string at a time for best results
          </p>
        </div>

        <div className="space-y-6">
          <MicrophoneSetup onStream={setStream} />

          <Card>
            <CardContent className="p-4 sm:p-8">
              <Tuner stream={stream} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Standard Tuning Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                {[
                  { string: 6, note: 'E2', freq: '82.4 Hz', color: 'bg-red-100 text-red-700' },
                  { string: 5, note: 'A2', freq: '110 Hz', color: 'bg-orange-100 text-orange-700' },
                  { string: 4, note: 'D3', freq: '146.8 Hz', color: 'bg-yellow-100 text-yellow-700' },
                  { string: 3, note: 'G3', freq: '196 Hz', color: 'bg-green-100 text-green-700' },
                  { string: 2, note: 'B3', freq: '246.9 Hz', color: 'bg-blue-100 text-blue-700' },
                  { string: 1, note: 'E4', freq: '329.6 Hz', color: 'bg-purple-100 text-purple-700' },
                ].map(s => (
                  <div key={s.string} className={`rounded-lg p-2 ${s.color}`}>
                    <div className="font-bold">{s.note}</div>
                    <div className="text-xs opacity-75">{s.freq}</div>
                    <div className="text-xs mt-1 font-medium">String {s.string}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
