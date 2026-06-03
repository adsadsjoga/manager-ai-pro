'use client'
import { useState } from 'react'

export default function SettingsPage() {
  const [windsorKey, setWindsorKey] = useState('edec4af248054e6840792437c3a3588e7151')
  const [claudeKey, setClaudeKey] = useState('')
  const [accountId, setAccountId] = useState('1772581277320489')
  const [accountName, setAccountName] = useState('Retro Mundial Ads')
  const [syncInterval, setSyncInterval] = useState('15')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [emailReport, setEmailReport] = useState(true)
  const [reportDay, setReportDay] = useState('monday')
  const [thresholdRoas, setThresholdRoas] = useState('1.5')
  const [thresholdCtr, setThresholdCtr] = useState('0.8')
  const [thresholdFreq, setThresholdFreq] = useState('3.5')
  const [thresholdCpa, setThresholdCpa] = useState('30')
  const [saved, setSaved] = useState(false)
  const [showWindsor, setShowWindsor] = useState(false)
  const [showClaude, setShowClaude] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const mask = (key: string) => key ? key.slice(0, 8) + '••••••••••••••••••••' + key.slice(-4) : ''

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 p-6">
        <div className="text-xl font-bold text-indigo-400 mb-8">⚡ Ads Manager AI</div>
        <nav className="space-y-1">
          {[
            { label: '📊 Dashboard', href: '/dashboard' },
            { label: '📣 Campanhas', href: '/dashboard/campaigns' },
            { label: '🔔 Alertas', href: '/dashboard/alerts' },
            { label: '📄 Relatórios', href: '/dashboard/reports' },
            { label: '👥 CRM', href: '/dashboard/crm' },
            { label: '⚙️ Configurações', href: '/dashboard/settings', active: true },
          ].map((item) => (
            <a key={item.href} href={item.href}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${(item as any).active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
            <div className="font-medium text-white mb-1">Retro Mundial Ads</div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
              Windsor.ai conectado
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="ml-64 p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-gray-400 text-sm mt-1">Gerencie integrações, alertas e preferências</p>
          </div>
          <button onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            {saved ? '✅ Salvo!' : '💾 Salvar alterações'}
          </button>
        </div>

        <div className="space-y-6">

          {/* Conta de anúncio */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <span className="text-blue-400">🔵</span> Conta de Anúncio — Facebook Ads
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">Nome da conta</label>
                <input value={accountName} onChange={e => setAccountName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">Account ID</label>
                <input value={accountId} onChange={e => setAccountId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
              Conta conectada e sincronizando
            </div>
          </section>

          {/* Windsor.ai */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <span>🔌</span> Windsor.ai
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full ml-1">Conectado</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">API Key</label>
                <div className="flex gap-2">
                  <input
                    type={showWindsor ? 'text' : 'password'}
                    value={windsorKey} onChange={e => setWindsorKey(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono" />
                  <button onClick={() => setShowWindsor(!showWindsor)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors text-sm">
                    {showWindsor ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">Intervalo de sincronização</label>
                <select value={syncInterval} onChange={e => setSyncInterval(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="5">A cada 5 minutos (Pro)</option>
                  <option value="15">A cada 15 minutos</option>
                  <option value="60">A cada 1 hora</option>
                  <option value="1440">1x por dia</option>
                </select>
              </div>
            </div>
          </section>

          {/* Claude AI */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <span>🤖</span> Claude AI (Anthropic)
              {claudeKey
                ? <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full ml-1">Conectado</span>
                : <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full ml-1">Não configurado</span>
              }
            </h2>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">API Key</label>
              <div className="flex gap-2">
                <input
                  type={showClaude ? 'text' : 'password'}
                  value={claudeKey} onChange={e => setClaudeKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono" />
                <button onClick={() => setShowClaude(!showClaude)}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors text-sm">
                  {showClaude ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Necessário para análises automáticas de campanhas com IA.
                <a href="https://console.anthropic.com" target="_blank" className="text-indigo-400 hover:underline ml-1">
                  Obter chave →
                </a>
              </p>
            </div>
          </section>

          {/* Regras de alertas */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <span>🔔</span> Regras de Alertas
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">
                  Alertar se ROAS abaixo de
                </label>
                <div className="flex items-center gap-2">
                  <input type="number" value={thresholdRoas} onChange={e => setThresholdRoas(e.target.value)} step="0.1"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  <span className="text-gray-400 text-sm shrink-0">x</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">
                  Alertar se CTR abaixo de
                </label>
                <div className="flex items-center gap-2">
                  <input type="number" value={thresholdCtr} onChange={e => setThresholdCtr(e.target.value)} step="0.1"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  <span className="text-gray-400 text-sm shrink-0">%</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">
                  Alertar se frequência acima de
                </label>
                <input type="number" value={thresholdFreq} onChange={e => setThresholdFreq(e.target.value)} step="0.1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">
                  Alertar se CPA subir mais de
                </label>
                <div className="flex items-center gap-2">
                  <input type="number" value={thresholdCpa} onChange={e => setThresholdCpa(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  <span className="text-gray-400 text-sm shrink-0">%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Notificações */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <span>📧</span> Notificações por Email
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <div>
                  <p className="text-sm font-medium">Alertas críticos por email</p>
                  <p className="text-xs text-gray-400">Receba emails quando houver alertas críticos</p>
                </div>
                <button onClick={() => setEmailAlerts(!emailAlerts)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${emailAlerts ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${emailAlerts ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <div>
                  <p className="text-sm font-medium">Relatório semanal automático</p>
                  <p className="text-xs text-gray-400">Envio automático toda semana por email</p>
                </div>
                <button onClick={() => setEmailReport(!emailReport)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${emailReport ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${emailReport ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
              {emailReport && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">Dia do relatório semanal</label>
                  <select value={reportDay} onChange={e => setReportDay(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
                    <option value="monday">Segunda-feira</option>
                    <option value="tuesday">Terça-feira</option>
                    <option value="friday">Sexta-feira</option>
                    <option value="sunday">Domingo</option>
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* Plano */}
          <section className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-700/40 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  🚀 Plano Atual: <span className="text-indigo-300">Free</span>
                </h2>
                <p className="text-sm text-gray-400 mt-1">1 conta de anúncio · Sync manual · 7 dias de histórico</p>
                <div className="flex gap-4 mt-3 text-xs text-gray-400">
                  <span>✅ Dashboard básico</span>
                  <span>✅ Windsor.ai conectado</span>
                  <span>🔒 AI insights (Pro)</span>
                  <span>🔒 Alertas automáticos (Pro)</span>
                </div>
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0">
                ⚡ Upgrade para Pro<br />
                <span className="text-indigo-200 font-normal text-xs">R$197/mês</span>
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
