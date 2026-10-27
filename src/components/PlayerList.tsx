import { useState } from 'react';
import type { AdminPlayer } from '../lib/n8n/owner';

export default function PlayerList({ players, busy=false, onRefresh }: { players?: AdminPlayer[]; busy?: boolean; onRefresh?: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  if (!players) return <section><h2>Jogadores da pelada</h2><p role="status">Lista de jogadores indisponível no momento.</p>{onRefresh && <button type="button" className="text-button" disabled={busy} onClick={onRefresh}>Atualizar jogadores</button>}</section>;
  const active = players.filter(p => p.situacao === 'ativo').length;
  return <section className="player-directory"><h2>Jogadores da pelada · {players.length}</h2>{onRefresh && <button type="button" className="text-button" disabled={busy} onClick={onRefresh}>Atualizar jogadores</button>}<p>{active} ativos · {players.length - active} inativos</p>
    {!players.length && <p>Nenhum jogador cadastrado nesta pelada. Convites ainda não concluídos não entram nesta quantidade.</p>}
    {players.map(p => <article className="entry-explanation" key={p.participante_id}>
      <button type="button" className="text-button" aria-expanded={selected === p.participante_id} aria-controls={`jogador-${p.participante_id}`} onClick={() => setSelected(id => id === p.participante_id ? null : p.participante_id)}>{p.nome || p.apelido}</button>
      <span>{p.apelido} · {p.categoria}{p.papel_administrativo === 'ADMIN' ? ' · ADMIN' : ''} · {p.situacao === 'ativo' ? 'Cadastro ativo' : 'Cadastro inativo'}</span>
      {selected === p.participante_id && <dl id={`jogador-${p.participante_id}`}><dt>Nome</dt><dd>{p.nome}</dd><dt>Apelido</dt><dd>{p.apelido}</dd><dt>CPF</dt><dd>{p.cpf || 'Não informado'}</dd><dt>WhatsApp</dt><dd>{p.telefone || 'Não informado'}</dd><dt>E-mail</dt><dd>{p.email || 'Não informado'}</dd><dt>Categoria</dt><dd>{p.categoria}</dd><dt>Permissão</dt><dd>{p.papel_administrativo || 'Jogador'}</dd><dt>Situação do cadastro</dt><dd>{p.situacao}</dd><dt>Situação financeira</dt><dd>A situação ativa do cadastro não confirma pagamento. A aptidão financeira é controlada separadamente.</dd></dl>}
    </article>)}
  </section>;
}
