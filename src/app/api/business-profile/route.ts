import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ensureAppUser } from '@/lib/current-user'
import { prisma } from '@/lib/prisma'

type BusinessProfileBody = {
  accountId?: string
  businessName?: string
  offer?: string
  targetAudience?: string
  country?: string
  language?: string
  averageTicket?: number | string
  marginPercent?: number | string
  monthlyGoal?: number | string
  mainObjective?: string
  brandTone?: string
  websiteUrl?: string
  notes?: string
}

function parseNumber(value: number | string | undefined) {
  if (value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

async function getAdAccount(userId: string, accountId?: string | null) {
  return prisma.adAccount.findFirst({
    where: {
      userId,
      ...(accountId ? { accountId } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  })
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
  const account = await getAdAccount(userId, searchParams.get('accountId'))

  if (!account) {
    return NextResponse.json({ success: true, profile: null, account: null })
  }

  const profile = await prisma.businessProfile.findFirst({
    where: {
      userId,
      adAccountId: account.id,
    },
  })

  return NextResponse.json({
    success: true,
    profile,
    account: {
      accountId: account.accountId,
      accountName: account.accountName,
      currency: account.currency,
    },
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

  const user = await ensureAppUser(userId)
  const body = (await req.json()) as BusinessProfileBody
  const account = await getAdAccount(user.id, body.accountId)

  if (!account) {
    return NextResponse.json(
      { success: false, error: 'Conta de anuncio nao encontrada' },
      { status: 404 }
    )
  }

  const businessName =
    body.businessName?.trim() || account.accountName || 'Meu negocio'
  const profile = await prisma.businessProfile.upsert({
    where: {
      userId_adAccountId: {
        userId: user.id,
        adAccountId: account.id,
      },
    },
    update: {
      businessName,
      offer: body.offer?.trim() || null,
      targetAudience: body.targetAudience?.trim() || null,
      country: body.country?.trim() || null,
      language: body.language?.trim() || 'pt-BR',
      averageTicket: parseNumber(body.averageTicket),
      marginPercent: parseNumber(body.marginPercent),
      monthlyGoal: parseNumber(body.monthlyGoal),
      mainObjective: body.mainObjective?.trim() || null,
      brandTone: body.brandTone?.trim() || null,
      websiteUrl: body.websiteUrl?.trim() || null,
      notes: body.notes?.trim() || null,
      aiContext: {
        businessName,
        offer: body.offer || '',
        targetAudience: body.targetAudience || '',
        mainObjective: body.mainObjective || '',
        brandTone: body.brandTone || '',
      },
    },
    create: {
      userId: user.id,
      clientId: account.clientId,
      adAccountId: account.id,
      businessName,
      offer: body.offer?.trim() || null,
      targetAudience: body.targetAudience?.trim() || null,
      country: body.country?.trim() || null,
      language: body.language?.trim() || 'pt-BR',
      averageTicket: parseNumber(body.averageTicket),
      marginPercent: parseNumber(body.marginPercent),
      monthlyGoal: parseNumber(body.monthlyGoal),
      mainObjective: body.mainObjective?.trim() || null,
      brandTone: body.brandTone?.trim() || null,
      websiteUrl: body.websiteUrl?.trim() || null,
      notes: body.notes?.trim() || null,
      aiContext: {
        businessName,
        offer: body.offer || '',
        targetAudience: body.targetAudience || '',
        mainObjective: body.mainObjective || '',
        brandTone: body.brandTone || '',
      },
    },
  })

  return NextResponse.json({ success: true, profile })
}
