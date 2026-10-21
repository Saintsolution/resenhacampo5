import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Check, ChevronRight, CircleHelp, Clock3, CreditCard, LayoutDashboard, MapPin, Menu, Plus, Search, Shirt, UserPlus, Users, Wallet, X } from 'lucide-react';
import { formatCurrency } from './lib/utils';

type Page = 'Visão geral' | 'Jogadores' | 'Financeiro' | 'Jogos' | 'Convites';
type Player = { id: number; nome: string; apelido: string; categoria: string; pago: boolean; presente: boolean };
const initial: Player[] = [
  { id: 1, nome: 'Ricardo Almeida', apelido: 'Ricardo', categoria: 'Mensalista', pago: true, presente: true },
  { id: 2, nome: 'Bruno Santos', apelido: 'Bruninho', categoria: 'Mensalista', pago: true, presente: true },
  { id: 3, nome: 'Carlos Eduardo', apelido: 'Cadu', categoria: 'Mensalista', pago: false, presente: false },
  { id: 4, nome: 'Felipe Costa', apelido: 'Felipinho', categoria: 'Diarista', pago: true, presente: true },
  { id: 5, nome: 'Marcelo Souza', apelido: 'Marcelão', categoria: 'Mensalista', pago: true, presente: false },
  { id: 6, nome: 'Pedro Lima', apelido: 'Pedrinho', categoria: 'Diarista', pago: false, presente: false },
];
const navigation = [{ name: 'Visão geral', icon: LayoutDashboard }, { name: 'Jogadores', icon: Users }, { name: 'Financeiro', icon: Wallet }, { name: 'Jogos', icon: CalendarDays }, { name: 'Convites', icon: UserPlus }] as const;

