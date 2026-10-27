import PeladaFields from './PeladaFields';
import AccessPanel from './AccessPanel';
import InvitationAccess from './InvitationAccess';
import PasswordField from './PasswordField';
import BackButton from './BackButton';
import Landing from './Landing';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { validateCPF } from '../lib/utils';
import { initialPelada, validatePelada, type PeladaSetup } from '../lib/n8n/bootstrap';
import { ownerRequest, registerOwner, validAppSession, type OwnerSession } from '../lib/n8n/owner';

type Screen = 'inicio' | 'cadastro' | 'login' | 'convite';
const fromHash = (): Screen => location.hash.startsWith('#/cadastrar-owner') ? 'cadastro' : location.hash.startsWith('#/convite') ? 'convite' : ['#/entrar', '#/admin', '#/criar-pelada'].includes(location.hash) ? 'login' : 'inicio';

export default function OwnerAccess({ onDemo }: { onDemo: () => void }) {
  const [screen, setScreen] = useState<Screen>(fromHash);
  const [ownerInvite, setOwnerInvite] = useState(() => location.hash.startsWith('#/cadastrar-owner') ? new URLSearchParams(location.hash.split('?')[1] || '').get('convite') || '' : '');
  const [pelada, setPelada] = useState<PeladaSetup>({ ...initialPelada });
  const requestId = useRef(crypto.randomUUID());
  const submitting = useRef(false);
  const [addingPelada, setAddingPelada] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [auth, setAuth] = useState<{ token: string; session: OwnerSession } | null>(null);
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);
  useEffect(() => {
    // O token fica somente em memória; não permanece no endereço nem no armazenamento.
    if (location.hash.startsWith('#/cadastrar-owner?')) history.replaceState(null, '', '#/cadastrar-owner');
    const onHash = () => {
      if (location.hash.startsWith('#/cadastrar-owner?')) {
        setOwnerInvite(new URLSearchParams(location.hash.split('?')[1] || '').get('convite') || '');
        history.replaceState(null, '', '#/cadastrar-owner');
      }
      setScreen(fromHash()); setError(''); setMessage('');
    };
    window.addEventListener('hashchange', onHash); window.addEventListener('popstate', onHash);
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('popstate', onHash); };
  }, []);
  useEffect(() => {
    if (!auth) return;
    const delay = Date.parse(auth.session.expira_em) - Date.now();
    if (!Number.isFinite(delay) || delay <= 0) { setAuth(null); return; }
    const timer = window.setTimeout(() => { setAuth(null); setAddingPelada(false); setError('Sessão expirada. Entre novamente.'); setScreen('login'); }, delay);
    return () => window.clearTimeout(timer);
  }, [auth]);
  function change(next: Screen) {
    if (busy) return;
    history.pushState(null, '', next === 'login' ? '#/entrar' : '#/');
    requestId.current = crypto.randomUUID(); setScreen(next); setError(''); setMessage('');
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submitting.current) return;
    const form = event.currentTarget, values = new FormData(form);
    const get = (key: string) => String(values.get(key) || '');
    const cpf = get('cpf').replace(/\D/g, '');
    if (!validateCPF(cpf)) { setError('Informe um CPF válido.'); return; }
    if (screen === 'cadastro') {
      if (!/^[a-f0-9]{64}$/i.test(ownerInvite)) { setError('Abra seu convite exclusivo de organizador.'); return; }
      if (get('senha') !== get('confirmacao_senha')) { setError('As senhas precisam ser iguais.'); return; }
      if (get('nome').trim().split(/\s+/).length < 2 || !get('apelido').trim() || !/^\d{10,13}$/.test(get('telefone').replace(/\D/g, ''))) { setError('Confira nome completo, apelido e WhatsApp com DDD.'); return; }
    }
    submitting.current = true; setBusy(true); setError(''); setMessage('');
    try {
      if (screen === 'cadastro') {
        await registerOwner({ nome: get('nome').trim(), apelido: get('apelido').trim(), cpf, email: get('email').trim(), telefone: get('telefone'), categoria: '', senha: get('senha'), confirmacao_senha: get('confirmacao_senha') }, ownerInvite, requestId.current);
        form.reset(); setOwnerInvite(''); requestId.current = crypto.randomUUID();
        history.replaceState(null, '', '#/entrar'); setScreen('login');
        setMessage('Conta de organizador salva. Entre com seu CPF e senha para criar sua pelada.');
      } else {
        const login = await ownerRequest<{ token_sessao: string }>('login', { body: { cpf, senha: get('senha') } });
        if (!/^[a-f0-9]{64}$/i.test(login.token_sessao)) throw new Error('O servidor não retornou uma sessão válida.');
        const session = await ownerRequest<OwnerSession>('sessao', { token: login.token_sessao });
        if (!validAppSession(session)) throw new Error('Seu perfil não tem acesso autorizado.');
        if (!Array.isArray(session.peladas) && !session.pelada) throw new Error('Não foi possível carregar suas peladas. Confira a atualização do workflow de sessão.');
        form.reset(); setAddingPelada(false); setPelada({ ...initialPelada }); setAuth({ token: login.token_sessao, session });
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  async function selectPelada(id: string) {
    if (!auth || submitting.current) return;
    submitting.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const session = await ownerRequest<OwnerSession>('sessao', { token: auth.token, peladaId: id });
      if (!validAppSession(session) || session.pelada?.id !== id) throw new Error('A seleção da pelada não foi confirmada.');
      setAuth({ token: auth.token, session });
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível selecionar a pelada.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  async function createPelada(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!auth || auth.session.papel_administrativo !== 'OWNER' || submitting.current) return;
    const problem = validatePelada(pelada); if (problem) { setError(problem); return; }
    submitting.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const created = await ownerRequest<{ codigo: string; pelada_id: string }>('peladas', { token: auth.token, body: { pelada }, requestId: requestId.current });
      if (created.codigo !== 'PELADA_CRIADA' || !created.pelada_id) throw new Error('Confira o cadastro antes de repetir.');
      const session = await ownerRequest<OwnerSession>('sessao', { token: auth.token, peladaId: created.pelada_id });
      if (!validAppSession(session) || session.papel_administrativo !== 'OWNER' || session.pelada?.id !== created.pelada_id) throw new Error('A pelada foi criada, mas sua consulta não foi confirmada. Entre novamente antes de criar outra.');
      setAuth({ token: auth.token, session }); setAddingPelada(false); requestId.current = crypto.randomUUID(); setMessage('Pelada criada e selecionada.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível confirmar a criação. Confira os registros antes de repetir.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  function field(key: keyof PeladaSetup, value: string) { setPelada(p => ({ ...p, [key]: typeof initialPelada[key] === 'number' ? (value === '' ? NaN : Number(value)) : value })); }
  async function logout() {
    if (!auth || submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    try { await ownerRequest('logout', { token: auth.token }); setAuth(null); setAddingPelada(false); setScreen('login'); history.replaceState(null, '', '#/entrar'); setMessage('Sessão encerrada.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível revogar a sessão.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  if (screen === 'convite' && !auth) return <InvitationAccess onHome={() => change('inicio')}/>;
  if (screen === 'inicio' && !auth) return <Landing onLogin={() => change('login')} onDemo={onDemo}/>;
  if (auth && auth.session.papel_administrativo === 'OWNER' && addingPelada) return <div className="demo-entry"><section className="entry-card owner-panel">
    <h1>{auth.session.pelada ? 'Criar outra pelada' : 'Criar minha pelada'}</h1><p>Olá, {auth.session.nome}.</p>
    <form className="owner-form" onSubmit={createPelada}><PeladaFields value={pelada} onField={field} disabled={busy}/>
      {error && <p role="alert">{error}</p>}<button className="button primary" disabled={busy}>{busy ? 'Salvando…' : 'Criar pelada'}</button>
    </form><button className="button light" disabled={busy} onClick={() => { setAddingPelada(false); setError(''); }}>Voltar ao painel</button>
    <button className="text-button" disabled={busy} onClick={logout}>Sair</button>
  </section></div>;
  if (auth) return <AccessPanel key={auth.session.pelada?.id || auth.session.participante_id} session={auth.session} token={auth.token} busy={busy} message={message} error={error}
    onSelect={id => void selectPelada(id)} onLogout={() => void logout()}
    onCreate={() => { if (auth.session.papel_administrativo !== 'OWNER') return; setPelada({ ...initialPelada }); requestId.current = crypto.randomUUID(); setAddingPelada(true); setError(''); setMessage(''); }}
    onProfileSaved={profile => setAuth(current => current ? { ...current, session: { ...current.session, meu_cadastro: profile } } : null)}/>;
  const registration = screen === 'cadastro', invited = /^[a-f0-9]{64}$/i.test(ownerInvite);
  return <div className="demo-entry"><section className="entry-card"><BackButton disabled={busy} onClick={() => change('inicio')}/><div className="eyebrow">JOGOLINDO</div>
    <h1>{registration ? 'Cadastrar organizador' : 'Entrar na minha pelada'}</h1>
    <p>{registration ? 'Sua conta é salva antes de criar a pelada.' : 'Um acesso para organizar e jogar.'}</p>
    {registration && !invited ? <p role="alert">O cadastro de organizador está disponível somente pelo convite exclusivo recebido no WhatsApp.</p> : <form className="owner-form" onSubmit={submit} key={screen}>
      {registration && <><label>Nome completo<input name="nome" required maxLength={150} autoComplete="name"/></label><label>Apelido<input name="apelido" required maxLength={40} autoComplete="nickname"/></label></>}
      <label>CPF<input name="cpf" required inputMode="numeric" maxLength={14} autoComplete="off"/></label>
      {registration && <><label>E-mail<input name="email" type="email" required maxLength={254} autoComplete="email"/></label><label>WhatsApp que recebeu o convite<input name="telefone" type="tel" required maxLength={20} autoComplete="tel"/></label></>}
      <PasswordField label="Senha" name="senha" required minLength={registration ? 8 : 1} maxLength={128} autoComplete={registration ? 'new-password' : 'current-password'} disabled={busy}/>
      {registration && <PasswordField label="Confirmação de senha" name="confirmacao_senha" required minLength={8} maxLength={128} autoComplete="new-password" disabled={busy}/>}
      {error && <p className="owner-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
      <button className="button primary" disabled={busy} type="submit">{busy ? 'Aguarde…' : registration ? 'Salvar minha conta' : 'Entrar'}<ArrowUpRight size={17}/></button>
    </form>}
  </section></div>;
}
