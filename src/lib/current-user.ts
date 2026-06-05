import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function ensureAppUser(userId: string) {
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
