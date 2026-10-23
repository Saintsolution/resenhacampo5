import { useEffect, useState } from 'react';
import BackButton from './BackButton';
import { kindLabel, validateInvite, type PublicInvite } from '../lib/n8n/invites';
import { formatDateTime } from '../lib/utils';
import { formatGameDate } from '../lib/matchDate';

export default function InvitationAccess({onHome}:{onHome:()=>void}) {
 const [token]=useState(()=>new URLSearchParams(location.hash.split('?')[1]||'').get('token')||'');
 const [data,setData]=useState<PublicInvite|null>(null);const [error,setError]=useState('');
 useEffect(()=>{history.replaceState(null,'','#/convite');if(!/^[a-f0-9]{64}$/i.test(token)){setError('Abra o link original recebido pelo WhatsApp.');return;}
  let active=true;void validateInvite(token).then(r=>{if(active)setData(r.convite);}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Não foi possível validar o convite.');});return()=>{active=false;};
 },[token]);
 return <div className="demo-entry"><section className="entry-card"><BackButton onClick={onHome}/><img src="/marca_resenha.jpg" alt="Resenha FC"/><div className="eyebrow">VOCÊ FOI CONVIDADO</div><h1>{data?`Olá, ${data.apelido}!`:'Seu convite para a resenha'}</h1>{error?<p role="alert">{error}</p>:!data?<p role="status">Conferindo seu convite…</p>:<><div className="entry-explanation"><strong>{data.pelada.nome}</strong><span>{data.pelada.local}<br/>{kindLabel(data.tipo)}<br/>Convite de {data.convidador}<br/>{data.data_jogo&&<>{formatGameDate(data.data_jogo)} · {data.pelada.hora_inicio} às {data.pelada.hora_fim}<br/></>}Válido até {formatDateTime(data.expira_em)}</span></div><p className="setup-notice">Seu convite está válido. O cadastro pelo convite será liberado na próxima etapa. Nenhuma inscrição ou cobrança foi realizada.</p></>}</section></div>;
}
