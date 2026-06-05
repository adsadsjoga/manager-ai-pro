import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { resolveFacebookAccountName } from '@/lib/facebook-accounts'
import { isWithinLimit, planFor } from '@/lib/plans'
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

async function listAdAccounts(userId: string) {
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

  return Array.from(
    new Map(
      accounts.map((account) => {
        const normalizedAccount = {
          ...account,
          accountName: resolveFacebookAccountName(
            account.accountId,
            account.accountName,
            account.accountName
          ),
        }

        return [`${account.platform}-${account.accountId}`, normalizedAccount]
      })
    ).values()
  )
}

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

  return NextResponse.json({
    success: true,
    accounts: await listAdAccounts(userId),
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
    const plan = planFor(user.plan)
    const currentAccounts = await prisma.adAccount.count({
      where: { userId: user.id, windsorConnected: true },
    })
    let availableSlots =
      plan.limits.accounts === -1
        ? Number.POSITIVE_INFINITY
        : Math.max(plan.limits.accounts - currentAccounts, 0)

    for (const discovered of discoveredAccounts) {
      const existingAccount = await prisma.adAccount.findUnique({
        where: {
          userId_platform_accountId: {
            userId: user.id,
            platform: 'facebook',
            accountId: discovered.accountId,
          },
        },
        select: {
          syncStatus: true,
          accountName: true,
        },
      })

      if (!existingAccount && availableSlots <= 0) {
        continue
      }

      const accountName = resolveFacebookAccountName(
        discovered.accountId,
        discovered.accountName,
        existingAccount?.accountName
      )

      await prisma.adAccount.upsert({
        where: {
          userId_platform_accountId: {
            userId: user.id,
            platform: 'facebook',
            accountId: discovered.accountId,
          },
        },
        update: {
          accountName,
          windsorConnected: true,
          syncStatus:
            existingAccount?.syncStatus === 'success'
              ? 'success'
              : 'discovered',
        },
        create: {
          userId: user.id,
          platform: 'facebook',
          accountId: discovered.accountId,
          accountName,
          currency,
          timezone: body.timezone || 'Europe/Lisbon',
          windsorConnected: true,
          syncStatus: 'discovered',
        },
      })

      if (!existingAccount && Number.isFinite(availableSlots)) {
        availableSlots -= 1
      }

    }

    return NextResponse.json({
      success: true,
      accounts: await listAdAccounts(user.id),
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

  const accountName = resolveFacebookAccountName(
    body.accountId,
    body.accountName,
    body.accountName
  )

  const existingAccount = await prisma.adAccount.findUnique({
    where: {
      userId_platform_accountId: {
        userId: user.id,
        platform: 'facebook',
        accountId: body.accountId,
      },
    },
  })

  if (!existingAccount) {
    const plan = planFor(user.plan)
    const currentAccounts = await prisma.adAccount.count({
      where: { userId: user.id, windsorConnected: true },
    })

    if (!isWithinLimit(plan.limits.accounts, currentAccounts)) {
      return NextResponse.json(
        {
          success: false,
          error: `Seu plano ${plan.name} permite ${plan.limits.accounts} conta(s). Faça upgrade para adicionar mais.`,
          upgradeRequired: true,
        },
        { status: 403 }
      )
    }
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
      accountName,
      currency,
      timezone: body.timezone || 'Europe/Lisbon',
      windsorConnected: true,
      syncStatus: 'pending',
    },
    create: {
      userId: user.id,
      platform: 'facebook',
      accountId: body.accountId,
      accountName,
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
