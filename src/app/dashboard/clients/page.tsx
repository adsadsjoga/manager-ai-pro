'use client'

import { useEffect, useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'

type AdAccount = {
  id: string
  accountId: string
  accountName: string | null
  platform: string
  currency: string
  clientId?: string | null
}

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  notes: string | null
  adAccounts: AdAccount[]
}

type ClientsResponse = {
  success: boolean
  clients?: Client[]
  client?: Client
  adAccounts?: AdAccount[]
  error?: string
  upgradeRequired?: boolean
  plan?: {
    name: string
    limits: {
      clients: number
    }
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    notes: '',
    adAccountIds: [] as string[],
  })

  useEffect(() => {
    fetch('/api/clients')
      .then((res) => res.json() as Promise<ClientsResponse>)
      .then((data) => {
        if (data.success) {
          setClients(data.clients || [])
          setAdAccounts(data.adAccounts || [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function toggleAccount(id: string) {
    setForm((current) => ({
      ...current,
      adAccountIds: current.adAccountIds.includes(id)
        ? current.adAccountIds.filter((item) => item !== id)
        : [...current.adAccountIds, id],
    }))
  }

  async function createClient() {
    setError(null)
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...form }),
    })
    const data = (await res.json()) as ClientsResponse

    if (!data.success || !data.client) {
      setError(data.error || 'Erro ao criar cliente')
      return
    }

    setClients((current) => [data.client as Client, ...current])
    setForm({ name: '', email: '', company: '', phone: '', notes: '', adAccountIds: [] })
  }

  async function deleteClient(id: string) {
    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    setClients((current) => current.filter((client) => client.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Carregando clientes...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardSidebar active="crm" />

      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-gray-400 text-sm mt-1">
            Separe contas por cliente para vender e entregar relatórios com segurança.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-4">Novo cliente</h2>
          <div className="grid grid-cols-4 gap-3">
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Nome do cliente"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="Email"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={form.company}
              onChange={(event) => setForm({ ...form, company: event.target.value })}
              placeholder="Empresa"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={createClient}
              className="bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium"
            >
              Criar cliente
            </button>
          </div>

          <div className="mt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              Contas vinculadas
            </p>
            <div className="flex flex-wrap gap-2">
              {adAccounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => toggleAccount(account.id)}
                  className={`px-3 py-2 rounded-lg text-xs border ${
                    form.adAccountIds.includes(account.id)
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300'
                  }`}
                >
                  {account.accountName || account.accountId}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-4">
          {clients.map((client) => (
            <section key={client.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{client.name}</h2>
                  <p className="text-gray-400 text-sm mt-1">{client.company || client.email || '-'}</p>
                </div>
                <button
                  onClick={() => deleteClient(client.id)}
                  className="text-xs text-red-300 hover:text-red-200"
                >
                  remover
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {client.adAccounts.map((account) => (
                  <div key={account.id} className="bg-gray-800 rounded-lg px-3 py-2">
                    <p className="text-sm">{account.accountName || account.accountId}</p>
                    <p className="text-xs text-gray-500">{account.platform} · {account.currency}</p>
                  </div>
                ))}

                {client.adAccounts.length === 0 && (
                  <p className="text-sm text-gray-500">Nenhuma conta vinculada.</p>
                )}
              </div>
            </section>
          ))}

          {clients.length === 0 && (
            <div className="col-span-3 bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-400">
              Nenhum cliente criado ainda.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
