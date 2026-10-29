import { useRef, useState, type FormEvent } from 'react';
import PasswordField from './PasswordField';
import { createInvite, signupByInvite, paymentLink } from '../lib/n8n/invites';
import type { OwnerSession } from '../lib/n8n/owner';
import { formatCurrency } from '../lib/utils';

/** A mesma conta OWNER recebe uma cobrança; não cria outro CPF nem concede aptidão. */
export default function OwnerEnrollment({session,token,onDone}:{session:OwnerSession;token:string;onDone:()=>void}) {
 const requestId=useRef(crypto.randomUUID());const inviteToken=useRef('');const sending=useRef(false);
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [result,setResult]=useState<{payment_id:string;invoice_url?:string}|null>(null);
 const profile=session.meu_cadastro,club=session.pelada;
 if(!profile||!club)return <p role="alert">Consulte seu cadastro e selecione a pelada antes de concluir sua inscrição.</p>;
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(sending.current||!profile||!club)return;
  const form=e.currentTarget;const password=String(new FormData(form).get('senha')||'');
  sending.current=true;setBusy(true);setError('');
  try {
   if(!inviteToken.current){
    const invite=await createInvite(token,{apelido:profile.apelido,whatsapp:profile.telefone,tipo:'MENSALISTA'},requestId.current,club.id);
    const link=new URL(invite.link_convite||'');inviteToken.current=new URLSearchParams(link.hash.split('?')[1]||'').get('token')||'';
    if(!/^[a-f0-9]{64}$/i.test(inviteToken.current))throw new Error('A inscrição foi reservada, mas o link não está disponível. Confira o convite existente antes de tentar novamente.');
   }
   const response=await signupByInvite({token:inviteToken.current,nome:profile.nome,apelido:profile.apelido,cpf:profile.cpf,telefone:profile.telefone,email:profile.email,senha:password,confirmacao_senha:password,com_colete:false});
   setResult(response);form.reset();
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível confirmar sua mensalidade. Confira os registros antes de repetir.');}
  finally{sending.current=false;setBusy(false);}
 }
 return <section className="entry-explanation"><h2>Minha inscrição como mensalista</h2><p>Você continuará como OWNER e pagará {formatCurrency(club.mensalidade)} de mensalidade. A liberação para jogar depende do pagamento.</p>{result?<><p role="status">Mensalidade registrada. Aguardando pagamento.</p>{paymentLink(result.invoice_url)&&<a className="button primary" href={paymentLink(result.invoice_url)} target="_blank" rel="noopener noreferrer">Abrir minha cobrança</a>}<button className="button light" onClick={onDone}>Voltar à pelada e atualizar</button></>:<form onSubmit={submit}><PasswordField label="Confirme sua senha de acesso para gerar a mensalidade" name="senha" required minLength={8} maxLength={128} autoComplete="current-password" disabled={busy}/><button className="button primary" disabled={busy}>{busy?'Registrando…':'Gerar minha mensalidade'}</button></form>}{error&&<p role="alert">{error}</p>}</section>;
}
