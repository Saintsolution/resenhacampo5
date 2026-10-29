import { useState } from 'react';
import { LogOut } from 'lucide-react';
import InviteManager from './InviteManager';
import PersonalDetails from './PersonalDetails';
import MatchHistory from './MatchHistory';
import MatchBoard from './MatchBoard';
import PlayerList from './PlayerList';
import { paymentLink } from '../lib/n8n/invites';
import { nextGameDate, formatGameDate } from '../lib/matchDate';
import { formatCurrency } from '../lib/utils';
import type { OwnerSession, PersonalProfile } from '../lib/n8n/owner';

export default function AccessPanel({ session, token, busy, message, error, onSelect, onCreate, onLogout, onProfileSaved, onEnroll, previewOnly=false }: {
  previewOnly?: boolean; session: OwnerSession; token: string; busy: boolean; message: string; error: string;
  onSelect: (id: string) => void; onCreate: () => void; onLogout: () => void; onProfileSaved: (profile: PersonalProfile) => void; onEnroll: () => void;
}) {
  const [tab, setTab] = useState<'painel' | 'convites' | 'cadastro' | 'historico'>('painel');
  const club = session.pelada;
  const owner = session.papel_administrativo === 'OWNER';
  const admin = owner || session.papel_administrativo === 'ADMIN';
  const canInvite = !previewOnly && (admin || session.categoria?.toUpperCase() === 'MENSALISTA');
  if (!club && owner) return <div className="demo-entry"><section className="entry-card owner-panel"><div className="eyebrow">JOGOLINDO · OWNER</div><h1>Meu painel</h1><p>Olá, {session.nome}. Sua conta está cadastrada.</p><button className="button primary" disabled={busy} onClick={onCreate}>Criar minha pelada</button><button className="button light" disabled={busy} onClick={() => setTab('cadastro')}>Meu cadastro</button>{tab === 'cadastro' && session.meu_cadastro && <PersonalDetails profile={session.meu_cadastro} token={token} onSaved={onProfileSaved}/>}<p>Você ainda não criou uma pelada.</p>{error && <p role="alert">{error}</p>}<button className="button light" disabled={busy} onClick={onLogout}>Sair</button></section></div>;
  if (!club) return <p role="alert">Não há pelada autorizada para este acesso.</p>;
  return <div className="demo-entry"><section className="entry-card owner-panel">
    <div className="eyebrow">JOGOLINDO · {admin ? 'ADMINISTRAÇÃO' : 'ÁREA DO JOGADOR'}</div>
    <h1>{club.nome}</h1><p>Olá, {session.meu_cadastro?.apelido || session.nome}.</p>
    <label>Minha pelada<select aria-label="Minha pelada" value={club.id} disabled={busy} onChange={e => onSelect(e.target.value)}>{(session.peladas || [club]).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
    {owner && <button className="button light" disabled={busy} onClick={onCreate}>Criar outra pelada</button>}
    {owner && !session.minhas_cobrancas?.some(c => c.tipo === 'MENSALIDADE') && <button className="button light" disabled={busy} onClick={onEnroll}>Também quero jogar como mensalista</button>}
    {message && <p role="status">{message}</p>}
    <nav className="owner-panel-nav" aria-label="Meu painel">
      <button className={`button ${tab === 'painel' ? 'primary' : 'light'}`} disabled={busy} onClick={() => setTab('painel')}>{admin ? 'Dashboard' : 'Minha pelada'}</button>
      {admin && <button className={`button ${tab === 'historico' ? 'primary' : 'light'}`} disabled={busy} onClick={() => setTab('historico')}>Histórico de partidas</button>}
      {canInvite && <button className={`button ${tab === 'convites' ? 'primary' : 'light'}`} disabled={busy} onClick={() => setTab('convites')}>Convidar jogador</button>}
      <button className={`button ${tab === 'historico' && admin ? <MatchHistory name={club.nome} local={club.local} start={club.horario_inicio} end={club.horario_fim} matches={session.historico_partidas}/> : tab === 'cadastro' ? 'primary' : 'light'}`} disabled={busy} onClick={() => setTab('cadastro')}>Meu cadastro</button>
    </nav>
    {tab === 'cadastro' && previewOnly ? <p>Prévia de interface: a edição do cadastro fica no acesso real.</p> : tab === 'cadastro' ? session.meu_cadastro ? <PersonalDetails key={session.participante_id} profile={session.meu_cadastro} token={token} onSaved={onProfileSaved}/> : <p role="status">A consulta do cadastro depende da atualização do workflow de sessão.</p> : tab === 'convites' && canInvite ? <InviteManager key={club.id} token={token} club={club} allowAdmin={owner}/> : <>
      <div className="entry-explanation"><strong>{session.papel_administrativo || session.categoria}</strong><span>{club.local}{club.cidade && <><br/>{club.cidade}</>}</span></div>
      <div className="entry-explanation"><strong>Próxima pelada</strong><span>{formatGameDate(nextGameDate(club))}<br/>{club.horario_inicio} às {club.horario_fim}</span>{admin && <strong>{session.total_jogadores ?? '—'} jogadores ativos cadastrados</strong>}</div>
      {admin ? <MatchBoard key={`${club.id}:${session.proxima_partida?.data || nextGameDate(club)}`} name={club.nome} local={club.local} date={session.proxima_partida?.data || nextGameDate(club)} start={club.horario_inicio} end={club.horario_fim} participants={session.proxima_partida?.participantes} admin busy={busy} onRefresh={() => onSelect(club.id)}/> : <div className="player-clearance"><strong>Minha participação</strong><h2>{session.proxima_partida ? session.proxima_partida.participantes.find(p => p.participante_id === session.participante_id)?.apto ? 'Você está apto para jogar' : 'Sua participação está a confirmar' : 'Consulte sua participação'}</h2><p>{formatGameDate(session.proxima_partida?.data || nextGameDate(club))} · {club.horario_inicio} às {club.horario_fim}</p><p>A confirmação considera o pagamento da mensalidade ou diária desta partida.</p></div>}
      {admin && <PlayerList key={club.id} players={session.jogadores} participants={session.proxima_partida?.participantes} busy={busy} onRefresh={() => onSelect(club.id)}/>}
      <div className="entry-explanation"><strong>Minhas cobranças</strong>
        <button className="button light" disabled={busy} onClick={() => onSelect(club.id)}>Atualizar cobranças</button>
        {session.cobrancas_indisponiveis ? <span>Não foi possível consultar suas cobranças. Atualize para tentar novamente.</span> : session.minhas_cobrancas === undefined ? <span>A consulta de cobranças depende da atualização do workflow de sessão.</span> : !session.minhas_cobrancas.length ? <span>Nenhuma cobrança registrada para seu cadastro.</span> : session.minhas_cobrancas.map(charge => {
          const link = paymentLink(charge.invoice_url);
          const pending = ['PENDING', 'OVERDUE'].includes(charge.status);
          const label = ({ PENDING: 'Aguardando pagamento', OVERDUE: 'Vencida — aguardando pagamento', CONFIRMED: 'Pagamento confirmado', RECEIVED: 'Pagamento recebido', REFUNDED: 'Estornada', DELETED: 'Excluída' } as Record<string, string>)[charge.status] || 'Situação em conferência';
          return <div key={charge.payment_id}><strong>{label}</strong><p>{charge.tipo === 'MENSALIDADE' ? 'Mensalidade' : charge.tipo === 'DIARIA' ? 'Diária' : 'Cobrança'} · {charge.competencia} · {formatCurrency(charge.valor)}</p><p>Vencimento: {charge.vencimento.split('-').reverse().join('/')}</p>{pending && (link ? <a className="button primary" href={link} target="_blank" rel="noopener noreferrer">Abrir cobrança / imprimir boleto</a> : <p>Peça ao organizador o link da cobrança já registrada.</p>)}</div>;
        })}
      </div>
      <div className="entry-explanation"><strong>Valores da pelada</strong><span>Mensalidade: {formatCurrency(club.mensalidade)}<br/>Diária sem colete: {formatCurrency(club.diaria_sem_colete)}<br/>Diária com colete: {formatCurrency(club.diaria_com_colete)}<br/>Colete avulso: {formatCurrency(club.colete_avulso)}<br/>Vencimento mensal: dia {club.vencimento_mensal}</span></div>
    </>}
    {error && <p role="alert">{error}</p>}
    <button className="button primary" disabled={busy} onClick={onLogout}><LogOut size={17}/>{busy ? 'Aguarde…' : 'Sair'}</button>
  </section></div>;
}
