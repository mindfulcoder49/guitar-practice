import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.catalogItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, type, data } = await req.json()

  const item = await prisma.catalogItem.create({
    data: {
      userId: session.user.id,
      name,
      type,
      data,
    },
  })

  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  // Verify ownership
  const item = await prisma.catalogItem.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.catalogItem.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
