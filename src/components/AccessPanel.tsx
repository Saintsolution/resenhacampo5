import { useState } from 'react';
import { LogOut } from 'lucide-react';
import InviteManager from './InviteManager';
import PersonalDetails from './PersonalDetails';
import { nextGameDate, formatGameDate } from '../lib/matchDate';
import { formatCurrency } from '../lib/utils';
import type { OwnerSession, PersonalProfile } from '../lib/n8n/owner';

export default function AccessPanel({ session, token, busy, message, error, onSelect, onCreate, onLogout, onProfileSaved }: {
  session: OwnerSession; token: string; busy: boolean; message: string; error: string;
  onSelect: (id: string) => void; onCreate: () => void; onLogout: () => void; onProfileSaved: (profile: PersonalProfile) => void;
}) {
  const [tab, setTab] = useState<'painel' | 'convites' | 'cadastro'>('painel');
  const club = session.pelada;
  const owner = session.papel_administrativo === 'OWNER';
  const admin = owner || session.papel_administrativo === 'ADMIN';
  if (!club) return <p role="alert">Não há pelada autorizada para este acesso.</p>;
  return <div className="demo-entry"><section className="entry-card owner-panel">
    <div className="eyebrow">JOGOLINDO · {admin ? 'ADMINISTRAÇÃO' : 'ÁREA DO JOGADOR'}</div>
    <h1>{club.nome}</h1><p>Olá, {session.meu_cadastro?.apelido || session.nome}.</p>
    <label>Minha pelada<select aria-label="Minha pelada" value={club.id} disabled={busy} onChange={e => onSelect(e.target.value)}>{(session.peladas || [club]).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
    {owner && <button className="button light" disabled={busy} onClick={onCreate}>Criar outra pelada</button>}
    {message && <p role="status">{message}</p>}
    <nav className="owner-panel-nav" aria-label="Meu painel">
      <button className={`button ${tab === 'painel' ? 'primary' : 'light'}`} disabled={busy} onClick={() => setTab('painel')}>{admin ? 'Dashboard' : 'Minha pelada'}</button>
      {admin && <button className={`button ${tab === 'convites' ? 'primary' : 'light'}`} disabled={busy} onClick={() => setTab('convites')}>Convidar jogador</button>}
      <button className={`button ${tab === 'cadastro' ? 'primary' : 'light'}`} disabled={busy} onClick={() => setTab('cadastro')}>Meu cadastro</button>
    </nav>
    {tab === 'cadastro' ? session.meu_cadastro ? <PersonalDetails key={session.participante_id} profile={session.meu_cadastro} token={token} onSaved={onProfileSaved}/> : <p role="status">A consulta do cadastro depende da atualização do workflow de sessão.</p> : tab === 'convites' && admin ? <InviteManager key={club.id} token={token} club={club}/> : <>
      <div className="entry-explanation"><strong>{session.papel_administrativo || session.categoria}</strong><span>{club.local}{club.cidade && <><br/>{club.cidade}</>}</span></div>
      <div className="entry-explanation"><strong>Próxima pelada</strong><span>{formatGameDate(nextGameDate(club))}<br/>{club.horario_inicio} às {club.horario_fim}</span>{admin && <strong>{session.total_jogadores ?? '—'} jogadores ativos cadastrados</strong>}</div>
      <div className="entry-explanation"><strong>Valores da pelada</strong><span>Mensalidade: {formatCurrency(club.mensalidade)}<br/>Diária sem colete: {formatCurrency(club.diaria_sem_colete)}<br/>Diária com colete: {formatCurrency(club.diaria_com_colete)}<br/>Colete avulso: {formatCurrency(club.colete_avulso)}<br/>Vencimento mensal: dia {club.vencimento_mensal}</span></div>
    </>}
    {error && <p role="alert">{error}</p>}
    <button className="button primary" disabled={busy} onClick={onLogout}><LogOut size={17}/>{busy ? 'Aguarde…' : 'Sair'}</button>
  </section></div>;
}
