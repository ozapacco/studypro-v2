import { signIn } from '@/lib/supabase/auth'

export default function LoginPage({ searchParams }: { searchParams: { error?: string, message?: string } }) {
  const hasError = searchParams?.error === 'true';
  const errorMessage = searchParams?.message || 'Erro de autenticação! Verifique o console ou a Vercel.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-100/50 rounded-full blur-3xl" />
      
      <div className="max-w-md w-full relative z-10 space-y-8 p-10 bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-blue-900/5">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
             <span className="text-white font-black text-2xl">SP</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">StudyPro</h1>
          <p className="mt-2 text-sm font-semibold text-slate-400 uppercase tracking-widest">Single-User Mode</p>
        </div>

        {hasError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-2xl text-sm font-medium text-center shadow-sm">
            {errorMessage}<br/>
            <span className="text-[10px] font-black uppercase mt-2 block opacity-70">
              Verifique as configurações na Vercel
            </span>
          </div>
        )}

        <form action={signIn} className="mt-8 space-y-4">
          <input type="hidden" name="email" value="admin@studypro.local" />
          <input type="hidden" name="password" value="admin-studypro-password-123" />
          
          <button
            type="submit"
            className="w-full flex justify-center py-5 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-200 text-lg font-black text-white bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] transition-all focus:outline-none"
          >
            Acessar Cockpit 🚀
          </button>
        </form>

        <div className="text-center pt-4">
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
             Acesso Unificado Autorizado
           </p>
        </div>
      </div>
    </div>
  )
}
