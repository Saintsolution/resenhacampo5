import PeladaFields from './PeladaFields';
import AccessPanel from './AccessPanel';
import InvitationAccess from './InvitationAccess';
import BackButton from './BackButton';
import Landing from './Landing';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { validateCPF } from '../lib/utils';
import { bootstrapConfigured, initialPelada, registerPelada, validatePelada, type BootstrapPayload, type PeladaSetup } from '../lib/n8n/bootstrap';
import { ownerRequest, validAppSession, type OwnerSession } from '../lib/n8n/owner';

type Screen = 'inicio' | 'cadastro' | 'pelada' | 'login' | 'convite';
const fromHash = (): Screen => location.hash.startsWith('#/convite') ? 'convite' : location.hash === '#/criar-pelada' ? 'cadastro' : location.hash === '#/entrar' || location.hash === '#/admin' ? 'login' : 'inicio';

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
  const [addingPelada,setAddingPelada] = useState(false);
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
        if (!validAppSession(session)) throw new Error('Seu perfil não tem acesso autorizado.');
        if (!Array.isArray(session.peladas) && !session.pelada) throw new Error('Atualize o workflow 11 para carregar suas peladas.');
        form.reset(); setAddingPelada(false); setAuth({ token: login.token_sessao, session });
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
  async function selectPelada(id: string) {
    if (!auth || submitting.current) return;
    submitting.current=true; setBusy(true); setError(''); setMessage('');
    try {
      const session=await ownerRequest<OwnerSession>('sessao',{token:auth.token,peladaId:id});
      if (!validAppSession(session) || session.pelada?.id!==id) throw new Error('A seleção da pelada não foi confirmada.');
      setAuth({token:auth.token,session});
    } catch(e) { setError(e instanceof Error?e.message:'Não foi possível selecionar a pelada.'); }
    finally {submitting.current=false;setBusy(false);}
  }
  async function createAnotherPelada(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!auth || auth.session.papel_administrativo!=='OWNER' || submitting.current) return;
    const problem=validatePelada(pelada); if(problem) {setError(problem);return;}
    submitting.current=true;setBusy(true);setError('');setMessage('');
    try {
      const created=await ownerRequest<{codigo:string;pelada_id:string}>('peladas',{token:auth.token,body:{pelada},requestId:requestId.current});
      if(created.codigo!=='PELADA_CRIADA' || !created.pelada_id) throw new Error('Confira o cadastro antes de repetir.');
      const session=await ownerRequest<OwnerSession>('sessao',{token:auth.token,peladaId:created.pelada_id});
      if (!session.autenticado || session.papel_administrativo!=='OWNER' || session.pelada?.id!==created.pelada_id) throw new Error('A pelada foi criada, mas sua consulta não foi confirmada. Entre novamente antes de criar outra.');
      setAuth({token:auth.token,session});setAddingPelada(false);requestId.current=crypto.randomUUID();setMessage('Pelada criada e selecionada.');
    } catch(e) {setError(e instanceof Error?e.message:'Não foi possível confirmar a criação. Confira os registros antes de repetir.');}
    finally {submitting.current=false;setBusy(false);}
  }
  function field(key: keyof PeladaSetup, value: string) { setPelada(p=>({...p,[key]:typeof initialPelada[key]==='number'?(value===''?NaN:Number(value)):value})); }
  async function logout() {
    if (!auth) return;
    setBusy(true); setError('');
    try { await ownerRequest('logout', { token: auth.token }); setAuth(null); setScreen('login'); setMessage('Sessão encerrada no servidor.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível revogar a sessão.'); }
    finally { setBusy(false); }
  }
  if (screen === 'convite' && !auth) return <InvitationAccess onHome={()=>change('inicio')}/>;
  if (screen === 'inicio' && !auth) return <Landing onCreate={()=>{setPelada({...initialPelada});change('cadastro');}} onLogin={()=>change('login')} onDemo={onDemo}/>;
  if (auth && auth.session.papel_administrativo==='OWNER' && (addingPelada || !auth.session.pelada)) return <div className="demo-entry"><section className="entry-card owner-panel">
    <h1>Criar outra pelada</h1><p>Olá, {auth.session.nome}.</p>
    <form className="owner-form" onSubmit={createAnotherPelada}><PeladaFields value={pelada} onField={field} disabled={busy}/>
      {error && <p role="alert">{error}</p>}<button className="button primary" disabled={busy}>{busy?'Salvando…':'Criar pelada'}</button>
    </form><button className="button light" disabled={busy} onClick={()=>{setAddingPelada(false);setError('');}}>Voltar ao painel</button>
    <button className="text-button" disabled={busy} onClick={logout}>Sair</button>
  </section></div>;
  if (auth) return <AccessPanel key={auth.session.pelada?.id || auth.session.participante_id} session={auth.session} token={auth.token} busy={busy} message={message} error={error}
    onSelect={id=>void selectPelada(id)} onLogout={()=>void logout()}
    onCreate={()=>{if(auth.session.papel_administrativo!=='OWNER')return;setPelada({...initialPelada});requestId.current=crypto.randomUUID();setAddingPelada(true);setError('');setMessage('');}}
    onProfileSaved={profile=>setAuth(current=>current?{...current,session:{...current.session,meu_cadastro:profile}}:null)}/>;

  return <div className="demo-entry"><section className="entry-card"><BackButton disabled={busy} onClick={()=>change('inicio')}/><div className="eyebrow">JOGOLINDO</div><h1>{screen === 'cadastro' ? 'Seus dados de organizador' : screen === 'pelada' ? 'Crie sua pelada' : screen === 'login' ? 'Entrar na minha pelada' : 'A resenha começa aqui.'}</h1><p>{screen==='login'?'Um acesso para organizar e jogar.':'Cadastre sua conta e configure sua pelada.'}</p>{screen === 'inicio' ? <><button className="button primary" onClick={() => change('login')}>Entrar na minha pelada<ArrowUpRight size={17}/></button><button className="button light" onClick={() => change('cadastro')}>Criar minha pelada</button><button className="text-button" onClick={onDemo}>Explorar demonstração com dados fictícios</button><small>Cadastro inicial exclusivo do responsável, com código de ativação.</small></> : screen === 'pelada' && organizer ? <>
      <p className="setup-progress">Etapa 2 de 2 · Revise os dados antes de salvar</p>
      <form className="owner-form" onSubmit={submitPelada}>
        <PeladaFields value={pelada} onField={field} disabled={busy}/>
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
