import type { OwnerRegistration } from './owner';

export interface PeladaSetup {
  nome: string; local: string; cidade: string; dia_semana: number;
  horario_inicio: string; horario_fim: string;
  mensalidade: number; diaria_sem_colete: number; diaria_com_colete: number;
  colete_avulso: number; vencimento_mensal: number; validade_convite_horas: number;
}
export const initialPelada: PeladaSetup = {
  nome: '', local: '', cidade: '', dia_semana: -1,
  horario_inicio: '', horario_fim: '', mensalidade: NaN, diaria_sem_colete: NaN,
  diaria_com_colete: NaN, colete_avulso: NaN, vencimento_mensal: NaN, validade_convite_horas: NaN,
};
export interface BootstrapPayload { organizador: OwnerRegistration & { apelido: string }; pelada: PeladaSetup }
export function validatePelada(p: PeladaSetup): string | null {
  if (![p.nome,p.local,p.cidade].every(s => s.trim() && s.length <= 150)) return 'Preencha nome, local e cidade.';
  if (!Number.isInteger(p.dia_semana) || p.dia_semana < 0 || p.dia_semana > 6) return 'Selecione o dia da semana.';
  if (![p.horario_inicio,p.horario_fim].every(t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)) || p.horario_fim <= p.horario_inicio) return 'O horário final deve ser posterior ao inicial.';
  if (![p.mensalidade,p.diaria_sem_colete,p.diaria_com_colete,p.colete_avulso].every(v=>Number.isFinite(v) && v>=0 && v<=100000 && Math.abs(v*100-Math.round(v*100))<0.000001)) return 'Confira os valores: use até duas casas decimais.';
  if (!Number.isInteger(p.vencimento_mensal) || p.vencimento_mensal<1 || p.vencimento_mensal>28) return 'O vencimento deve ser entre os dias 1 e 28.';
  if (!Number.isInteger(p.validade_convite_horas) || p.validade_convite_horas<1 || p.validade_convite_horas>720) return 'A validade do convite deve ser de 1 a 720 horas.';
  return null;
}
export const bootstrapConfigured = Boolean(import.meta.env.VITE_N8N_BOOTSTRAP_URL);
/** Uma única chamada para OWNER + PELADAS. Não reutilizar o endpoint legado de OWNER isolado. */
export async function registerPelada(body: BootstrapPayload, activation: string, requestId: string) {
  const address = import.meta.env.VITE_N8N_BOOTSTRAP_URL;
  if (!address) throw new Error('O formulário está pronto. Falta configurar a URL do webhook de criação da conta e da pelada. Nenhum dado foi enviado.');
  const url = new URL(address);
  if (url.protocol!=='https:' || url.username || url.password || url.search || url.hash) throw new Error('Configure a URL HTTPS do webhook de criação da pelada.');
  const error=validatePelada(body.pelada); if(error) throw new Error(error);
  let response: Response;
  try {
    response = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json',Accept:'application/json','X-RC5-Ativacao':activation,'Idempotency-Key':requestId}, body:JSON.stringify(body), credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000) });
  } catch { throw new Error('Não foi possível confirmar o cadastro. Confira com o responsável antes de repetir; os dados podem ter sido recebidos.'); }
  if(!response.ok) throw new Error(({401:'Código de ativação inválido.',403:'Cadastro não autorizado.',409:'A pelada ou o organizador já foi cadastrado. Faça login.',429:'Muitas tentativas. Aguarde antes de tentar novamente.'} as Record<number,string>)[response.status] || 'O backend não confirmou a criação da conta e da pelada.');
  const result = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
  if (result?.sucesso!==true || result?.codigo!=='PELADA_CRIADA') throw new Error('O backend não confirmou a operação completa. Confira o cadastro antes de repetir.');
}
