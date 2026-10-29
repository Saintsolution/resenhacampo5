import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Printer, RefreshCw, Users } from 'lucide-react';
import type { MatchParticipant } from '../lib/n8n/owner';
import { formatGameDate } from '../lib/matchDate';

type Check = { presente: boolean; chegada: string; pagamento: boolean };
const rank = (p: MatchParticipant) => ['OWNER','ADMIN'].includes(p.papel_administrativo.toUpperCase()) ? 0 : p.categoria.toUpperCase() === 'MENSALISTA' ? 1 : 2;
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export default function MatchBoard({name,local,date,start,end,participants,admin=false,busy=false,onRefresh}: {
 name:string;local:string;date:string;start:string;end:string;participants?:MatchParticipant[];admin?:boolean;busy?:boolean;onRefresh?:()=>void;
}) {
 const [checks,setChecks]=useState<Record<string,Check>>({});
 const [notice,setNotice]=useState('');
 const sorted=useMemo(()=>participants ? [...participants].sort((a,b)=>rank(a)-rank(b)||a.apelido.localeCompare(b.apelido,'pt-BR')) : undefined,[participants]);
 const aptos=sorted?.filter(p=>p.apto).length;
 function change(id:string,field:keyof Check,value:boolean|string){setChecks(current=>{const row=current[id]||{presente:false,chegada:'',pagamento:false};return {...current,[id]:{...row,[field]:value,...(field==='presente'&&value&&!row.chegada?{chegada:new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date())}:{})}};});}
 function print(){
  if(!sorted)return;
  const popup=window.open('','_blank');if(!popup){setNotice('Permita abrir a janela de impressão para salvar o PDF.');return;}
  popup.opener=null;
  const emitted=new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'});
  const rows=sorted.map((p,i)=>{const c=admin?checks[p.participante_id]:undefined;return `<tr><td>${i+1}</td><td>${escape(p.apelido)}</td><td>${escape(p.papel_administrativo ? p.papel_administrativo+' · '+p.categoria : p.categoria)}</td><td>${p.apto?'Apto':'Não apto'}</td><td>${c?.presente?'☑':'☐'}</td><td>${escape(c?.chegada||'____:____')}</td><td>${c?.pagamento?'☑':'☐'}</td></tr>`;}).join('');
  popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Lista do dia — ${escape(name)} — ${escape(date)}</title><style>@page{size:A4 landscape;margin:14mm}body{font:12px Arial;color:#18251d}h1{font-size:24px}table{border-collapse:collapse;width:100%;margin-top:22px}th,td{text-align:left;border:1px solid #bbb;padding:10px}th{background:#eef2eb}small{display:block;margin:10px 0}tr{break-inside:avoid}</style></head><body><h1>${escape(name)}</h1><p>${escape(formatGameDate(date))} · ${escape(start)} às ${escape(end)} · ${escape(local)}</p><small>Emitida em ${escape(emitted)} · ${aptos} aptos / ${sorted.length} participantes. Situação na emissão; novas confirmações aparecem no site.</small><table><thead><tr><th>Nº</th><th>Jogador</th><th>Categoria / função</th><th>Situação</th><th>Chegada ✓</th><th>Horário</th><th>Pagamento conferido ✓</th></tr></thead><tbody>${rows}</tbody></table><small>Anotações em papel devem ser conferidas pelos administradores. O check de conferência não representa uma nova entrada no caixa.</small></body></html>`);
  popup.document.close();popup.focus();popup.print();
 }
 return <section className="day-board" aria-label="Lista da partida"><header className="day-board-heading"><div><span className="eyebrow">A RESENHA DO DIA</span><h2>{name}</h2><p><CalendarDays size={16}/>{formatGameDate(date)}</p><p><Clock3 size={16}/>{start} às {end} · {local}</p></div><div className="day-board-total"><Users size={22}/><strong>{aptos ?? '—'}</strong><span>aptos para jogar</span></div></header>
  <div className="day-board-tools"><div><h3>Lista do dia</h3><p>Administradores · mensalistas · diaristas</p></div><div className="demo-actions">{onRefresh&&<button className="button light" disabled={busy} onClick={onRefresh}><RefreshCw size={16}/>Atualizar</button>}<button className="button light" disabled={!sorted} onClick={print}><Printer size={16}/>Imprimir / salvar PDF</button></div></div>
  {!sorted?<div className="empty" role="status">A lista desta partida ainda não está disponível. Os jogadores aparecerão após a conexão da consulta do jogo.</div>:!sorted.length?<p className="empty">Nenhum participante vinculado a esta partida.</p>:<div className="table-scroll"><table className="day-table"><thead><tr><th>Jogador</th><th>Categoria</th><th>Situação</th>{admin&&<><th>Chegada</th><th>Horário</th><th>Pagamento conferido</th></>}</tr></thead><tbody>{sorted.map(p=>{const c=checks[p.participante_id]||{presente:false,chegada:'',pagamento:false};return <tr key={p.participante_id}><td><strong>{p.apelido}</strong>{p.papel_administrativo&&<small>{p.papel_administrativo}</small>}</td><td>{p.categoria}</td><td><span className={`status ${p.apto?'paid':'pending'}`}>{p.apto&&<CheckCircle2 size={14}/>} {p.apto?'Apto':'Não apto'}</span></td>{admin&&<><td><input type="checkbox" aria-label={`Chegada de ${p.apelido}`} checked={c.presente} onChange={e=>change(p.participante_id,'presente',e.target.checked)}/></td><td><input type="time" aria-label={`Horário de chegada de ${p.apelido}`} value={c.chegada} onChange={e=>change(p.participante_id,'chegada',e.target.value)}/></td><td><input type="checkbox" aria-label={`Pagamento conferido de ${p.apelido}`} checked={c.pagamento} onChange={e=>change(p.participante_id,'pagamento',e.target.checked)}/></td></>}</tr>;})}</tbody></table></div>}
  {admin&&<p className="draft-note">Conferência provisória nesta tela: chegada, horário e checks ainda não são salvos. Use a impressão para guardar suas anotações. Marcar pagamento conferido não altera a aptidão nem o caixa.</p>}{notice&&<p role="status">{notice}</p>}
 </section>;
}
