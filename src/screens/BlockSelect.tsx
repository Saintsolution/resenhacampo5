import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button, Card } from '@/components/ui';
import { Shield, Users, UserCircle, Trophy, ChevronRight, LogOut, Plus } from 'lucide-react';

export default function BlockSelect({
  onSelect,
}: {
  onSelect: (block: 'admin' | 'mensalista' | 'diarista', peladaId: string) => void;
}) {
  const { user, organizador, participantes, peladas, signOut, selecionarPelada } = useAuth();
  const [selectedPelada, setSelectedPelada] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);

  const allPeladas = peladas;
  const myParticipantes = participantes;

  const peladaOptions = allPeladas.map((p) => ({
    value: p.id,
    label: p.nome,
  }));

  const currentPart = myParticipantes.find((p) => p.pelada_id === selectedPelada);
  const canAdmin =
    organizador != null ||
    currentPart?.papel_administrativo === 'owner' ||
    currentPart?.papel_administrativo === 'admin';
  const isMensalista = currentPart?.categoria === 'mensalista' || currentPart?.papel_administrativo === 'owner';
  const isDiarista = currentPart?.categoria === 'diarista' || currentPart != null;

  function handleSelect(block: 'admin' | 'mensalista' | 'diarista') {
    if (!selectedPelada) return;
    selecionarPelada(selectedPelada);
    onSelect(block, selectedPelada);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">JogoLindo</p>
              <p className="text-xs text-slate-500 leading-tight">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4" /> Sair
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Bem-vindo{organizador ? `, ${organizador.nome.split(' ')[0]}` : ''}!</h1>
        <p className="text-slate-500 mb-6">Selecione a pelada e como deseja acessar.</p>

        {peladaOptions.length === 0 && !organizador ? (
          <Card className="p-8 text-center">
            <p className="text-slate-500 mb-4">
              Você ainda não está vinculado a nenhuma pelada. Peça um convite a um organizador ou mensalista.
            </p>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Selecione a pelada</label>
              <div className="flex gap-2">
                <select
                  value={selectedPelada}
                  onChange={(e) => setSelectedPelada(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none bg-white text-slate-900"
                >
                  <option value="">Escolha uma pelada...</option>
                  {peladaOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {organizador && (
                  <Button variant="secondary" onClick={() => setShowCreate(true)}>
                    <Plus className="w-4 h-4" /> Nova pelada
                  </Button>
                )}
              </div>
            </div>

            {selectedPelada && (
              <div className="grid sm:grid-cols-3 gap-4">
                <BlockCard
                  icon={<Shield className="w-7 h-7" />}
                  title="Administrar"
                  description="Gestão completa: participantes, jogos, finanças, relatórios."
                  color="emerald"
                  disabled={!canAdmin}
                  disabledReason={
                    organizador
                      ? undefined
                      : 'Acesso restrito a Owner e Admin'
                  }
                  onClick={() => handleSelect('admin')}
                />
                <BlockCard
                  icon={<Users className="w-7 h-7" />}
                  title="Mensalista"
                  description="Sua situação financeira, jogos e mural da pelada."
                  color="teal"
                  disabled={!isMensalista}
                  disabledReason="Acesso para mensalistas"
                  onClick={() => handleSelect('mensalista')}
                />
                <BlockCard
                  icon={<UserCircle className="w-7 h-7" />}
                  title="Diarista"
                  description="Jogadores aptos e dias de jogo disponíveis."
                  color="slate"
                  disabled={!isDiarista}
                  disabledReason="Acesso para diaristas"
                  onClick={() => handleSelect('diarista')}
                />
              </div>
            )}

            {showCreate && <CreatePeladaForm onClose={() => setShowCreate(false)} />}
          </>
        )}
      </main>
    </div>
  );
}

function BlockCard({
  icon,
  title,
  description,
  color,
  disabled,
  disabledReason,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'emerald' | 'teal' | 'slate';
  disabled: boolean;
  disabledReason?: string;
  onClick: () => void;
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400 hover:shadow-md',
    teal: 'bg-teal-50 text-teal-600 border-teal-200 hover:border-teal-400 hover:shadow-md',
    slate: 'bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-400 hover:shadow-md',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-left p-5 rounded-xl border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${colors[color]}`}
    >
      <div className="mb-3">{icon}</div>
      <h3 className="font-bold text-slate-900 text-lg mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-3">{description}</p>
      {disabled ? (
        <p className="text-xs text-slate-400">{disabledReason}</p>
      ) : (
        <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
          Acessar <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </button>
  );
}

function CreatePeladaForm({ onClose }: { onClose: () => void }) {
  const { organizador, refreshOrganizador } = useAuth();
  const [nome, setNome] = useState('');
  const [local, setLocal] = useState('Aterro do Flamengo — Campo 5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!organizador) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.from('peladas').insert({
      organizador_id: organizador.id,
      nome: nome || 'RESENHA FUTEBOL CAMPO 5',
      local,
      dia_semana: 'sabado',
      horario_inicio: '09:00',
      horario_fim: '10:00',
      valor_mensalidade: 30.0,
      valor_diaria_sem_colete: 15.0,
      valor_diaria_com_colete: 20.0,
      valor_colete_avulso: 5.0,
      dia_vencimento_mensal: 10,
      validade_convite_horas: 72,
      horario_corte_mural: '08:50',
      ativa: true,
    });

    if (error) {
      setError(error.message);
    } else {
      await refreshOrganizador();
      onClose();
    }
    setLoading(false);
  }

  return (
    <Card className="p-5 mt-4">
      <h3 className="font-bold text-slate-900 mb-4">Criar nova pelada</h3>
      <form onSubmit={handleCreate} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome da pelada</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="RESENHA FUTEBOL CAMPO 5"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Local</label>
          <input
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Criando...' : 'Criar pelada'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