export default function App() {
  const [page, setPage] = useState<Page>('Visão geral');
  const [menu, setMenu] = useState(false);
  const [players, setPlayers] = useState(initial);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [modal, setModal] = useState<'jogador' | 'convite' | null>(null);
  const [notice, setNotice] = useState('');
  const [invites, setInvites] = useState<{ nome: string; categoria: string }[]>([]);
  const paid = players.filter(p => p.pago);
  const revenue = paid.reduce((s, p) => s + (p.categoria === 'Mensalista' ? 30 : 15), 0);
  const pending = players.filter(p => !p.pago).reduce((s, p) => s + (p.categoria === 'Mensalista' ? 30 : 15), 0);
  const visible = players.filter(p => `${p.nome} ${p.apelido}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'Todos' || p.categoria === filter || filter === 'Pendentes' && !p.pago));
  const navigate = (next: Page) => { setPage(next); setMenu(false); setSearch(''); setFilter('Todos'); };
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nome = String(data.get('nome')).trim();
    if (!nome) return;
    const categoria = String(data.get('categoria'));
    if (modal === 'jogador') setPlayers(p => [...p, { id: Date.now(), nome, apelido: String(data.get('apelido')).trim() || nome.split(' ')[0], categoria, pago: false, presente: false }]);
    else setInvites(p => [...p, { nome, categoria }]);
    setNotice(modal === 'jogador' ? 'Jogador adicionado à demonstração.' : 'Convite registrado na demonstração. Nenhuma mensagem foi enviada.');
    setModal(null);
  }
  return <div className="app-shell">
    <aside className={`sidebar ${menu ? 'is-open' : ''}`}>
      <a className="brand" href="#" onClick={e => { e.preventDefault(); navigate('Visão geral'); }}><img className="club-logo" src="/marca_resenha.jpg" alt="Resenha FC — Pelada Sábado, Campo 5, Aterro"/><span className="brand-caption">RESENHA CAMPO 5<small>FUTEBOL ENTRE AMIGOS</small></span></a>
      <div className="club-label">SUA PELADA</div>
      <div className="club"><span className="club-crest">R<span>5</span></span><div><strong>Resenha Campo 5</strong><small>Rio de Janeiro, RJ</small></div></div>
      <nav aria-label="Menu principal">{navigation.map(({ name, icon: Icon }) => <button key={name} className={page === name ? 'nav-item active' : 'nav-item'} onClick={() => navigate(name)}><Icon size={19}/>{name}{name === 'Convites' && <span className="nav-count">{invites.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="field-note"><span className="live-dot"/> A resenha tem lugar marcado.<p>Sábado, bola no pé.<br/>O resto a gente organiza.</p></div><div className="profile"><span className="avatar">R</span><div><strong>Ricardo</strong><small>Organizador · OWNER</small></div><CircleHelp size={18}/></div></div>
    </aside>
    {menu && <button className="menu-backdrop" aria-label="Fechar menu" onClick={() => setMenu(false)}/>}
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><button className="hamburger icon-button" aria-label="Abrir menu" aria-expanded={menu} onClick={() => setMenu(!menu)}><Menu/></button><img className="mobile-logo" src="/marca_resenha.jpg" alt="Resenha FC"/><span>Resenha Campo 5</span><ChevronRight size={14}/><strong>{page}</strong></div><span className="demo-tag"><span/>Modo demonstração</span></header>
      <main>
        <div className="page-heading"><div><div className="eyebrow">RESENHA FUTEBOL CAMPO 5</div><h1>{page === 'Visão geral' ? 'Tudo pronto para a próxima resenha.' : page}</h1><p>{page === 'Visão geral' ? 'Menos organização no grupo. Mais futebol no sábado.' : 'Tudo da sua pelada, em um só lugar.'}</p></div><button className="button primary" onClick={() => setModal(page === 'Jogadores' ? 'jogador' : 'convite')}><Plus size={17}/>{page === 'Jogadores' ? 'Novo jogador' : 'Convidar jogador'}</button></div>
        {notice && <div className="notice" role="status"><Check size={17}/>{notice}<button className="icon-button" aria-label="Dispensar aviso" onClick={() => setNotice('')}><X size={16}/></button></div>}
        {(page === 'Visão geral' || page === 'Jogos') && <section className="match-banner"><div className="match-content"><div className="match-kicker"><span className="live-dot"/> NOSSO PRÓXIMO ENCONTRO</div><h2>Sábado é dia de campo.</h2><p><MapPin size={16}/> Aterro do Flamengo · Campo 5</p><div className="match-details"><span><CalendarDays size={16}/>24 de outubro</span><span><Clock3 size={16}/>09h às 10h</span></div><button className="button light" onClick={() => navigate(page === 'Jogos' ? 'Jogadores' : 'Jogos')}>{page === 'Jogos' ? 'Ver jogadores' : 'Organizar jogo'}<ArrowUpRight size={16}/></button></div><div className="match-date"><span>OUTUBRO</span><strong>24</strong><span>SÁBADO</span></div><div className="photo-credit">Imagem ilustrativa</div></section>}
        {page === 'Financeiro' && <section className="stats"><article><span className="stat-icon green"><Wallet size={20}/></span><p>Recebido no mês</p><strong>{formatCurrency(revenue)}</strong><small><span className="tiny-dot"/> {paid.length} pagamentos de exemplo</small></article><article><span className="stat-icon amber"><CreditCard size={20}/></span><p>A receber</p><strong>{formatCurrency(pending)}</strong><small>{players.length - paid.length} jogadores com pendência</small></article><article><span className="stat-icon blue"><Users size={20}/></span><p>Jogadores na resenha</p><strong>{String(players.length).padStart(2, '0')}<em>jogadores</em></strong><small>{players.filter(p => p.categoria === 'Mensalista').length} mensalistas · {players.filter(p => p.categoria === 'Diarista').length} diaristas</small></article><article><span className="stat-icon green"><Shirt size={20}/></span><p>Aptos para jogar</p><strong>{String(paid.length).padStart(2, '0')}<em>jogadores</em></strong><small><span className="tiny-dot"/> Pagamento em dia na simulação</small></article></section>}
        <div className="single-content">
          {(page === 'Visão geral' || page === 'Jogadores' || page === 'Jogos') && <section className="panel players-panel"><div className="panel-heading"><div><h2>{page === 'Jogos' ? 'Lista de presença' : 'Quem faz a resenha'}</h2><p>{page === 'Jogos' ? 'Marque a presença para experimentar o controle de campo.' : 'Os amigos que dividem o campo com você.'}</p></div>{page === 'Visão geral' && <button className="text-button" onClick={() => navigate('Jogadores')}>Ver todos<ChevronRight size={15}/></button>}</div><div className="table-tools"><div className="tabs">{['Todos', 'Mensalista', 'Diarista', 'Pendentes'].map(t => <button className={filter === t ? 'selected' : ''} key={t} onClick={() => setFilter(t)}>{t === 'Mensalista' ? 'Mensalistas' : t === 'Diarista' ? 'Diaristas' : t}</button>)}</div><label className="search"><Search size={16}/><input aria-label="Buscar jogador" placeholder="Buscar jogador" value={search} onChange={e => setSearch(e.target.value)}/></label></div><div className="table-scroll"><table><thead><tr><th>JOGADOR</th><th>CATEGORIA</th><th>{page === 'Jogos' ? 'PRESENÇA' : 'SITUAÇÃO'}</th></tr></thead><tbody>{visible.map((p, i) => <tr key={p.id}><td><div className="player-name"><span className={`player-avatar tone-${i % 4}`}>{p.apelido.slice(0, 2).toUpperCase()}</span><div><strong>{p.apelido}</strong><small>{p.nome}</small></div></div></td><td><span className="category">{p.categoria}</span></td><td>{page === 'Jogos' ? <button className={`status ${p.presente ? 'paid' : 'pending'}`} onClick={() => setPlayers(all => all.map(x => x.id === p.id ? { ...x, presente: !x.presente } : x))}>{p.presente ? 'Presente' : 'Marcar presença'}</button> : <span className={`status ${p.pago ? 'paid' : 'pending'}`}><span/>{p.pago ? 'Em dia' : 'Pendente'}</span>}</td></tr>)}</tbody></table>{!visible.length && <p className="empty">Nenhum jogador encontrado.</p>}</div><div className="panel-footer">{visible.length} jogadores · Dados ilustrativos</div></section>}
          {page === 'Financeiro' && <section className="panel finance-panel"><div className="panel-heading"><div><h2>O caixa da resenha</h2><p>Outubro de 2026 · Demonstração</p></div><Wallet size={19}/></div><div className="balance"><span>Saldo do período</span><strong>{formatCurrency(revenue)}</strong><small>Sem despesas nesta demonstração</small></div><div className="cash-row"><span><i className="cash-icon"><ArrowDownLeft size={17}/></i>Entradas</span><strong>{formatCurrency(revenue)}</strong></div><div className="cash-row"><span><i className="cash-icon expense"><ArrowUpRight size={17}/></i>Saídas</span><strong>{formatCurrency(0)}</strong></div><div className="finance-note"><span className="tiny-dot"/> Valores simulados, sem cobranças reais.</div>{page === 'Financeiro' && <div className="finance-note">A confirmação automática de pagamentos será conectada ao Asaas na próxima etapa.</div>}</section>}
          {page === 'Convites' && <section className="panel"><div className="panel-heading"><div><h2>Mais amigos em campo</h2><p>Convites com validade de 72 horas.</p></div><UserPlus size={23}/></div>{invites.length ? invites.map((invite, i) => <div className="invite-row" key={i}><span className="avatar">{invite.nome[0]}</span><div><strong>{invite.nome}</strong><small>{invite.categoria} · Convidado por Ricardo</small></div><span className="status pending">Simulado</span></div>) : <div className="empty"><UserPlus size={35}/><h3>A próxima resenha começa com um convite.</h3><p>Experimente cadastrar um convidado. O envio será ativado com o backend.</p><button className="button primary" onClick={() => setModal('convite')}><Plus size={16}/>Criar convite de exemplo</button></div>}</section>}
        </div>
        <footer className="page-footer"><span>jogolindo<span className="brand-dot">.</span> <span>Feito para o futebol entre amigos.</span></span><span>Aterro do Flamengo · Rio de Janeiro</span></footer>
      </main>
    </div>
    {modal && <div className="modal-overlay" onClick={() => setModal(null)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e => e.stopPropagation()}><div className="panel-heading"><div><h2 id="modal-title">{modal === 'jogador' ? 'Novo jogador' : 'Convidar para a resenha'}</h2><p>Prévia local · dados não serão enviados.</p></div><button className="icon-button" aria-label="Fechar" onClick={() => setModal(null)}><X/></button></div><form onSubmit={submit}><label>Nome completo<input name="nome" required autoFocus placeholder="Como se chama seu amigo?"/></label>{modal === 'jogador' && <label>Apelido<input name="apelido" placeholder="Como é chamado em campo?"/></label>}<label>Categoria<select name="categoria"><option>Mensalista</option><option>Diarista</option></select></label><div className="form-note">{modal === 'convite' ? 'Na versão conectada, o convite terá link individual e validade de 72 horas.' : 'CPF, telefone, e-mail e criação da identidade de login serão incluídos no cadastro conectado.'}</div><button type="submit" className="button primary">{modal === 'jogador' ? 'Adicionar à demonstração' : 'Criar convite de exemplo'}<ArrowUpRight size={16}/></button></form></section></div>}
  </div>;
}
