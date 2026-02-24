import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [learnedChords, recentSessions] = await Promise.all([
    prisma.learnedChord.findMany({
      where: { userId: session.user.id },
      orderBy: { learnedAt: 'asc' },
    }),
    prisma.practiceSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  return NextResponse.json({
    learnedChords: learnedChords.map(c => ({
      chordName: c.chordName,
      learnedAt: c.learnedAt.toISOString(),
      accuracy: c.accuracy,
    })),
    recentSessions: recentSessions.map(s => ({
      id: s.id,
      mode: s.mode,
      score: s.score,
      chordsPlayed: JSON.parse(s.chordsPlayed),
      createdAt: s.createdAt.toISOString(),
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { type, data } = body

  if (type === 'learnChord') {
    const { chordName, accuracy } = data
    await prisma.learnedChord.upsert({
      where: { userId_chordName: { userId: session.user.id, chordName } },
      create: { userId: session.user.id, chordName, accuracy: accuracy ?? 0 },
      update: { accuracy: accuracy ?? 0, learnedAt: new Date() },
    })
    return NextResponse.json({ success: true })
  }

  if (type === 'practiceSession') {
    const { mode, chordsPlayed, score } = data
    const practiceSession = await prisma.practiceSession.create({
      data: {
        userId: session.user.id,
        mode,
        chordsPlayed: JSON.stringify(chordsPlayed),
        score,
      },
    })
    return NextResponse.json({ id: practiceSession.id })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
