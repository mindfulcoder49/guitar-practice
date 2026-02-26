'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CatalogItem } from '@/types'
import { Play, Trash2, BookmarkCheck, Music, Zap, Mic, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'chord-progression': {
    label: 'Chord Progression',
    icon: <Zap className="w-4 h-4" />,
    color: 'bg-yellow-100 text-yellow-800',
  },
  melody: {
    label: 'Melody',
    icon: <Music className="w-4 h-4" />,
    color: 'bg-purple-100 text-purple-800',
  },
  fingerpick: {
    label: 'Fingerpick Pattern',
    icon: <Mic className="w-4 h-4" />,
    color: 'bg-orange-100 text-orange-800',
  },
}

function CatalogCard({ item, onDelete }: { item: CatalogItem; onDelete: (id: string) => void }) {
  const router = useRouter()
  const meta = TYPE_META[item.type] ?? TYPE_META['chord-progression']

  function handleLoad() {
    if (item.type === 'chord-progression') {
      router.push('/practice?progression=' + encodeURIComponent(item.data))
    } else {
      router.push('/songs/play?song=' + encodeURIComponent(item.data))
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/catalog?id=${item.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onDelete(item.id)
      toast.success('Removed from catalog')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge className={`${meta.color} flex items-center gap-1 flex-shrink-0`}>
            {meta.icon}
            {meta.label}
          </Badge>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" className="flex-1 gap-1.5" onClick={handleLoad}>
            <Play className="w-3.5 h-3.5" />
            Load
          </Button>
          <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/catalog')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setItems(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const progressions = items.filter(i => i.type === 'chord-progression')
  const melodies     = items.filter(i => i.type === 'melody')
  const patterns     = items.filter(i => i.type === 'fingerpick')

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <BookmarkCheck className="w-7 h-7 text-indigo-600" />
            My Catalog
          </h1>
          <p className="text-muted-foreground mt-1">Your saved progressions and songs</p>
        </div>

        {loading && (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <BookmarkCheck className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">No saved items yet.</p>
            <p className="text-sm text-muted-foreground">
              Save chord progressions or songs from{' '}
              <Link href="/chat" className="text-primary underline">AI Chat</Link>,{' '}
              <Link href="/practice" className="text-primary underline">Practice</Link>, or{' '}
              <Link href="/songs" className="text-primary underline">Songs</Link>.
            </p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="space-y-8">
            {progressions.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Chord Progressions ({progressions.length})
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {progressions.map(item => (
                    <CatalogCard key={item.id} item={item} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            )}

            {melodies.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-500" />
                  Melodies ({melodies.length})
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {melodies.map(item => (
                    <CatalogCard key={item.id} item={item} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            )}

            {patterns.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-orange-500" />
                  Fingerpick Patterns ({patterns.length})
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {patterns.map(item => (
                    <CatalogCard key={item.id} item={item} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
