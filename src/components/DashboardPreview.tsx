import { useState } from 'react';
import AccessPanel from './AccessPanel';
import MatchBoard from './MatchBoard';
import type { OwnerSession } from '../lib/n8n/owner';

const participants = [
 {participante_id:'example-a',apelido:'Organizador exemplo',categoria:'Mensalista',papel_administrativo:'OWNER',situacao:'ativo',apto:true},
 {participante_id:'example-b',apelido:'Jogador exemplo',categoria:'Mensalista',papel_administrativo:'',situacao:'ativo',apto:true},
 {participante_id:'example-c',apelido:'Mensalista exemplo',categoria:'Mensalista',papel_administrativo:'',situacao:'ativo',apto:false},
 {participante_id:'example-d',apelido:'Diarista exemplo',categoria:'Diarista',papel_administrativo:'',situacao:'ativo',apto:false},
];
const club={id:'example-club',nome:'Pelada · prévia de interface',local:'Campo de exemplo',cidade:'',dia_semana:6,horario_inicio:'09:00',horario_fim:'10:00',mensalidade:30,diaria_sem_colete:15,diaria_com_colete:20,colete_avulso:5,vencimento_mensal:10,validade_convite_horas:72};
const session:OwnerSession={autenticado:true,participante_id:'example-a',nome:'Organizador exemplo',papel_administrativo:'OWNER',categoria:'Mensalista',expira_em:'2099-01-01T00:00:00Z',pelada:club,peladas:[club],proxima_partida:{data:'2026-10-31',participantes:participants,total_aptos:2},meu_cadastro:{nome:'Organizador Exemplo',apelido:'Organizador',cpf:'Não informado na prévia',telefone:'',email:'exemplo@example.invalid',contato_editavel:true},jogadores:participants.map(p=>({...p,nome:p.apelido,cpf:'Não informado na prévia',telefone:'Não informado',email:'exemplo@example.invalid',cobrancas:[{payment_id:'example-'+p.participante_id,tipo:p.categoria==='Diarista'?'DIARIA':'MENSALIDADE',competencia:'2026-10',vencimento:'2026-10-31',valor:p.categoria==='Diarista'?15:30,status:p.apto?'RECEIVED':'PENDING'}]})),minhas_cobrancas:[{payment_id:'example-payment',tipo:'MENSALIDADE',competencia:'2026-10',vencimento:'2026-10-31',valor:30,status:'RECEIVED'}],total_jogadores:4};
/** Disponível apenas no servidor de desenvolvimento. Nenhuma requisição a dados reais. */
export default function DashboardPreview(){
 const [view,setView]=useState('Organização');const [notice,setNotice]=useState('');
 return <><div className="preview-banner"><strong>PRÉVIA · DADOS FICTÍCIOS</strong><span>Não representa os dois jogadores reais da planilha.</span><nav>{['Organização','Jogador','Lista pública'].map(v=><button className={`button ${view===v?'primary':'light'}`} onClick={()=>setView(v)} key={v}>{v}</button>)}</nav>{notice&&<span role="status">{notice}</span>}</div>{view==='Lista pública'?<div className="demo-entry"><div className="entry-card owner-panel"><MatchBoard name={club.nome} local={club.local} start="09:00" end="10:00" date="2026-10-31" participants={participants}/></div></div>:<AccessPanel previewOnly key={view} session={view==='Jogador'?{...session,participante_id:'example-b',papel_administrativo:'',jogadores:undefined,nome:'Jogador exemplo',meu_cadastro:{...session.meu_cadastro!,nome:'Jogador exemplo',apelido:'Jogador'}}:session} token="" busy={false} message="" error="" onSelect={()=>setNotice('Prévia: os dados reais serão consultados pelo workflow.')} onCreate={()=>setNotice('A criação está disponível no acesso real do OWNER.')} onLogout={()=>setNotice('Você está na prévia local.')} onProfileSaved={()=>setNotice('Prévia sem gravação.')} onEnroll={()=>setNotice('Inscrição disponível no acesso real do OWNER.')}/>}</>;
}
