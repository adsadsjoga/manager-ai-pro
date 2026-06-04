import { NextResponse } from 'next/server'
import { runAlertAutomationForAccount } from '@/lib/alert-automation'
import { prisma } from '@/lib/prisma'
import {
  fetchFacebookAdsData,
  toNumber,
  WEBSITE_PURCHASE_ACTION_TYPE,
  type WindsorAction,
  type WindsorRow,
} from '@/services/windsor-service'

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

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date
}

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const authHeader = req.headers.get('authorization')
  const { searchParams } = new URL(req.url)

  return authHeader === `Bearer ${secret}` || searchParams.get('secret') === secret
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: 'Cron nao autorizado' },
      { status: 401 }
    )
  }

  const today = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setUTCDate(today.getUTCDate() - 7)

  const dateFrom = dateOnly(sevenDaysAgo)
  const dateTo = dateOnly(today)

  const adAccounts = await prisma.adAccount.findMany({
    where: {
      windsorConnected: true,
    },
    select: {
      id: true,
      userId: true,
      accountId: true,
    },
  })

  const results = []

  for (const adAccount of adAccounts) {
    const rows = await fetchFacebookAdsData({
      dateFrom,
      dateTo,
      accountId: adAccount.accountId,
    })

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
      const revenue = getActionValue(row.action_values, WEBSITE_PURCHASE_ACTION_TYPE)
      const roas = spend > 0 ? revenue / spend : 0
      const leads = Math.round(getActionValue(row.actions, 'lead'))
      const addToCart = Math.round(getActionValue(row.actions, 'add_to_cart'))
      const initiateCheckout = Math.round(
        getActionValue(row.actions, 'initiate_checkout')
      )
      const viewContent = Math.round(getActionValue(row.actions, 'view_content'))

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

    const alertAutomation = await runAlertAutomationForAccount({
      userId: adAccount.userId,
      adAccountId: adAccount.id,
      lookbackDays: 7,
    })

    results.push({
      accountId: adAccount.accountId,
      rowsFetched: rows.length,
      rowsInserted: inserted,
      alertAutomation,
    })
  }

  return NextResponse.json({
    success: true,
    dateFrom,
    dateTo,
    rowsFetched: results.reduce((acc, item) => acc + item.rowsFetched, 0),
    accountsProcessed: results.length,
    results,
  })
}
