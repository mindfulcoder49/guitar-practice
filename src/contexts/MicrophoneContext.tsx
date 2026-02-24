'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react'

type Permission = 'idle' | 'requesting' | 'granted' | 'denied'

interface MicrophoneContextType {
  stream: MediaStream | null
  permission: Permission
  level: number          // 0–1 input volume for the level meter
  requestMic: () => Promise<void>
}

const MicrophoneContext = createContext<MicrophoneContextType>({
  stream: null,
  permission: 'idle',
  level: 0,
  requestMic: async () => {},
})

export function MicrophoneProvider({ children }: { children: ReactNode }) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [permission, setPermission] = useState<Permission>('idle')
  const [level, setLevel] = useState(0)
  const animRef = useRef<number | undefined>(undefined)
  const streamRef = useRef<MediaStream | null>(null)

  const requestMic = useCallback(async () => {
    if (streamRef.current) return   // already have it, don't ask again
    setPermission('requesting')
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      streamRef.current = s
      setStream(s)
      setPermission('granted')

      // Level meter — lives for the full session
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(s)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      function tick() {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (const v of data) sum += Math.abs(v - 128)
        setLevel(Math.min(1, sum / data.length / 30))
        animRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      setPermission('denied')
    }
  }, [])

  // Clean up only when the whole app unmounts (i.e. browser tab closes)
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <MicrophoneContext.Provider value={{ stream, permission, level, requestMic }}>
      {children}
    </MicrophoneContext.Provider>
  )
}

export function useMicrophone() {
  return useContext(MicrophoneContext)
}
