import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SONGS, FINGERPICK_PATTERNS } from '@/lib/songs'
import { CheckCircle, Music, Mic } from 'lucide-react'

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
}

export default async function SongsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const learnedSongs = await prisma.learnedSong.findMany({
    where: { userId: session.user.id },
    select: { songId: true },
  })
  const learnedIds = new Set(learnedSongs.map(s => s.songId))

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={session.user.name} />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Music className="w-7 h-7 text-purple-600" />
            Songs & Patterns
          </h1>
          <p className="text-muted-foreground mt-1">
            Learn melodies and fingerpicking patterns with Guitar Hero-style note detection
          </p>
        </div>

        <div className="space-y-8">
          {/* Melodies & Riffs */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-500" />
              Melodies &amp; Riffs
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {SONGS.map(song => (
                <Link key={song.id} href={`/songs/${song.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{song.title}</p>
                          {song.artist && (
                            <p className="text-sm text-muted-foreground">{song.artist}</p>
                          )}
                        </div>
                        {learnedIds.has(song.id) && (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={DIFFICULTY_COLOR[song.difficulty]}>
                          {song.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{song.bpm} BPM</span>
                        <span className="text-xs text-muted-foreground">{song.notes.length} notes</span>
                      </div>
                      {song.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {song.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Fingerpicking Patterns */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mic className="w-5 h-5 text-orange-500" />
              Fingerpicking Patterns
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {FINGERPICK_PATTERNS.map(pattern => (
                <Link key={pattern.id} href={`/songs/${pattern.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{pattern.title}</p>
                          <p className="text-sm text-muted-foreground">Hold: {pattern.chordName}</p>
                        </div>
                        {learnedIds.has(pattern.id) && (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={DIFFICULTY_COLOR[pattern.difficulty]}>
                          {pattern.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{pattern.bpm} BPM</span>
                        <span className="text-xs text-muted-foreground">{pattern.sequence.length}-step pattern</span>
                      </div>
                      {pattern.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {pattern.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
