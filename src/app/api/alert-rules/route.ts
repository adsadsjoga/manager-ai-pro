import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { DEFAULT_ALERT_RULES } from '@/lib/alert-engine'
import { prisma } from '@/lib/prisma'

type RuleUpdate = {
  id: string
  isActive?: boolean
  threshold?: number
  notifyEmail?: boolean
  cooldownHours?: number
}

type PatchBody = {
  rules?: RuleUpdate[]
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

async function ensureDefaultRules(userId: string, adAccountId?: string) {
  const existingCount = await prisma.alertRule.count({
    where: { userId },
  })

  if (existingCount > 0) return

  await prisma.alertRule.createMany({
    data: DEFAULT_ALERT_RULES.map((rule) => ({
      userId,
      adAccountId,
      name: rule.name,
      metric: rule.metric,
      operator: rule.operator,
      threshold: rule.threshold,
      timeWindow: rule.timeWindow,
      severity: rule.severity,
      notifyEmail: true,
      cooldownHours: rule.cooldownHours,
    })),
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

  const user = await ensureUser(userId)
  const adAccount = await prisma.adAccount.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  })

  await ensureDefaultRules(user.id, adAccount?.id)

  const rules = await prisma.alertRule.findMany({
    where: { userId: user.id },
    orderBy: [{ severity: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json({
    success: true,
    rules,
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

  const body = (await req.json()) as PatchBody

  if (!Array.isArray(body.rules)) {
    return NextResponse.json(
      { success: false, error: 'Nenhuma regra enviada' },
      { status: 400 }
    )
  }

  const user = await ensureUser(userId)

  await prisma.$transaction(
    body.rules.map((rule) =>
      prisma.alertRule.updateMany({
        where: {
          id: rule.id,
          userId: user.id,
        },
        data: {
          ...(typeof rule.isActive === 'boolean' ? { isActive: rule.isActive } : {}),
          ...(typeof rule.threshold === 'number' ? { threshold: rule.threshold } : {}),
          ...(typeof rule.notifyEmail === 'boolean' ? { notifyEmail: rule.notifyEmail } : {}),
          ...(typeof rule.cooldownHours === 'number'
            ? { cooldownHours: rule.cooldownHours }
            : {}),
        },
      })
    )
  )

  const rules = await prisma.alertRule.findMany({
    where: { userId: user.id },
    orderBy: [{ severity: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json({
    success: true,
    rules,
  })
}
