import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SongLearnCard } from '@/components/SongLearnCard'
import { PatternNotation } from '@/components/PatternNotation'
import { getSongOrPattern } from '@/lib/songs'
import { CheckCircle, Play, ArrowLeft, Music } from 'lucide-react'

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
}

export default async function SongDetailPage({ params }: { params: Promise<{ songId: string }> }) {
  const { songId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const songOrPattern = getSongOrPattern(songId)
  if (!songOrPattern) notFound()

  const learnedSong = await prisma.learnedSong.findUnique({
    where: { userId_songId: { userId: session.user.id, songId } },
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={session.user.name} />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/songs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Songs
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {songOrPattern.title}
                  {learnedSong && <CheckCircle className="w-5 h-5 text-green-500" />}
                </CardTitle>
                {'artist' in songOrPattern && songOrPattern.artist && (
                  <p className="text-muted-foreground mt-0.5">{songOrPattern.artist}</p>
                )}
                {'chordName' in songOrPattern && (
                  <p className="text-muted-foreground mt-0.5">Hold: <strong>{songOrPattern.chordName}</strong></p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={DIFFICULTY_COLOR[songOrPattern.difficulty]}>
                  {songOrPattern.difficulty}
                </Badge>
                <span className="text-xs text-muted-foreground">{songOrPattern.bpm} BPM</span>
              </div>
            </div>

            {songOrPattern.description && (
              <p className="text-sm text-muted-foreground mt-2">{songOrPattern.description}</p>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Note/pattern display */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                <Music className="w-4 h-4" />
                {songOrPattern.type === 'melody' ? 'Notes' : 'Picking Sequence'}
              </h3>
              {songOrPattern.type === 'melody' ? (
                <SongLearnCard notes={songOrPattern.notes} />
              ) : (
                <PatternNotation sequence={songOrPattern.sequence} chordName={songOrPattern.chordName} />
              )}
            </div>

            {/* Info row */}
            <div className="flex gap-4 text-sm text-muted-foreground border-t pt-4">
              <span>{songOrPattern.bpm} BPM</span>
              {songOrPattern.type === 'melody' && (
                <span>{songOrPattern.notes.length} notes × 2 loops</span>
              )}
              {songOrPattern.type === 'fingerpick' && (
                <span>{songOrPattern.sequence.length} steps × {songOrPattern.loops} loops</span>
              )}
            </div>

            {/* Play button */}
            <Link href={`/songs/${songId}/play`}>
              <Button className="w-full gap-2" size="lg">
                <Play className="w-5 h-5" />
                Play with Note Detection
              </Button>
            </Link>

            {learnedSong && (
              <p className="text-center text-xs text-green-600 flex items-center justify-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Completed with {Math.round(learnedSong.accuracy * 100)}% accuracy
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
