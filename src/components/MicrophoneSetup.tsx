'use client'

import { useEffect } from 'react'
import { useMicrophone } from '@/contexts/MicrophoneContext'
import { Button } from '@/components/ui/button'
import { Mic, MicOff } from 'lucide-react'

interface MicrophoneSetupProps {
  onStream: (stream: MediaStream) => void
  onError?: (err: string) => void
}

export function MicrophoneSetup({ onStream, onError }: MicrophoneSetupProps) {
  const { stream, permission, level, requestMic } = useMicrophone()

  // As soon as we have a stream (from this or any previous page), notify parent
  useEffect(() => {
    if (stream) onStream(stream)
  }, [stream, onStream])

  if (permission === 'granted' && stream) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
        <Mic className="w-4 h-4 text-green-600 flex-shrink-0" />
        <span className="text-sm text-green-700 font-medium">Microphone active</span>
        <div className="flex-1 h-2 bg-green-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-75"
            style={{ width: `${level * 100}%` }}
          />
        </div>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
        <MicOff className="w-4 h-4 text-red-600 flex-shrink-0" />
        <span className="text-sm text-red-700">Microphone blocked — check your browser permissions.</span>
        <Button size="sm" variant="outline" onClick={requestMic} className="ml-auto">Retry</Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <Mic className="w-4 h-4 text-blue-600 flex-shrink-0" />
      <span className="text-sm text-blue-700">
        {permission === 'requesting'
          ? 'Requesting microphone access…'
          : 'Allow microphone so the app can hear your guitar'}
      </span>
      <Button
        size="sm"
        onClick={requestMic}
        disabled={permission === 'requesting'}
        className="ml-auto"
      >
        {permission === 'requesting' ? 'Requesting…' : 'Allow Mic'}
      </Button>
    </div>
  )
}
