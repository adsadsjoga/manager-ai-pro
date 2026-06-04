import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type PatchBody = {
  action?: 'mark-read' | 'mark-all-read' | 'resolve' | 'resolve-all'
  id?: string
}

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const alerts = await prisma.alert.findMany({
    where: {
      adAccount: {
        userId,
      },
      isResolved: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return NextResponse.json({
    success: true,
    alerts,
  })
}

export async function PATCH(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const body = (await req.json()) as PatchBody

  if (body.action === 'mark-all-read') {
    await prisma.alert.updateMany({
      where: {
        adAccount: {
          userId,
        },
        isResolved: false,
      },
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({ success: true })
  }

  if (body.action === 'resolve-all') {
    await prisma.alert.updateMany({
      where: {
        adAccount: {
          userId,
        },
        isResolved: false,
      },
      data: {
        isRead: true,
        isResolved: true,
        resolvedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  }

  if (body.action === 'mark-read' && body.id) {
    await prisma.alert.updateMany({
      where: {
        id: body.id,
        adAccount: {
          userId,
        },
      },
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({ success: true })
  }

  if (body.action === 'resolve' && body.id) {
    await prisma.alert.updateMany({
      where: {
        id: body.id,
        adAccount: {
          userId,
        },
      },
      data: {
        isRead: true,
        isResolved: true,
        resolvedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json(
    { success: false, error: 'Acao invalida' },
    { status: 400 }
  )
}
