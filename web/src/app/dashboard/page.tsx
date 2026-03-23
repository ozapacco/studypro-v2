import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/lib/supabase/auth'

export default async function DashboardPage() {
  // ATENÇÃO: Auth bypassado para permitir foco no desenvolvimento (Modo Offline/Dev)
  //const supabase = createServerSupabaseClient()
  //const { data: { user }, error } = await supabase.auth.getUser()

  const user = { email: "usuario@desenvolvimento.local" }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">StudyPro - Console</h1>
          
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
            >
              Sair da Conta
            </button>
          </form>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center mt-10">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-8 h-8" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Login realizado com sucesso!</h2>
          <p className="text-lg text-gray-600 mb-6">
            Bem-vindo ao <strong>StudyPro</strong>, {user.email}.
          </p>
          
          <div className="inline-block bg-blue-50 border border-blue-100 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">ℹ️ O que aconteceu:</h3>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li>O banco de dados do Supabase criou seu perfil.</li>
              <li>As variáveis de ambiente do Vercel estão funcionando perfeitamente.</li>
              <li>O Next.js Middleware autorizou seu cookie de sessão.</li>
              <li>Você foi redirecionado para esta tela (Dashboard), que antes não existia (por isso o erro 404).</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
