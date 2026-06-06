import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { fetchMetaAdAccounts, hasMetaAccessToken } from '@/services/meta-service'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  if (!hasMetaAccessToken()) {
    return NextResponse.json(
      { success: false, error: 'META_ACCESS_TOKEN nao configurado no servidor' },
      { status: 400 }
    )
  }

  try {
    const accounts = await fetchMetaAdAccounts()

    return NextResponse.json({
      success: true,
      accounts,
      total: accounts.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao verificar token Meta',
      },
      { status: 500 }
    )
  }
}
