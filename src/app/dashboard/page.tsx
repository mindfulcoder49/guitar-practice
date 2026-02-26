import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CURRICULUM_ORDER } from '@/lib/chords'
import { BookOpen, Zap, MessageSquare, Music2, CheckCircle, Clock, Music, BookmarkCheck } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const [learnedChords, recentSessions, learnedSongs] = await Promise.all([
    prisma.learnedChord.findMany({
      where: { userId: session.user.id },
      orderBy: { learnedAt: 'asc' },
    }),
    prisma.practiceSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.learnedSong.findMany({
      where: { userId: session.user.id },
      select: { songId: true },
    }),
  ])

  const learnedNames = learnedChords.map(c => c.chordName)
  const progressPercent = Math.round((learnedNames.length / CURRICULUM_ORDER.length) * 100)
  const nextChord = CURRICULUM_ORDER.find(c => !learnedNames.includes(c))

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={session.user.name} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            Welcome back{session.user.name ? `, ${session.user.name}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            {learnedNames.length === 0
              ? 'Start your guitar journey by learning your first chord.'
              : `You've learned ${learnedNames.length} of ${CURRICULUM_ORDER.length} chords.`}
          </p>
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold">Curriculum Progress</span>
              <span className="text-sm text-muted-foreground">{learnedNames.length}/{CURRICULUM_ORDER.length} chords</span>
            </div>
            <Progress value={progressPercent} className="h-3 mb-4" />
            <div className="flex flex-wrap gap-2">
              {CURRICULUM_ORDER.map(chord => (
                <Badge
                  key={chord}
                  variant={learnedNames.includes(chord) ? 'default' : 'outline'}
                  className={learnedNames.includes(chord) ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  {learnedNames.includes(chord) && <CheckCircle className="w-3 h-3 mr-1" />}
                  {chord}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            {
              href: nextChord ? `/learn/${nextChord}` : '/learn',
              icon: <BookOpen className="w-6 h-6 text-purple-600" />,
              title: 'Continue Learning',
              desc: nextChord ? `Next: ${nextChord}` : 'All chords learned!',
              color: 'bg-purple-50 border-purple-200',
            },
            {
              href: '/practice',
              icon: <Zap className="w-6 h-6 text-yellow-600" />,
              title: 'Practice Mode',
              desc: 'Guitar Hero style',
              color: 'bg-yellow-50 border-yellow-200',
            },
            {
              href: '/songs',
              icon: <Music className="w-6 h-6 text-purple-500" />,
              title: 'Songs & Patterns',
              desc: learnedSongs.length > 0 ? `${learnedSongs.length} songs learned` : 'Learn melodies & riffs',
              color: 'bg-purple-50 border-purple-200',
            },
            {
              href: '/chat',
              icon: <MessageSquare className="w-6 h-6 text-green-600" />,
              title: 'AI Chat',
              desc: 'Get progressions & songs',
              color: 'bg-green-50 border-green-200',
            },
            {
              href: '/catalog',
              icon: <BookmarkCheck className="w-6 h-6 text-indigo-600" />,
              title: 'My Catalog',
              desc: 'Saved progressions & songs',
              color: 'bg-indigo-50 border-indigo-200',
            },
          ].map(action => (
            <Link key={action.href} href={action.href}>
              <Card className={`h-full hover:shadow-md transition-shadow cursor-pointer border ${action.color}`}>
                <CardContent className="p-5">
                  <div className="mb-3">{action.icon}</div>
                  <p className="font-semibold">{action.title}</p>
                  <p className="text-sm text-muted-foreground">{action.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent sessions */}
        {recentSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSessions.map(s => {
                  const chords: string[] = JSON.parse(s.chordsPlayed)
                  return (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                          s.mode === 'guitar-hero' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {s.mode === 'guitar-hero' ? <Zap className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{s.mode.replace('-', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {chords.slice(0, 4).join(', ')}{chords.length > 4 ? '...' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{s.score} pts</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(s.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
