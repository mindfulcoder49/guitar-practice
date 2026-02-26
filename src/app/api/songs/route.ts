import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [learnedSongs, recentSessions] = await Promise.all([
    prisma.learnedSong.findMany({
      where: { userId: session.user.id },
      orderBy: { learnedAt: 'asc' },
    }),
    prisma.songSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  return NextResponse.json({ learnedSongs, recentSessions })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { type, data } = body

  if (type === 'learnSong') {
    const { songId, accuracy } = data
    const result = await prisma.learnedSong.upsert({
      where: { userId_songId: { userId: session.user.id, songId } },
      create: { userId: session.user.id, songId, accuracy: accuracy ?? 0 },
      update: { accuracy: accuracy ?? 0, learnedAt: new Date() },
    })
    return NextResponse.json(result)
  }

  if (type === 'songSession') {
    const { songId, score, hits, misses } = data
    const result = await prisma.songSession.create({
      data: {
        userId: session.user.id,
        songId,
        score: score ?? 0,
        hits: hits ?? 0,
        misses: misses ?? 0,
      },
    })
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
