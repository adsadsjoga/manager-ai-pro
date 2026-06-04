import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  fetchFacebookAdsData,
  toNumber,
  WEBSITE_PURCHASE_ACTION_TYPE,
  type WindsorAction,
  type WindsorRow,
} from '@/services/windsor-service'

const ACCOUNT_ID = process.env.WINDSOR_ACCOUNT_ID || '1326058508860197'
const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || 'EUR'

function getActionValue(actions: WindsorAction[] | undefined, actionType: string): number {
  if (!Array.isArray(actions)) return 0

  const action = actions.find((item) => item.action_type === actionType)

  return action ? toNumber(action.value) : 0
}

function getPurchaseActionAudit(actions: WindsorAction[] | undefined) {
  if (!Array.isArray(actions)) return []

  return actions
    .filter((item) => /purchase/i.test(item.action_type))
    .map((item) => ({
      actionType: item.action_type,
      value: toNumber(item.value),
    }))
}

function parseDateParam(value: string | null) {
  if (!value) return null

  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : value
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date
}

export async function GET(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuário não autenticado' },
      { status: 401 }
    )
  }

  const clerkUser = await currentUser()

  const email =
    clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@clerk.local`

  const name = clerkUser?.fullName || clerkUser?.firstName || 'Usuário'

  const today = new Date().toISOString().split('T')[0]
  const defaultDateFrom = '2025-01-01'
  const { searchParams } = new URL(req.url)
  const dateFrom = parseDateParam(searchParams.get('dateFrom')) || defaultDateFrom
  const dateTo = parseDateParam(searchParams.get('dateTo')) || today

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        avatarUrl: clerkUser?.imageUrl || null,
      },
      create: {
        id: userId,
        email,
        name,
        avatarUrl: clerkUser?.imageUrl || null,
      },
    })

    let adAccount = await prisma.adAccount.upsert({
      where: {
        userId_platform_accountId: {
          userId: user.id,
          platform: 'facebook',
          accountId: ACCOUNT_ID,
        },
      },
      update: {
        accountName: 'Guia do Volante',
        windsorConnected: true,
        syncStatus: 'syncing',
      },
      create: {
        userId: user.id,
        platform: 'facebook',
        accountId: ACCOUNT_ID,
        accountName: 'Guia do Volante',
        currency: DEFAULT_CURRENCY,
        windsorConnected: true,
        syncStatus: 'syncing',
      },
    })

    if (adAccount.currency === 'BRL') {
      adAccount = await prisma.adAccount.update({
        where: { id: adAccount.id },
        data: { currency: DEFAULT_CURRENCY },
      })
    }

    const syncLog = await prisma.syncLog.create({
      data: {
        adAccountId: adAccount.id,
        syncType: 'windsor-facebook',
        status: 'running',
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
      },
    })

    const rows = await fetchFacebookAdsData({ dateFrom, dateTo })

    if (rows.length === 0) {
      await prisma.adAccount.update({
        where: { id: adAccount.id },
        data: {
          lastSyncAt: new Date(),
          syncStatus: 'success',
          syncError: null,
        },
      })

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'success',
          finishedAt: new Date(),
          rowsFetched: 0,
          rowsUpserted: 0,
        },
      })

      return NextResponse.json({
        success: true,
        userId: user.id,
        email: user.email,
        dateFrom,
        dateTo,
        rowsFetched: 0,
        rowsInserted: 0,
        warning:
          'A Windsor nao retornou linhas para este periodo. Os dados existentes foram preservados.',
      })
    }

    await prisma.dailyMetric.deleteMany({
      where: {
        adAccountId: adAccount.id,
        date: {
          gte: new Date(`${dateFrom}T00:00:00.000Z`),
          lt: addDays(dateTo, 1),
        },
      },
    })

    let inserted = 0

    for (const row of rows as WindsorRow[]) {
      const spend = toNumber(row.spend)

      const purchases = Math.round(
        getActionValue(row.actions, WEBSITE_PURCHASE_ACTION_TYPE)
      )

      const revenue = getActionValue(
        row.action_values,
        WEBSITE_PURCHASE_ACTION_TYPE
      )

      const roas = spend > 0 ? revenue / spend : 0

      const leads = Math.round(getActionValue(row.actions, 'lead'))
      const addToCart = Math.round(getActionValue(row.actions, 'add_to_cart'))
      const initiateCheckout = Math.round(
        getActionValue(row.actions, 'initiate_checkout')
      )
      const viewContent = Math.round(
        getActionValue(row.actions, 'view_content')
      )

      await prisma.dailyMetric.create({
        data: {
          adAccountId: adAccount.id,
          date: new Date(row.date),
          campaignId: row.campaign_id || null,
          campaignName: row.campaign_name || row.campaign || null,
          adsetId: row.adset_id || null,
          adsetName: row.adset_name || null,
          adId: row.ad_id || null,
          adName: row.ad_name || null,
          platform: row.platform || row.source || null,
          placement: row.placement || null,
          objective: row.objective || null,

          impressions: Math.round(toNumber(row.impressions)),
          reach: Math.round(toNumber(row.reach)),
          frequency: toNumber(row.frequency),
          clicks: Math.round(toNumber(row.clicks)),
          ctr: toNumber(row.ctr),
          cpc: toNumber(row.cpc),
          cpm: toNumber(row.cpm),
          spend,

          leads,
          purchases,
          revenue,
          roas,

          rawData: {
            ...row,
            addToCart,
            initiateCheckout,
            viewContent,
            purchases,
            leads,
            revenue,
            roas,
            purchaseActionAudit: getPurchaseActionAudit(row.actions),
            purchaseSource: WEBSITE_PURCHASE_ACTION_TYPE,
          },
        },
      })

      inserted++
    }

    await prisma.adAccount.update({
      where: { id: adAccount.id },
      data: {
        lastSyncAt: new Date(),
        syncStatus: 'success',
        syncError: null,
      },
    })

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'success',
        finishedAt: new Date(),
        rowsFetched: rows.length,
        rowsUpserted: inserted,
      },
    })

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      dateFrom,
      dateTo,
      rowsFetched: rows.length,
      rowsInserted: inserted,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado'

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}
