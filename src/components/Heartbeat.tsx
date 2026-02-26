'use client'

import { useEffect } from 'react'

const INTERVAL_MS = 45_000  // ping every 45 s — well inside Fly's 60 s suspend window

export function Heartbeat() {
  useEffect(() => {
    const id = setInterval(() => {
      fetch('/api/heartbeat').catch(() => {})  // fire-and-forget; ignore network errors
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return null
}
