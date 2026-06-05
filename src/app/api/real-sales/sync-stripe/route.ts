import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ensureAppUser } from '@/lib/current-user'
import { prisma } from '@/lib/prisma'
import { listStripeCharges } from '@/lib/stripe-http'

type SyncBody = {
  accountId?: string
  since?: string
}

function unixFromDate(value?: string) {
  if (!value) return Math.floor(Date.now() / 1000) - 90 * 86400
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime())
    ? Math.floor(Date.now() / 1000) - 90 * 86400
    : Math.floor(date.getTime() / 1000)
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const body = (await req.json()) as SyncBody
  const user = await ensureAppUser(userId)
  const adAccount = body.accountId
    ? await prisma.adAccount.findFirst({
        where: { userId: user.id, accountId: body.accountId },
      })
    : await prisma.adAccount.findFirst({
        where: { userId: user.id, windsorConnected: true },
        orderBy: { updatedAt: 'desc' },
      })

  const charges = await listStripeCharges({
    createdGte: unixFromDate(body.since),
    limit: 100,
  })
  let saved = 0

  for (const charge of charges) {
    await prisma.realSale.upsert({
      where: {
        provider_externalId: {
          provider: 'stripe',
          externalId: charge.id,
        },
      },
      update: {
        status: charge.paid && charge.status === 'succeeded' ? 'paid' : charge.status || 'failed',
        amount: charge.amount / 100,
        currency: charge.currency.toUpperCase(),
        customerEmail: charge.billing_details?.email || null,
        customerName: charge.billing_details?.name || null,
        productName: charge.description || null,
        paidAt: new Date(charge.created * 1000),
        rawData: charge,
      },
      create: {
        userId: user.id,
        adAccountId: adAccount?.id || null,
        clientId: adAccount?.clientId || null,
        provider: 'stripe',
        externalId: charge.id,
        status: charge.paid && charge.status === 'succeeded' ? 'paid' : charge.status || 'failed',
        amount: charge.amount / 100,
        currency: charge.currency.toUpperCase(),
        customerEmail: charge.billing_details?.email || null,
        customerName: charge.billing_details?.name || null,
        productName: charge.description || null,
        source: 'stripe',
        paidAt: new Date(charge.created * 1000),
        rawData: charge,
      },
    })
    saved += 1
  }

  return NextResponse.json({
    success: true,
    rowsFetched: charges.length,
    rowsSaved: saved,
  })
}
