import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ensureAppUser } from '@/lib/current-user'
import { prisma } from '@/lib/prisma'

type SaleBody = {
  id?: string
  adAccountId?: string
  provider?: string
  externalId?: string
  status?: string
  amount?: number
  currency?: string
  customerEmail?: string
  customerName?: string
  productName?: string
  campaignName?: string
  source?: string
  paidAt?: string
  action?: 'create' | 'delete'
}

function parseDate(value?: string) {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function parseDateParam(value: string | null) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export async function GET(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId')
  const dateFrom = parseDateParam(searchParams.get('dateFrom'))
  const dateTo = parseDateParam(searchParams.get('dateTo'))
  const account = accountId
    ? await prisma.adAccount.findFirst({ where: { userId, accountId } })
    : null

  const sales = await prisma.realSale.findMany({
    where: {
      userId,
      ...(accountId ? { adAccountId: account?.id || '__none__' } : {}),
      ...(dateFrom || dateTo
        ? {
            paidAt: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lt: addDays(dateTo, 1) } : {}),
            },
          }
        : {}),
    },
    orderBy: { paidAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ success: true, sales })
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const user = await ensureAppUser(userId)
  const body = (await req.json()) as SaleBody

  if (body.action === 'delete' && body.id) {
    await prisma.realSale.deleteMany({ where: { id: body.id, userId: user.id } })
    return NextResponse.json({ success: true })
  }

  const adAccount = body.adAccountId
    ? await prisma.adAccount.findFirst({
        where: { userId: user.id, accountId: body.adAccountId },
      })
    : null

  const sale = await prisma.realSale.create({
    data: {
      userId: user.id,
      adAccountId: adAccount?.id || null,
      clientId: adAccount?.clientId || null,
      provider: body.provider || 'manual',
      externalId: body.externalId || null,
      status: body.status || 'paid',
      amount: Number(body.amount || 0),
      currency: (body.currency || adAccount?.currency || 'EUR').toUpperCase(),
      customerEmail: body.customerEmail || null,
      customerName: body.customerName || null,
      productName: body.productName || null,
      campaignName: body.campaignName || null,
      source: body.source || null,
      paidAt: parseDate(body.paidAt),
      rawData: body,
    },
  })

  return NextResponse.json({ success: true, sale })
}
