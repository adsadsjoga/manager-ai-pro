'use client'

import { useEffect, useMemo, useState } from 'react'

type ReportItem = {
  id: string
  name: string | null
  reportType: string | null
  format: string | null
  periodStart: string | null
  periodEnd: string | null
  status: string
  shareToken: string | null
  generatedAt: string | null
  createdAt: string
}

type ReportsResponse = {
  success: boolean
  reports?: ReportItem[]
  report?: ReportItem
  error?: string
}

const typeConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  daily: { label: 'Diario', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: 'D' },
  weekly: { label: 'Semanal', color: 'text-purple-400', bg: 'bg-purple-500/20', icon: 'S' },
  monthly: { label: 'Mensal', color: 'text-indigo-400', bg: 'bg-indigo-500/20', icon: 'M' },
  custom: { label: 'Customizado', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: 'C' },
}

function formatDate(value: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function reportUrl(report: ReportItem) {
  return report.shareToken ? `/api/reports/${report.shareToken}` : '#'
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState('weekly')
  const [dateFrom, setDateFrom] = useState('2025-06-01')
  const [dateTo, setDateTo] = useState('2025-06-30')

  const latestReport = reports[0] || null

  const activeType = useMemo(
    () => typeConfig[selectedType] || typeConfig.custom,
    [selectedType]
  )

  useEffect(() => {
    let active = true

    fetch('/api/reports')
      .then((res) => res.json() as Promise<ReportsResponse>)
      .then((data) => {
        if (!active) return

        if (data.success) {
          setReports(data.reports || [])
        }
      })

    return () => {
      active = false
    }
  }, [])

  async function handleGenerate() {
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: selectedType,
          dateFrom,
          dateTo,
        }),
      })
      const data = (await res.json()) as ReportsResponse

      if (!data.success || !data.report) {
        setError(data.error || 'Erro ao gerar relatorio')
        return
      }

      setReports((current) => [data.report as ReportItem, ...current])
      window.open(reportUrl(data.report), '_blank')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 p-6">
        <div className="text-xl font-bold text-indigo-400 mb-8">⚡ Ads Manager AI</div>
        <nav className="space-y-1">
          {[
            { label: '📊 Dashboard', href: '/dashboard' },
            { label: '📣 Campanhas', href: '/dashboard/campaigns' },
            { label: '🔔 Alertas', href: '/dashboard/alerts' },
            { label: '📄 Relatorios', href: '/dashboard/reports', active: true },
            { label: '👥 CRM', href: '/dashboard/crm' },
            { label: '⚙️ Configuracoes', href: '/dashboard/settings' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Relatorios</h1>
            <p className="text-gray-400 text-sm mt-1">
              Gere relatorios reais a partir das metricas sincronizadas.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-[360px_minmax(0,1fr)] gap-6 mb-8">
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Gerar relatorio</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedType(key)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors border ${
                        selectedType === key
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      {config.icon} {config.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">
                  Periodo
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Formato</p>
                <p className="text-sm mt-1">
                  HTML imprimivel com botao para salvar como PDF no navegador.
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                {generating ? 'Gerando...' : 'Gerar e abrir relatorio'}
              </button>
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="font-semibold">Preview do proximo relatorio</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {activeType.label} de {formatDate(`${dateFrom}T00:00:00.000Z`)} ate{' '}
                  {formatDate(`${dateTo}T00:00:00.000Z`)}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${activeType.bg} ${activeType.color}`}>
                {activeType.label}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-5">
              {['Investimento', 'Receita', 'ROAS', 'Compras'].map((label) => (
                <div key={label} className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className="font-bold mt-2">Dados reais no arquivo</p>
                </div>
              ))}
            </div>

            <div className="bg-indigo-900/20 border border-indigo-700/40 rounded-xl p-4">
              <p className="text-sm font-semibold text-indigo-300">Inclui analise automatica</p>
              <p className="text-xs text-gray-300 mt-1">
                O relatorio usa as metricas do periodo, campanhas principais e a ultima analise
                salva pela IA/motor de regras.
              </p>
            </div>
          </section>
        </div>

        <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold">Historico de relatorios</h2>
            {latestReport && (
              <a
                href={reportUrl(latestReport)}
                target="_blank"
                className="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                Abrir ultimo
              </a>
            )}
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                {['Nome', 'Tipo', 'Periodo', 'Status', 'Gerado em', 'Acoes'].map((heading) => (
                  <th
                    key={heading}
                    className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const config = typeConfig[report.reportType || 'custom'] || typeConfig.custom

                return (
                  <tr key={report.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-medium">{report.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {formatDate(report.periodStart)} - {formatDate(report.periodEnd)}
                    </td>
                    <td className="px-4 py-3 text-green-400">{report.status}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {formatDate(report.generatedAt || report.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={reportUrl(report)}
                        target="_blank"
                        className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 px-3 py-1 rounded text-xs transition-colors"
                      >
                        Abrir PDF
                      </a>
                    </td>
                  </tr>
                )
              })}

              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Nenhum relatorio gerado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
