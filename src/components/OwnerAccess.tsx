import { nextGameDate, formatGameDate } from '../lib/matchDate';
import { formatCurrency } from '../lib/utils';
import BackButton from './BackButton';
import Landing from './Landing';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, LogOut, ShieldCheck } from 'lucide-react';
import { validateCPF } from '../lib/utils';
import { bootstrapConfigured, initialPelada, registerPelada, validatePelada, type BootstrapPayload, type PeladaSetup } from '../lib/n8n/bootstrap';
import { ownerRequest, type OwnerSession } from '../lib/n8n/owner';

type Screen = 'inicio' | 'cadastro' | 'pelada' | 'login';
const fromHash = (): Screen => location.hash === '#/criar-pelada' ? 'cadastro' : location.hash === '#/entrar' || location.hash === '#/admin' ? 'login' : 'inicio';

export default function OwnerAccess({ onDemo }: { onDemo: () => void }) {
  const [screen, setScreen] = useState<Screen>(fromHash);
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);
  const [organizer, setOrganizer] = useState<BootstrapPayload['organizador'] | null>(null);
  const [pelada, setPelada] = useState<PeladaSetup>({ ...initialPelada });
  const requestId = useRef(crypto.randomUUID());
  const submitting = useRef(false);
  useEffect(() => {
    const onHash = () => { setScreen(fromHash()); setOrganizer(null); setError(''); setMessage(''); };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onHash);
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('popstate', onHash); };
  }, []);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [auth, setAuth] = useState<{ token: string; session: OwnerSession } | null>(null);
  useEffect(() => {
    if (!auth) return;
    const delay = Date.parse(auth.session.expira_em) - Date.now();
    if (!Number.isFinite(delay) || delay <= 0) { setAuth(null); return; }
    const timer = window.setTimeout(() => { setAuth(null); setError('Sessão expirada. Entre novamente.'); setScreen('login'); }, delay);
    return () => window.clearTimeout(timer);
  }, [auth]);
  function change(next: Screen) {
    if (busy) return;
    const hash=next==='cadastro' || next==='pelada' ? '#/criar-pelada' : next==='login' ? '#/entrar' : '#/';
    history.pushState(null, '', hash);
    if(next==='inicio' || next==='login') { setOrganizer(null); requestId.current=crypto.randomUUID(); }
    setScreen(next); setError(''); setMessage('');
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const get = (key: string) => String(values.get(key) || '');
    const cpf = get('cpf').replace(/\D/g, '');
    if (!validateCPF(cpf)) { setError('Informe um CPF válido.'); return; }
    if (screen === 'cadastro' && get('senha') !== get('confirmacao_senha')) { setError('As senhas precisam ser iguais.'); return; }
    if (screen === 'cadastro') {
      if (get('nome').trim().split(/\s+/).length < 2 || !get('apelido').trim() || !/^\d{10,13}$/.test(get('telefone').replace(/\D/g,''))) { setError('Confira nome completo, apelido e telefone com DDD.'); return; }
      setOrganizer({ nome:get('nome').trim(),apelido:get('apelido').trim(),cpf,email:get('email').trim(),telefone:get('telefone'),categoria:get('categoria'),senha:get('senha'),confirmacao_senha:get('confirmacao_senha') });
      change('pelada'); return;
    }
    submitting.current=true; setBusy(true); setError(''); setMessage('');
    try {
        const login = await ownerRequest<{ token_sessao: string }>('login', { body: { cpf, senha: get('senha') } });
        if (!/^[a-f0-9]{64}$/i.test(login.token_sessao)) throw new Error('O n8n não retornou uma sessão válida.');
        const session = await ownerRequest<OwnerSession>('sessao', { token: login.token_sessao });
        if (!session.autenticado || session.papel_administrativo !== 'OWNER') throw new Error('Este acesso é exclusivo do organizador.');
        if (!session.pelada) throw new Error('A sessão foi validada, mas a pelada não foi carregada. Importe o workflow 11 atualizado.');
        form.reset(); setAuth({ token: login.token_sessao, session });
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir.'); }
    finally { submitting.current=false; setBusy(false); }
  }
  async function submitPelada(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(submitting.current || !organizer) return;
    const problem=validatePelada(pelada); if(problem) {setError(problem);return;}
    const form=event.currentTarget;
    const activation=String(new FormData(form).get('ativacao') || '');
    submitting.current=true;setBusy(true);setError('');
    try {
      await registerPelada({organizador:organizer,pelada},activation,requestId.current);
      form.reset();setOrganizer(null);history.replaceState(null,'','#/entrar');setScreen('login');requestId.current=crypto.randomUUID();setMessage('Conta e pelada criadas. Entre com seu CPF e senha.');
    } catch(e) {setError(e instanceof Error ? e.message : 'Não foi possível concluir o cadastro.');}
    finally {submitting.current=false;setBusy(false);}
  }
  function field(key: keyof PeladaSetup, value: string) { setPelada(p=>({...p,[key]:typeof initialPelada[key]==='number'?Number(value):value})); }
  async function logout() {
    if (!auth) return;
    setBusy(true); setError('');
    try { await ownerRequest('logout', { token: auth.token }); setAuth(null); setScreen('login'); setMessage('Sessão encerrada no servidor.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível revogar a sessão.'); }
    finally { setBusy(false); }
  }
  if (screen === 'inicio' && !auth) return <Landing onCreate={()=>change('cadastro')} onLogin={()=>change('login')} onAdmin={()=>{change('login');history.replaceState(null,'','#/admin');}} onDemo={onDemo}/>;
  if (auth && auth.session.pelada) {
    const club=auth.session.pelada;
    return <div className="demo-entry"><section className="entry-card owner-panel"><img src="/marca_resenha.jpg" alt="Resenha FC"/><div className="eyebrow">PAINEL DO ORGANIZADOR</div><h1>{club.nome}</h1><p>Olá, {auth.session.nome}.</p><div className="entry-explanation"><strong><ShieldCheck size={18}/> OWNER · {auth.session.categoria || 'Somente organização'}</strong><span>{club.local}{club.cidade && <><br/>{club.cidade}</>}</span></div><div className="entry-explanation"><strong>Próxima pelada</strong><span>{formatGameDate(nextGameDate(club))}<br/>{club.horario_inicio} às {club.horario_fim}</span><strong>{auth.session.total_jogadores ?? '—'} jogadores ativos cadastrados</strong></div><div className="entry-explanation"><strong>Valores cadastrados</strong><span>Mensalidade: {formatCurrency(club.mensalidade)}<br/>Diária sem colete: {formatCurrency(club.diaria_sem_colete)}<br/>Diária com colete: {formatCurrency(club.diaria_com_colete)}<br/>Colete avulso: {formatCurrency(club.colete_avulso)}<br/>Vencimento mensal: dia {club.vencimento_mensal}<br/>Convites: {club.validade_convite_horas} horas</span></div><small>Dados carregados da sua pelada. Convites e os demais módulos serão conectados após validarmos este primeiro acesso.</small>{error && <p role="alert">{error}</p>}<button className="button primary" disabled={busy} onClick={logout}><LogOut size={17}/>{busy ? 'Encerrando…' : 'Sair'}</button></section></div>;
  }

  return <div className="demo-entry"><section className="entry-card"><BackButton disabled={busy} onClick={()=>change('inicio')}/><img src="/marca_resenha.jpg" alt="Resenha FC"/><div className="eyebrow">RESENHA FUTEBOL CAMPO 5</div><h1>{screen === 'cadastro' ? 'Seus dados de organizador' : screen === 'pelada' ? 'Crie sua pelada' : screen === 'login' ? location.hash === '#/admin' ? 'Acesso administrativo' : 'Entrar na minha pelada' : 'A resenha começa aqui.'}</h1><p>Aterro do Flamengo · Campo 5<br/>Sábados, das 09h às 10h</p>{screen === 'inicio' ? <><button className="button primary" onClick={() => change('login')}>Entrar na minha pelada<ArrowUpRight size={17}/></button><button className="button light" onClick={() => change('cadastro')}>Criar minha pelada</button><button className="text-button" onClick={onDemo}>Explorar demonstração com dados fictícios</button><small>Cadastro inicial exclusivo do responsável, com código de ativação.</small></> : screen === 'pelada' && organizer ? <>
      <p className="setup-progress">Etapa 2 de 2 · Revise os dados antes de salvar</p>
      <form className="owner-form" onSubmit={submitPelada}>
        <fieldset disabled={busy}><legend>Local e horário</legend>
          {(['nome','local','cidade'] as const).map(key=><label key={key}>{key==='nome'?'Nome da pelada':key==='local'?'Local':'Cidade'}<input required maxLength={150} value={pelada[key]} onChange={e=>field(key,e.target.value)}/></label>)}
          <label>Dia da semana<select value={pelada.dia_semana} onChange={e=>field('dia_semana',e.target.value)}>{['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'].map((day,i)=><option key={day} value={i}>{day}</option>)}</select></label>
          <div className="setup-grid"><label>Horário inicial<input required type="time" value={pelada.horario_inicio} onChange={e=>field('horario_inicio',e.target.value)}/></label><label>Horário final<input required type="time" value={pelada.horario_fim} onChange={e=>field('horario_fim',e.target.value)}/></label></div>
        </fieldset>
        <fieldset disabled={busy}><legend>Valores e regras</legend><div className="setup-grid">
          {([['mensalidade','Mensalidade'],['diaria_sem_colete','Diária sem colete'],['diaria_com_colete','Diária com colete'],['colete_avulso','Colete avulso']] as const).map(([key,label])=><label key={key}>{label} (R$)<input required type="number" min="0" max="100000" step="0.01" value={pelada[key]} onChange={e=>field(key,e.target.value)}/></label>)}
          <label>Dia do vencimento<input required type="number" min="1" max="28" step="1" value={pelada.vencimento_mensal} onChange={e=>field('vencimento_mensal',e.target.value)}/></label><label>Validade do convite (horas)<input required type="number" min="1" max="720" step="1" value={pelada.validade_convite_horas} onChange={e=>field('validade_convite_horas',e.target.value)}/></label>
        </div></fieldset>
        <label>Código de ativação<input name="ativacao" type="password" required maxLength={256} autoComplete="off" disabled={busy}/></label>
        <small>Cadastro inicial exclusivo do responsável. Sua conta e a configuração da pelada serão enviadas juntas.</small>
        {!bootstrapConfigured && <p className="setup-notice" role="status">Configure a conexão de cadastro para salvar a conta e a pelada. Enquanto isso, você pode revisar todos os campos; nenhum dado será enviado.</p>}
        {error && <p className="owner-error" role="alert">{error}</p>}
        <button className="button primary" disabled={busy || !bootstrapConfigured} type="submit">{busy?'Salvando…':'Criar conta e pelada'}<ArrowUpRight size={17}/></button>
      </form><button className="text-button" disabled={busy} onClick={()=>change('cadastro')}>Voltar aos meus dados</button><button className="text-button" disabled={busy} onClick={()=>change('inicio')}>Cancelar cadastro</button>
    </> : <><form className="owner-form" onSubmit={submit} key={screen}>
      {screen === 'cadastro' && <><p className="setup-progress">Etapa 1 de 2 · Seus dados</p><label>Nome completo<input name="nome" required maxLength={150} autoComplete="name" defaultValue={organizer?.nome}/></label><label>Apelido<input name="apelido" required maxLength={40} autoComplete="nickname" defaultValue={organizer?.apelido}/></label></>}
      <label>CPF<input name="cpf" required inputMode="numeric" maxLength={14} autoComplete="off" defaultValue={screen==='cadastro'?organizer?.cpf:undefined}/></label>
      {screen === 'cadastro' && <><label>E-mail<input name="email" type="email" required maxLength={254} autoComplete="email" defaultValue={organizer?.email}/></label><label>Telefone / WhatsApp<input name="telefone" type="tel" required maxLength={20} autoComplete="tel" defaultValue={organizer?.telefone}/></label></>}
      {screen === 'cadastro' && <label>Participação na pelada<select name="categoria" defaultValue={organizer?.categoria || ''}><option value="">Somente organização</option><option value="Mensalista">Mensalista</option><option value="Diarista">Diarista</option></select><small>Seu acesso de OWNER independe da categoria e de pagamento.</small></label>}
      <label>Senha<input name="senha" type="password" required minLength={screen === 'cadastro' ? 8 : 1} maxLength={128} autoComplete={screen === 'cadastro' ? 'new-password' : 'current-password'} defaultValue={screen==='cadastro'?organizer?.senha:undefined}/></label>
      {screen === 'cadastro' && <><label>Confirmação de senha<input name="confirmacao_senha" type="password" required minLength={8} maxLength={128} autoComplete="new-password" defaultValue={organizer?.confirmacao_senha}/></label></>}
      {error && <p className="owner-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
      <button className="button primary" disabled={busy} type="submit">{busy ? 'Aguarde…' : screen === 'cadastro' ? 'Continuar para minha pelada' : 'Entrar'}<ArrowUpRight size={17}/></button>
    </form></>}
  </section></div>;
}
