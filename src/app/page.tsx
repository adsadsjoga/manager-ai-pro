export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Ads Manager AI Pro
        </div>
        <p className="text-gray-400 text-lg">Plataforma inteligente de gestão de Facebook Ads</p>
        <div className="flex gap-3 justify-center mt-6">
          <a href="/dashboard" className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-medium transition-colors">
            Acessar Dashboard
          </a>
          <a href="/setup" className="border border-gray-700 hover:border-gray-500 px-6 py-3 rounded-lg font-medium transition-colors">
            Configurar Conta
          </a>
        </div>
      </div>
    </main>
  )
}