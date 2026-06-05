import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchMetaAdsForAccount } from '@/services/meta-service'

type MetaAdsBody = {
  accountId?: string
}

async function getSelectedAccount(userId: string, accountId?: string | null) {
  return prisma.adAccount.findFirst({
    where: {
      userId,
      windsorConnected: true,
      ...(accountId ? { accountId } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Usuario nao autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const account = await getSelectedAccount(userId, searchParams.get('accountId'))

    if (!account) {
      return NextResponse.json({
        success: true,
        account: null,
        ads: [],
        metaConfigured: Boolean(process.env.META_ACCESS_TOKEN),
      })
    }

    const ads = await prisma.metaAd.findMany({
      where: { adAccountId: account.id },
      orderBy: [{ effectiveStatus: 'asc' }, { updatedAt: 'desc' }],
    })

    return NextResponse.json({
      success: true,
      metaConfigured: Boolean(process.env.META_ACCESS_TOKEN),
      account: {
        accountId: account.accountId,
        accountName: account.accountName,
      },
      ads,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado'

    return NextResponse.json(
      {
        success: false,
        error: message.includes('MetaAd')
          ? 'Tabela de criativos ainda nao foi criada no banco. Aplique a migracao MetaAd.'
          : message,
        metaConfigured: Boolean(process.env.META_ACCESS_TOKEN),
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Usuario nao autenticado' },
        { status: 401 }
      )
    }

    const body = (await req.json()) as MetaAdsBody
    const account = await getSelectedAccount(userId, body.accountId)

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Conta de anuncio nao encontrada' },
        { status: 404 }
      )
    }

    const metaAds = await fetchMetaAdsForAccount(account.accountId)
    const savedAds = []

    for (const ad of metaAds) {
      const saved = await prisma.metaAd.upsert({
      where: {
        adAccountId_metaAdId: {
          adAccountId: account.id,
          metaAdId: ad.metaAdId,
        },
      },
      update: {
        campaignId: ad.campaignId || null,
        campaignName: ad.campaignName || null,
        adsetId: ad.adsetId || null,
        adsetName: ad.adsetName || null,
        adName: ad.adName || null,
        status: ad.status || null,
        effectiveStatus: ad.effectiveStatus || null,
        creativeId: ad.creativeId || null,
        creativeName: ad.creativeName || null,
        primaryText: ad.primaryText || null,
        headline: ad.headline || null,
        description: ad.description || null,
        callToAction: ad.callToAction || null,
        imageUrl: ad.imageUrl || null,
        videoId: ad.videoId || null,
        permalinkUrl: ad.permalinkUrl || null,
        thumbnailUrl: ad.thumbnailUrl || null,
        videoMetrics: ad.videoMetrics,
        rawData: ad.rawData,
        lastFetchedAt: new Date(),
      },
      create: {
        adAccountId: account.id,
        metaAdId: ad.metaAdId,
        campaignId: ad.campaignId || null,
        campaignName: ad.campaignName || null,
        adsetId: ad.adsetId || null,
        adsetName: ad.adsetName || null,
        adName: ad.adName || null,
        status: ad.status || null,
        effectiveStatus: ad.effectiveStatus || null,
        creativeId: ad.creativeId || null,
        creativeName: ad.creativeName || null,
        primaryText: ad.primaryText || null,
        headline: ad.headline || null,
        description: ad.description || null,
        callToAction: ad.callToAction || null,
        imageUrl: ad.imageUrl || null,
        videoId: ad.videoId || null,
        permalinkUrl: ad.permalinkUrl || null,
        thumbnailUrl: ad.thumbnailUrl || null,
        videoMetrics: ad.videoMetrics,
        rawData: ad.rawData,
      },
    })

      savedAds.push(saved)
    }

    return NextResponse.json({
      success: true,
      account: {
        accountId: account.accountId,
        accountName: account.accountName,
      },
      rowsFetched: metaAds.length,
      ads: savedAds,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado'

    return NextResponse.json(
      {
        success: false,
        error: message.includes('MetaAd')
          ? 'Tabela de criativos ainda nao foi criada no banco. Aplique a migracao MetaAd.'
          : message,
        metaConfigured: Boolean(process.env.META_ACCESS_TOKEN),
      },
      { status: 500 }
    )
  }
}
