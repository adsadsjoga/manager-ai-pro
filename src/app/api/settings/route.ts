import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SUPPORTED_CURRENCIES = ['EUR', 'BRL', 'USD', 'GBP'] as const
type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

type SettingsBody = {
  currency?: string
  accountName?: string
  timezone?: string
}

function isSupportedCurrency(value: string): value is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(value as SupportedCurrency)
}

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const adAccount = await prisma.adAccount.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      accountId: true,
      accountName: true,
      currency: true,
      timezone: true,
    },
  })

  return NextResponse.json({
    success: true,
    settings: {
      accountId: adAccount?.accountId || process.env.WINDSOR_ACCOUNT_ID || '',
      accountName: adAccount?.accountName || 'Guia do Volante',
      currency: adAccount?.currency || 'EUR',
      timezone: adAccount?.timezone || 'Europe/Lisbon',
      integrations: {
        windsorConfigured: Boolean(process.env.WINDSOR_API_KEY),
        anthropicConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
        metaConfigured: Boolean(process.env.META_ACCESS_TOKEN),
      },
    },
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

  const body = (await req.json()) as SettingsBody
  const currency = body.currency?.toUpperCase()

  if (currency && !isSupportedCurrency(currency)) {
    return NextResponse.json(
      { success: false, error: 'Moeda nao suportada' },
      { status: 400 }
    )
  }

  const adAccount = await prisma.adAccount.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  })

  if (!adAccount) {
    return NextResponse.json(
      { success: false, error: 'Nenhuma conta de anuncios encontrada' },
      { status: 404 }
    )
  }

  const updated = await prisma.adAccount.update({
    where: { id: adAccount.id },
    data: {
      ...(body.accountName ? { accountName: body.accountName } : {}),
      ...(currency ? { currency } : {}),
      ...(body.timezone ? { timezone: body.timezone } : {}),
    },
    select: {
      accountId: true,
      accountName: true,
      currency: true,
      timezone: true,
    },
  })

  return NextResponse.json({
    success: true,
    settings: updated,
  })
}
