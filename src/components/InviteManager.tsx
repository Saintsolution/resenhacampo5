import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Copy, RefreshCw } from 'lucide-react';
import { createInvite, listInvites, kindLabel, type InviteKind, type InviteRecord, type InviteResult } from '../lib/n8n/invites';
import type { PeladaSetup } from '../lib/n8n/bootstrap';
import { nextGameDate, formatGameDate } from '../lib/matchDate';
import { formatDateTime } from '../lib/utils';

export default function InviteManager({token,club}:{token:string;club:PeladaSetup & {id:string}}) {
 const [items,setItems]=useState<InviteRecord[]>([]);const [loading,setLoading]=useState(false);const [loadError,setLoadError]=useState('');
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [kind,setKind]=useState<InviteKind>('MENSALISTA');const [result,setResult]=useState<InviteResult|null>(null);
 const sending=useRef(false);const requestId=useRef(crypto.randomUUID());
 async function refresh(){setLoading(true);setLoadError('');try{const data=await listInvites(token,club.id);setItems(data.convites);}catch(e){setLoadError(e instanceof Error?e.message:'Não foi possível carregar os convites.');}finally{setLoading(false);}}
 useEffect(()=>{let active=true;setLoading(true);void listInvites(token,club.id).then(data=>{if(active)setItems(data.convites);}).catch(e=>{if(active)setLoadError(e instanceof Error?e.message:'Falha ao consultar convites.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[token,club.id]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(sending.current)return;
  const form=event.currentTarget;const data=new FormData(form);sending.current=true;setBusy(true);setError('');setNotice('');
  try {
   const response=await createInvite(token,{apelido:String(data.get('apelido')||'').trim(),whatsapp:String(data.get('whatsapp')||''),tipo:kind,...(kind==='DIARISTA'?{data_jogo:String(data.get('data_jogo'))}:{})},requestId.current,club.id);
   setResult(response);setItems(current=>[response.convite,...current.filter(i=>i.convite_id!==response.convite.convite_id)]);
   requestId.current=crypto.randomUUID();form.reset();setKind('MENSALISTA');
   if(!response.link_disponivel)setNotice('O convite já está registrado. O link secreto só é exibido na emissão original; não gere outro às cegas.');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível emitir o convite.');}finally{sending.current=false;setBusy(false);}
 }
 async function copy(){if(!result?.link_convite)return;try{await navigator.clipboard.writeText(result.link_convite);setNotice('Link copiado. Envie somente ao participante convidado.');}catch{setNotice('Selecione e copie o link abaixo.');}}
 return <section className="invite-manager"><h2>Convidar jogador</h2><p>Um convite individual, com validade de até {club.validade_convite_horas} horas. Nenhuma mensagem é enviada automaticamente.</p>
 <form className="owner-form" onSubmit={submit}><fieldset disabled={busy}><label>Apelido<input name="apelido" required maxLength={40} placeholder="Ex.: Bacurau"/></label><label>WhatsApp com DDD<input name="whatsapp" type="tel" required maxLength={20} placeholder="DDD + número"/></label><label>Tipo de convite<select value={kind} onChange={e=>setKind(e.target.value as InviteKind)}><option value="MENSALISTA">Mensalista</option><option value="DIARISTA">Diarista</option><option value="ADMIN">Administrador mensalista</option></select></label>{kind==='DIARISTA'&&<label>Data do jogo<input name="data_jogo" type="date" required defaultValue={nextGameDate(club)} min={new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}/><small>Escolha o dia habitual da pelada. O convite vale até o encerramento do jogo, se ocorrer antes do prazo.</small></label>}{kind==='ADMIN'&&<small>O convite será identificado como administrativo. Ele não concede acesso antes da inscrição e das validações do backend.</small>}</fieldset>{error&&<p className="owner-error" role="alert">{error}</p>}<button className="button primary" disabled={busy} type="submit">{busy?'Registrando…':'Gerar convite'}<ArrowUpRight size={16}/></button></form>
 {result?.link_disponivel&&result.link_convite&&result.whatsapp_url&&<div className="entry-explanation"><strong>Convite para {result.convite.apelido}</strong><span>{kindLabel(result.convite.tipo)} · até {formatDateTime(result.convite.expira_em)}</span><a className="button primary" href={result.whatsapp_url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Enviar pelo WhatsApp<ArrowUpRight size={16}/></a><button className="button light" onClick={copy}><Copy size={15}/>Copiar link</button><input className="invite-link" aria-label="Link do convite" value={result.link_convite} readOnly onFocus={e=>e.target.select()}/><small>O link fica disponível nesta tela durante a sessão. Ele não é armazenado no navegador.</small></div>}
 {notice&&<p role="status" className="setup-notice">{notice}</p>}
 <div className="invite-list-heading"><h2>Convites registrados</h2><button className="text-button" disabled={loading} onClick={refresh}><RefreshCw size={14}/>Atualizar</button></div>
 {loading&&<p role="status">Carregando convites…</p>}{loadError&&<p role="alert" className="owner-error">{loadError}</p>}
 {!loading&&!loadError&&!items.length&&<p className="setup-notice">Nenhum convite registrado. Comece convidando seu primeiro participante.</p>}
 {items.map(i=><article className="entry-explanation" key={i.convite_id}><strong>{i.apelido} · {kindLabel(i.tipo)}</strong><span>{i.whatsapp}<br/>Convidado por {i.convidador_nome}<br/>{i.data_jogo&&<>{formatGameDate(i.data_jogo)}<br/></>}Situação: {i.situacao==='ABERTO'?'Convidado':i.situacao==='UTILIZADO'?'Utilizado':i.situacao==='EXPIRADO'?'Expirado':i.situacao}<br/>Validade: {formatDateTime(i.expira_em)}</span></article>)}
 </section>;
}
