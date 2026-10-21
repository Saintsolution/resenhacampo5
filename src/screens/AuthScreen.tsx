import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Input } from '@/components/ui';
import { validateEmail, validatePhone } from '@/lib/utils';
import { Trophy, Shield, Users, UserCircle, ArrowRight } from 'lucide-react';

type Mode = 'login' | 'signup';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('E-mail inválido.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (nome.trim().length < 3) {
        setError('Informe seu nome completo.');
        setLoading(false);
        return;
      }
      if (!validatePhone(telefone)) {
        setError('Telefone inválido. Use o formato (21) 99999-9999.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, nome, telefone);
      if (error) setError(error);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Trophy className="w-9 h-9 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">JogoLindo</h1>
          <p className="text-emerald-100 mt-1">RESENHA FUTEBOL CAMPO 5</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
                mode === 'login' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
                mode === 'signup' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <Input label="Nome completo" value={nome} onChange={setNome} placeholder="Ricardo Silva" required />
                <Input
                  label="Telefone / WhatsApp"
                  value={telefone}
                  onChange={setTelefone}
                  placeholder="(21) 99999-9999"
                  required
                />
              </>
            )}
            <Input label="E-mail" value={email} onChange={setEmail} type="email" placeholder="seu@email.com" required />
            <Input
              label="Senha"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="Mínimo 6 caracteres"
              required
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center mb-4">
              Após entrar, você poderá escolher como acessar:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-medium text-slate-600">Administrar</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50">
                <Users className="w-5 h-5 text-teal-600" />
                <span className="text-xs font-medium text-slate-600">Mensalista</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50">
                <UserCircle className="w-5 h-5 text-slate-500" />
                <span className="text-xs font-medium text-slate-600">Diarista</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-emerald-100 text-xs mt-6">
          Aterro do Flamengo · Campo 5 · Sábados 09h-10h
        </p>
      </div>
    </div>
  );
}
