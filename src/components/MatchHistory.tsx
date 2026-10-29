import { useState } from 'react';
import MatchBoard from './MatchBoard';
import type { MatchParticipant } from '../lib/n8n/owner';
export interface HistoricalMatch { data:string; participantes:MatchParticipant[] }
export default function MatchHistory({name,local,start,end,matches}:{name:string;local:string;start:string;end:string;matches?:HistoricalMatch[]}) {
 const [date,setDate]=useState('');const selected=matches?.find(m=>m.data===date);
 return <section className="match-history"><span className="eyebrow">MEMÓRIA DA RESENHA</span><h2>Partidas anteriores</h2><p>Consulte os participantes de uma partida pela data.</p><label>Data da partida<input aria-label="Pesquisar partida por data" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>{!date?<p>Selecione a data que deseja consultar.</p>:matches===undefined?<p role="status">O histórico ainda precisa ser conectado. Nenhum registro antigo foi carregado.</p>:!selected?<p role="status">Não há partida registrada para essa data.</p>:<MatchBoard key={date} name={name} local={local} start={start} end={end} date={date} participants={selected.participantes}/>}
 </section>;
}
