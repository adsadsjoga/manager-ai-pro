import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchFacebookAdAccounts } from '@/services/windsor-service'

type AccountBody = {
  id?: string
  accountId?: string
  accountName?: string
  currency?: string
  timezone?: string
  action?: 'create' | 'update' | 'disconnect' | 'discover'
}

const SUPPORTED_CURRENCIES = ['EUR', 'BRL', 'USD', 'GBP']

async function ensureUser(userId: string) {
  const clerkUser = await currentUser()
  const email =
    clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@clerk.local`

  return prisma.user.upsert({
    where: { email },
    update: {
      name: clerkUser?.fullName || clerkUser?.firstName || 'Usuario',
      avatarUrl: clerkUser?.imageUrl || null,
    },
    create: {
      id: userId,
      email,
      name: clerkUser?.fullName || clerkUser?.firstName || 'Usuario',
      avatarUrl: clerkUser?.imageUrl || null,
    },
  })
}

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const accounts = await prisma.adAccount.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      platform: true,
      accountId: true,
      accountName: true,
      currency: true,
      timezone: true,
      windsorConnected: true,
      syncStatus: true,
      lastSyncAt: true,
      createdAt: true,
    },
  })
  const uniqueAccounts = Array.from(
    new Map(
      accounts.map((account) => [
        `${account.platform}-${account.accountId}`,
        account,
      ])
    ).values()
  )

  return NextResponse.json({
    success: true,
    accounts: uniqueAccounts,
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

  const body = (await req.json()) as AccountBody
  const user = await ensureUser(userId)
  const currency = (body.currency || 'EUR').toUpperCase()

  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    return NextResponse.json(
      { success: false, error: 'Moeda nao suportada' },
      { status: 400 }
    )
  }

  if (body.action === 'discover') {
    const discoveredAccounts = await fetchFacebookAdAccounts()
    const accounts = []

    for (const discovered of discoveredAccounts) {
      const account = await prisma.adAccount.upsert({
        where: {
          userId_platform_accountId: {
            userId: user.id,
            platform: 'facebook',
            accountId: discovered.accountId,
          },
        },
        update: {
          accountName: discovered.accountName,
          windsorConnected: true,
          syncStatus: 'discovered',
        },
        create: {
          userId: user.id,
          platform: 'facebook',
          accountId: discovered.accountId,
          accountName: discovered.accountName,
          currency,
          timezone: body.timezone || 'Europe/Lisbon',
          windsorConnected: true,
          syncStatus: 'discovered',
        },
      })

      accounts.push(account)
    }

    return NextResponse.json({
      success: true,
      accounts,
    })
  }

  if (body.action === 'disconnect' && body.id) {
    const account = await prisma.adAccount.updateMany({
      where: { id: body.id, userId: user.id },
      data: {
        windsorConnected: false,
        syncStatus: 'disconnected',
      },
    })

    return NextResponse.json({ success: true, account })
  }

  if (body.action === 'update' && body.id) {
    const account = await prisma.adAccount.update({
      where: { id: body.id },
      data: {
        ...(body.accountName ? { accountName: body.accountName } : {}),
        currency,
        timezone: body.timezone || 'Europe/Lisbon',
      },
    })

    return NextResponse.json({ success: true, account })
  }

  if (!body.accountId) {
    return NextResponse.json(
      { success: false, error: 'Account ID obrigatorio' },
      { status: 400 }
    )
  }

  const account = await prisma.adAccount.upsert({
    where: {
      userId_platform_accountId: {
        userId: user.id,
        platform: 'facebook',
        accountId: body.accountId,
      },
    },
    update: {
      accountName: body.accountName || body.accountId,
      currency,
      timezone: body.timezone || 'Europe/Lisbon',
      windsorConnected: true,
      syncStatus: 'pending',
    },
    create: {
      userId: user.id,
      platform: 'facebook',
      accountId: body.accountId,
      accountName: body.accountName || body.accountId,
      currency,
      timezone: body.timezone || 'Europe/Lisbon',
      windsorConnected: true,
      syncStatus: 'pending',
    },
  })

  return NextResponse.json({
    success: true,
    account,
  })
}
