import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type LeadBody = {
  id?: string
  name?: string
  email?: string
  phone?: string
  company?: string
  stage?: string
  estimatedValue?: number
  sourceCampaignName?: string
  sourcePlatform?: string
  notes?: string
  action?: 'create' | 'update' | 'delete'
}

const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']

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

  const leads = await prisma.lead.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ success: true, leads })
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const body = (await req.json()) as LeadBody
  const user = await ensureUser(userId)
  const stage = body.stage && STAGES.includes(body.stage) ? body.stage : 'new'

  if (body.action === 'delete' && body.id) {
    await prisma.lead.deleteMany({
      where: { id: body.id, userId: user.id },
    })

    return NextResponse.json({ success: true })
  }

  if (body.action === 'update' && body.id) {
    const lead = await prisma.lead.update({
      where: { id: body.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.company !== undefined ? { company: body.company } : {}),
        ...(body.stage !== undefined ? { stage } : {}),
        ...(body.estimatedValue !== undefined
          ? { estimatedValue: body.estimatedValue }
          : {}),
        ...(body.sourceCampaignName !== undefined
          ? { sourceCampaignName: body.sourceCampaignName }
          : {}),
        ...(body.sourcePlatform !== undefined
          ? { sourcePlatform: body.sourcePlatform }
          : {}),
        ...(body.notes !== undefined ? { extraData: { notes: body.notes } } : {}),
      },
    })

    return NextResponse.json({ success: true, lead })
  }

  const lead = await prisma.lead.create({
    data: {
      userId: user.id,
      name: body.name || 'Novo lead',
      email: body.email || null,
      phone: body.phone || null,
      company: body.company || null,
      stage,
      estimatedValue: body.estimatedValue || 0,
      sourceCampaignName: body.sourceCampaignName || null,
      sourcePlatform: body.sourcePlatform || 'Facebook',
      extraData: {
        notes: body.notes || '',
      },
    },
  })

  return NextResponse.json({ success: true, lead })
}
