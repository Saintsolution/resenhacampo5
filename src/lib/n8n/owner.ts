import type { PeladaSetup } from './bootstrap';
import { n8nBaseUrl } from './config';

export interface PersonalProfile {
  nome: string; cpf: string; apelido: string; telefone: string; email: string; contato_editavel: boolean;
}
export interface AdminPlayer {
  participante_id: string; nome: string; apelido: string; cpf: string; telefone: string; email: string;
  categoria: string; papel_administrativo: string; situacao: string;
}
export interface OwnerSession {
  minhas_cobrancas?: { payment_id: string; tipo: string; competencia: string; vencimento: string; valor: number; status: string; invoice_url?: string }[];
  cobrancas_indisponiveis?: boolean;
  autenticado: boolean;
  participante_id: string;
  nome: string;
  papel_administrativo: string;
  expira_em: string;
  categoria?: string;
  pelada?: PeladaSetup & { id: string };
  peladas?: (PeladaSetup & { id: string })[];
  total_jogadores?: number;
  jogadores?: AdminPlayer[];
  total_jogadores_cadastrados?: number;
  total_jogadores_ativos?: number;
  versao_acesso?: number;
  permissoes?: { criar_pelada: boolean; administrar: boolean };
  meu_cadastro?: PersonalProfile;
}
export function validAppSession(session: OwnerSession): boolean {
  return session.autenticado && (['OWNER','ADMIN'].includes(session.papel_administrativo) || (session.papel_administrativo === '' && ['MENSALISTA','DIARISTA'].includes((session.categoria || '').toUpperCase())));
}
export interface OwnerRegistration {
  nome: string; cpf: string; email: string; telefone: string; categoria?: string;
  senha: string; confirmacao_senha: string;
}
const configuredBase = import.meta.env.VITE_N8N_APP_BASE_URL || `${n8nBaseUrl}/webhook/rc5-app-v1`;
export async function ownerRequest<T>(path: 'cadastrar-organizador' | 'login' | 'sessao' | 'logout' | 'convites' | 'validar-convite' | 'inscrever-jogador' | 'peladas' | 'meu-cadastro', options: { body?: unknown; activation?: string; token?: string; method?: 'GET' | 'POST'; requestId?: string; peladaId?: string } = {}): Promise<T> {
  const base = new URL(configuredBase.replace(/\/$/, '') + '/');
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error('Configure a URL HTTPS dos webhooks no aplicativo.');
  let response: Response;
  try {
    const url = new URL(path, base);
    if (options.peladaId) url.searchParams.set('pelada_id', options.peladaId);
    response = await fetch(url, {
      method: options.method ?? (path === 'sessao' ? 'GET' : 'POST'),
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.activation ? { 'X-RC5-Ativacao': options.activation } : {}), ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}), ...(options.requestId ? { 'Idempotency-Key': options.requestId } : {}) },
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: 'no-store', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(path === 'inscrever-jogador' ? 190000 : 20000),
    });
  } catch { throw new Error('Não foi possível acessar o n8n. Confira conexão, publicação dos webhooks e origem permitida. Se enviou um cadastro, confira a planilha antes de repetir.'); }
  const messages: Record<number, string> = { 400: 'Confira os dados informados.', 401: path === 'cadastrar-organizador' ? 'Código de ativação inválido.' : 'CPF ou senha inválidos, ou sessão expirada.', 403: 'Você não tem permissão para esse acesso ou pelada.', 409: 'O organizador ou esse cadastro já existe. Tente entrar.', 429: 'Muitas tentativas. Aguarde 15 minutos.', 503: 'Confira a configuração no n8n. Se houve gravação, confira a planilha antes de repetir.' };
  if (path === 'convites' || path === 'validar-convite') { messages[400]='Confira os dados. O convite pode estar expirado ou já utilizado, ou a data do jogo ser inválida.'; messages[401]='Sua sessão expirou. Entre novamente.'; messages[403]='Você não tem permissão para esse convite.'; messages[409]='Já existe um convite aberto para esse número, tipo e jogo, ou a tentativa foi repetida com dados diferentes.'; }
  if (path === 'inscrever-jogador') { messages[400]='Confira CPF, telefone, senha e validade do convite. Use o WhatsApp que recebeu o convite.'; messages[409]='Cadastro ou cobrança já existente. Confira os registros antes de repetir.'; messages[503]='Não foi possível confirmar a inscrição. Peça ao organizador para conferir o n8n e o Asaas antes de repetir: a cobrança pode já ter sido emitida.'; }
  if (path === 'cadastrar-organizador') { messages[401]='Convite de organizador inválido, expirado ou destinado a outro WhatsApp.'; messages[409]='Conta ou convite já utilizado. Faça login ou confira o cadastro antes de repetir.'; messages[404]='O cadastro de organizador ainda depende da publicação do workflow atualizado.'; }
  if (path === 'meu-cadastro') { messages[400]='Confira apelido, telefone e e-mail.'; messages[403]='Você não tem permissão para essa atualização.'; messages[404]='A atualização de cadastro ainda não está disponível.'; messages[409]='Telefone e e-mail vinculados ao Asaas estão disponíveis somente para consulta nesta etapa.'; messages[503]='Não foi possível confirmar a atualização. Consulte seu cadastro antes de repetir.'; }
  if (!response.ok) throw new Error(messages[response.status] || 'O n8n não concluiu a solicitação.');
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Resposta incompatível do webhook.');
  const result = await response.json();
  if (result.sucesso !== true) throw new Error('O backend não confirmou a operação.');
  return result as T;
}

/** Convite exclusivo de uso único; não envia nem cria uma pelada neste cadastro. */
export async function registerOwner(organizador: OwnerRegistration & { apelido: string }, convite: string, requestId: string) {
  const result = await ownerRequest<{ codigo: string; participante_id: string }>('cadastrar-organizador', { body: { organizador, convite_owner: convite }, requestId });
  if (result.codigo !== 'OWNER_CADASTRADO' || !result.participante_id) throw new Error('O cadastro não foi confirmado. Confira os registros antes de repetir.');
  return result;
}
