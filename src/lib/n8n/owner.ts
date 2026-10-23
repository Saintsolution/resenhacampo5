import type { PeladaSetup } from './bootstrap';
import { n8nBaseUrl } from './config';

export interface OwnerSession {
  autenticado: boolean;
  participante_id: string;
  nome: string;
  papel_administrativo: string;
  expira_em: string;
  categoria?: string;
  pelada?: PeladaSetup & { id: string };
  total_jogadores?: number;
}
export interface OwnerRegistration {
  nome: string; cpf: string; email: string; telefone: string; categoria?: string;
  senha: string; confirmacao_senha: string;
}
const configuredBase = import.meta.env.VITE_N8N_APP_BASE_URL || `${n8nBaseUrl}/webhook/rc5-app-v1`;
export async function ownerRequest<T>(path: 'cadastrar-organizador' | 'login' | 'sessao' | 'logout', options: { body?: unknown; activation?: string; token?: string } = {}): Promise<T> {
  const base = new URL(configuredBase.replace(/\/$/, '') + '/');
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error('Configure a URL HTTPS dos webhooks no aplicativo.');
  let response: Response;
  try {
    response = await fetch(new URL(path, base), {
      method: path === 'sessao' ? 'GET' : 'POST',
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.activation ? { 'X-RC5-Ativacao': options.activation } : {}), ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) },
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: 'no-store', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(20000),
    });
  } catch { throw new Error('Não foi possível acessar o n8n. Confira conexão, publicação dos webhooks e origem permitida. Se enviou um cadastro, confira a planilha antes de repetir.'); }
  const messages: Record<number, string> = { 400: 'Confira os dados informados.', 401: path === 'cadastrar-organizador' ? 'Código de ativação inválido.' : 'CPF ou senha inválidos, ou sessão expirada.', 403: 'Acesso não autorizado para esta origem.', 409: 'O organizador ou esse cadastro já existe. Tente entrar.', 429: 'Muitas tentativas. Aguarde 15 minutos.', 503: 'Confira a configuração no n8n. Se houve gravação, confira a planilha antes de repetir.' };
  if (!response.ok) throw new Error(messages[response.status] || 'O n8n não concluiu a solicitação.');
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Resposta incompatível do webhook.');
  const result = await response.json();
  if (result.sucesso !== true) throw new Error('O backend não confirmou a operação.');
  return result as T;
}
