import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ensureAppUser } from '@/lib/current-user'
import { isWithinLimit, planFor } from '@/lib/plans'
import { prisma } from '@/lib/prisma'

type ClientBody = {
  id?: string
  name?: string
  email?: string
  phone?: string
  company?: string
  notes?: string
  adAccountIds?: string[]
  action?: 'create' | 'update' | 'delete'
}

function cleanAccountIds(ids?: string[]) {
  return Array.from(new Set((ids || []).filter(Boolean)))
}

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const [clients, adAccounts, user] = await Promise.all([
    prisma.client.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        adAccounts: {
          select: {
            id: true,
            accountId: true,
            accountName: true,
            platform: true,
            currency: true,
          },
        },
      },
    }),
    prisma.adAccount.findMany({
      where: { userId, windsorConnected: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        accountId: true,
        accountName: true,
        platform: true,
        currency: true,
        clientId: true,
      },
    }),
    ensureAppUser(userId),
  ])

  return NextResponse.json({
    success: true,
    clients,
    adAccounts,
    plan: planFor(user.plan),
  })
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const body = (await req.json()) as ClientBody
  const user = await ensureAppUser(userId)

  if (body.action === 'delete' && body.id) {
    await prisma.adAccount.updateMany({
      where: { userId: user.id, clientId: body.id },
      data: { clientId: null },
    })
    await prisma.client.deleteMany({ where: { id: body.id, userId: user.id } })

    return NextResponse.json({ success: true })
  }

  if (body.action === 'update' && body.id) {
    const accountIds = cleanAccountIds(body.adAccountIds)
    const client = await prisma.client.update({
      where: { id: body.id },
      data: {
        ...(body.name !== undefined ? { name: body.name || 'Cliente' } : {}),
        ...(body.email !== undefined ? { email: body.email || null } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.company !== undefined ? { company: body.company || null } : {}),
        ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
        adAccounts: {
          set: [],
          connect: accountIds.map((id) => ({ id })),
        },
      },
      include: { adAccounts: true },
    })

    await prisma.adAccount.updateMany({
      where: {
        userId: user.id,
        clientId: body.id,
        id: { notIn: accountIds },
      },
      data: { clientId: null },
    })

    return NextResponse.json({ success: true, client })
  }

  const plan = planFor(user.plan)
  const currentClients = await prisma.client.count({ where: { userId: user.id } })

  if (!isWithinLimit(plan.limits.clients, currentClients)) {
    return NextResponse.json(
      {
        success: false,
        error:
          plan.limits.clients === 0
            ? `Seu plano ${plan.name} nao inclui area de clientes. Faca upgrade para vender como SaaS.`
            : `Seu plano ${plan.name} permite ${plan.limits.clients} cliente(s).`,
        upgradeRequired: true,
      },
      { status: 403 }
    )
  }

  const client = await prisma.client.create({
    data: {
      userId: user.id,
      name: body.name || 'Novo cliente',
      email: body.email || null,
      phone: body.phone || null,
      company: body.company || null,
      notes: body.notes || null,
      adAccounts: {
        connect: cleanAccountIds(body.adAccountIds).map((id) => ({ id })),
      },
    },
    include: { adAccounts: true },
  })

  return NextResponse.json({ success: true, client })
}
