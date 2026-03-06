import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getOpenAI, buildSystemPrompt } from '@/lib/openai'

type ChatModel = 'gpt-5-mini' | 'gpt-5'
const DEFAULT_MODEL: ChatModel = 'gpt-5-mini'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const messages = Array.isArray(body?.messages) ? body.messages : []
  const requestedModel = body?.model
  const model: ChatModel =
    requestedModel === 'gpt-5' || requestedModel === 'gpt-5-mini'
      ? requestedModel
      : DEFAULT_MODEL

  // Get user's learned chords and songs
  const [learnedChords, learnedSongs] = await Promise.all([
    prisma.learnedChord.findMany({
      where: { userId: session.user.id },
      select: { chordName: true },
    }),
    prisma.learnedSong.findMany({
      where: { userId: session.user.id },
      select: { songId: true },
    }),
  ])
  const chordNames = learnedChords.map(c => c.chordName)
  const songIds = learnedSongs.map(s => s.songId)

  const systemPrompt = buildSystemPrompt(chordNames, songIds)

  const stream = await getOpenAI().chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    stream: true,
    max_tokens: 1000,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ''
        if (text) {
          controller.enqueue(encoder.encode(text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
