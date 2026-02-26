'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, Music, BookmarkPlus } from 'lucide-react'
import { ChatMessage, ProgressionChord, AISong } from '@/types'
import { toast } from 'sonner'

interface ChatBotProps {
  onLoadProgression?: (progression: ProgressionChord[]) => void
}

function parseProgressionFromText(text: string): ProgressionChord[] | null {
  const match = text.match(/```json\s*([\s\S]*?)```/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1])
    if (Array.isArray(parsed) && parsed.every(p => p.chord && p.beats)) {
      return parsed as ProgressionChord[]
    }
  } catch {}
  return null
}

function parseSongFromText(text: string): AISong | null {
  const match = text.match(/```json\s*([\s\S]*?)```/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1])
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (parsed.type === 'melody' && Array.isArray(parsed.notes)) {
        return parsed as AISong
      }
      if (parsed.type === 'fingerpick' && Array.isArray(parsed.sequence)) {
        return parsed as AISong
      }
    }
  } catch {}
  return null
}

async function saveToCatalog(name: string, type: string, data: string) {
  const res = await fetch('/api/catalog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type, data }),
  })
  if (!res.ok) throw new Error('Failed to save')
}

// Chip preview for a song/pattern
function SongPreviewChips({ song }: { song: AISong }) {
  const LANE_CFG = [
    { label: 'E', color: '#4ade80' },
    { label: 'A', color: '#f87171' },
    { label: 'D', color: '#facc15' },
    { label: 'G', color: '#60a5fa' },
    { label: 'B', color: '#fb923c' },
    { label: 'e', color: '#c084fc' },
  ]
  function getLane(str: number) { return LANE_CFG[6 - str] }

  // Filter out rests — they have no string and can't be displayed as chips
  const items = (song.type === 'melody'
    ? song.notes.filter(n => !n.rest && n.string !== undefined)
    : song.sequence
  ).slice(0, 8)

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => {
        const lane = getLane(item.string!)
        return (
          <span
            key={i}
            className="px-2 py-0.5 rounded text-xs font-bold"
            style={{ background: `${lane.color}22`, color: lane.color, border: `1px solid ${lane.color}44` }}
          >
            {lane.label}
            {'fret' in item ? (item.fret === 0 ? '○' : item.fret) : ''}
          </span>
        )
      })}
      {items.length === 8 && (
        <span className="text-xs text-muted-foreground px-1">+more</span>
      )}
    </div>
  )
}

export function ChatBot({ onLoadProgression }: ChatBotProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your guitar practice assistant. I can create chord progressions, single-note melodies, or fingerpicking patterns for you. Try: \"Give me a blues riff\", \"Make a fingerpicking pattern for Em\", or \"Give me a chord progression\"",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: ChatMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      })

      if (!res.ok || !res.body) throw new Error('Failed to get response')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantContent += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
          return updated
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((msg, i) => {
          const progression = msg.role === 'assistant' ? parseProgressionFromText(msg.content) : null
          const aiSong      = msg.role === 'assistant' && !progression ? parseSongFromText(msg.content) : null
          const displayContent = msg.content.replace(/```json[\s\S]*?```/g, '').trim()

          return (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[88%] sm:max-w-[80%] space-y-2">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted rounded-bl-sm'
                  }`}
                >
                  {displayContent || (loading && i === messages.length - 1 ? '...' : '')}
                </div>

                {/* Chord progression card */}
                {progression && onLoadProgression && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {progression.map((p, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">
                            {p.chord} ({p.beats}♩)
                          </Badge>
                        ))}
                      </div>
                      <Button size="sm" className="w-full gap-2"
                        onClick={() => onLoadProgression(progression)}>
                        <Music className="w-4 h-4" />
                        Load into Practice
                      </Button>
                      <Button size="sm" variant="outline" className="w-full gap-2"
                        onClick={async () => {
                          try {
                            await saveToCatalog('AI Progression', 'chord-progression', JSON.stringify(progression))
                            toast.success('Saved to catalog!')
                          } catch {
                            toast.error('Failed to save')
                          }
                        }}>
                        <BookmarkPlus className="w-4 h-4" />
                        Save to Catalog
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* AI song card */}
                {aiSong && (
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Music className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-xs font-semibold text-purple-700">
                          {aiSong.type === 'melody' ? 'Melody' : 'Fingerpick Pattern'} • {aiSong.bpm} BPM
                        </span>
                      </div>
                      <SongPreviewChips song={aiSong} />
                      <Button size="sm" className="w-full gap-2"
                        onClick={() => router.push('/songs/play?song=' + encodeURIComponent(JSON.stringify(aiSong)))}>
                        <Music className="w-4 h-4" />
                        Load into Note Practice
                      </Button>
                      <Button size="sm" variant="outline" className="w-full gap-2"
                        onClick={async () => {
                          try {
                            await saveToCatalog(aiSong.title || 'AI Song', aiSong.type, JSON.stringify(aiSong))
                            toast.success('Saved to catalog!')
                          } catch {
                            toast.error('Failed to save')
                          }
                        }}>
                        <BookmarkPlus className="w-4 h-4" />
                        Save to Catalog
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for a progression, riff, or fingerpicking pattern..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
