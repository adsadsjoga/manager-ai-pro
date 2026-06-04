import { SignOutButton } from "@clerk/nextjs";

export default function LogoutPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Sair da conta</h1>
        <p className="text-gray-400">Clique abaixo para sair e testar o login novamente.</p>

        <SignOutButton redirectUrl="/sign-in">
          <button className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium">
            Sair
          </button>
        </SignOutButton>
      </div>
    </main>
  );
}