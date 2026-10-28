import { useEffect, useState, type FormEvent } from 'react';
import PasswordField from './PasswordField';
import BackButton from './BackButton';
import { kindLabel, validateInvite, signupByInvite, paymentLink, type PublicInvite, type InviteSignupResult } from '../lib/n8n/invites';
import { formatDateTime, validateCPF } from '../lib/utils';
import { formatGameDate } from '../lib/matchDate';

export default function InvitationAccess({onHome}:{onHome:()=>void}) {
 const [token]=useState(()=>new URLSearchParams(location.hash.split('?')[1]||'').get('token')||'');
 const [data,setData]=useState<PublicInvite|null>(null);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState<InviteSignupResult|null>(null);
 useEffect(()=>{history.replaceState(null,'','#/convite');if(!/^[a-f0-9]{64}$/i.test(token)){setError('Abra o link original recebido pelo WhatsApp.');return;}
  let active=true;void validateInvite(token).then(r=>{if(active)setData(r.convite);}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Não foi possível validar o convite.');});return()=>{active=false;};
 },[token]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||!data)return;
  const form=event.currentTarget,fields=new FormData(form),get=(key:string)=>String(fields.get(key)||'');
  const cpf=get('cpf').replace(/\D/g,'');
  if(!validateCPF(cpf)){setError('Informe um CPF válido.');return;}
  if(get('senha')!==get('confirmacao_senha')){setError('A confirmação da senha deve ser igual à senha.');return;}
  setError('');setBusy(true);
  try{
   const response=await signupByInvite({token,nome:get('nome').trim(),apelido:get('apelido').trim(),cpf,telefone:get('telefone'),email:get('email').trim(),senha:get('senha'),confirmacao_senha:get('confirmacao_senha'),com_colete:fields.get('com_colete')==='sim'});
   form.reset();setResult(response);
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível confirmar a inscrição. Confira com o organizador antes de repetir.');}
  finally{setBusy(false);}
 }
 const invoice=paymentLink(result?.invoice_url),boleto=paymentLink(result?.bank_slip_url);
 return <div className="demo-entry"><section className="entry-card">
  <BackButton disabled={busy} onClick={onHome}/><img src="/marca_resenha.jpg" alt="Resenha FC"/>
  <div className="eyebrow">{result?'SUA INSCRIÇÃO':'VOCÊ FOI CONVIDADO'}</div>
  <h1>{result?'Cadastro registrado':data?`Olá, ${data.apelido}!`:'Seu convite para a resenha'}</h1>
  {result?<>
   <div className="entry-explanation"><strong>{data?.pelada.nome}</strong><span>Seu cadastro e sua cobrança foram registrados. A participação será liberada após a confirmação do pagamento.</span></div>
   {invoice&&<a className="button primary" href={invoice} target="_blank" rel="noopener noreferrer">Abrir cobrança no Asaas</a>}
   {boleto&&<a className="button light" href={boleto} target="_blank" rel="noopener noreferrer">Ver boleto</a>}
   {!invoice&&!boleto&&<p>Peça ao organizador o link da cobrança já registrada. Não é necessário cadastrar novamente.</p>}
   <small>A confirmação depende do retorno do Asaas. Abrir o boleto não confirma o pagamento.</small>
  </>:<>
   {error&&!data&&<p role="alert">{error}</p>}
   {!data?!error&&<p role="status">Conferindo seu convite…</p>:<>
    <div className="entry-explanation"><strong>{data.pelada.nome}</strong><span>{data.pelada.local}<br/>{kindLabel(data.tipo)}<br/>Convite de {data.convidador}<br/>{data.data_jogo&&<>{formatGameDate(data.data_jogo)} · {data.pelada.hora_inicio} às {data.pelada.hora_fim}<br/></>}Válido até {formatDateTime(data.expira_em)}</span></div>
    <form className="owner-form" onSubmit={submit} onInvalidCapture={()=>setError('Confira os campos obrigatórios e o formato do e-mail antes de continuar.')}>
     <fieldset disabled={busy} style={{border:0,padding:0,margin:0,display:'contents'}}>
      <label>Nome completo<input name="nome" required maxLength={150} autoComplete="name"/></label>
      <label>Apelido<input name="apelido" required maxLength={40} autoComplete="nickname" defaultValue={data.apelido}/></label>
      <label>CPF<input name="cpf" required inputMode="numeric" maxLength={14} autoComplete="off"/></label>
      <label>WhatsApp que recebeu o convite<input name="telefone" type="tel" required maxLength={20} autoComplete="tel"/></label>
      <label>E-mail<input name="email" type="email" required maxLength={180} autoComplete="email"/></label>
      <PasswordField label="Senha" name="senha" required minLength={8} maxLength={128} autoComplete="new-password" disabled={busy}/>
      <PasswordField label="Confirme a senha" name="confirmacao_senha" required minLength={8} maxLength={128} autoComplete="new-password" disabled={busy}/>
      {data.tipo==='DIARISTA'&&<label>Uso de colete<select name="com_colete" defaultValue="nao"><option value="nao">Sem colete</option><option value="sim">Com colete</option></select></label>}
      <small>Ao continuar, será emitida uma cobrança real no Asaas, conforme os valores cadastrados da pelada.</small>
      {error&&<p className="owner-error" role="alert">{error}</p>}
      <button className="button primary" type="submit">{busy?'Registrando e preparando sua cobrança…':'Cadastrar e gerar cobrança'}</button>
     </fieldset>
    </form>
    {busy&&<p role="status">Aguarde a confirmação. Não feche esta página nem envie novamente.</p>}
   </>}
  </>}
 </section></div>;
}
