import type { PeladaSetup } from './n8n/bootstrap';

/** Data civil em São Paulo. Mantém o jogo de hoje até o horário final. */
export function nextGameDate(p: Pick<PeladaSetup,'dia_semana'|'horario_fim'>, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const get=(key:string)=>parts.find(v=>v.type===key)?.value || '';
  const day=new Date(Date.UTC(Number(get('year')),Number(get('month'))-1,Number(get('day'))));
  let delta=(p.dia_semana-day.getUTCDay()+7)%7;
  if(delta===0 && `${get('hour')}:${get('minute')}`>=p.horario_fim)delta=7;
  day.setUTCDate(day.getUTCDate()+delta);
  return day.toISOString().slice(0,10);
}
export function formatGameDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date(`${date}T12:00:00Z`));
}
