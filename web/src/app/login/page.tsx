import { signIn } from '@/lib/supabase/auth'

export default function LoginPage({ searchParams }: { searchParams: { error?: string, message?: string } }) {
  const hasError = searchParams?.error === 'true';
  const errorMessage = searchParams?.message || 'Erro de autenticação! Verifique suas credenciais.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">StudyPro</h1>
          <p className="mt-2 text-gray-600">Orquestrador de Estudos</p>
        </div>

        {hasError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium text-center shadow-sm">
            {errorMessage}<br/>
            <span className="text-xs font-normal mt-1 block">
              Se estiver na Vercel, confirme que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configurados no seu dashboard!
            </span>
          </div>
        )}

        <form action={signIn} className="mt-4 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Entrar
          </button>

          <div className="text-center">
            <a href="/register" className="text-blue-600 hover:text-blue-500 text-sm">
              Não tem conta? Cadastre-se
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
