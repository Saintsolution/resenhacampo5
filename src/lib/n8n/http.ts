export class N8nHttpError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'N8nHttpError';
  }
}

export interface N8nRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

/** Transporte apenas. Nenhum endpoint, autenticação ou chamada automática é definido aqui. */
export function createN8nClient(baseUrl: string, fetcher: typeof fetch = fetch) {
  const base = new URL(baseUrl);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) {
    throw new N8nHttpError('Configure uma URL base HTTPS sem credenciais, parâmetros ou fragmentos.');
  }
  const prefix = base.pathname.replace(/\/$/, '') + '/';
  base.pathname = prefix;

  return {
    async request<T = unknown>(path: string, options: N8nRequestOptions = {}): Promise<T | undefined> {
      // Caminhos relativos explícitos; rejeita redirecionamento para outros serviços.
      if (!path || path.startsWith('/') || path.includes('\\')) {
        throw new N8nHttpError('Informe um caminho relativo do endpoint aprovado.');
      }
      const url = new URL(path, base);
      if (url.origin !== base.origin || !url.pathname.startsWith(prefix) || url.username || url.password || url.hash) {
        throw new N8nHttpError('Endpoint fora da base configurada.');
      }
      const method = options.method ?? 'GET';
      if (method === 'GET' && options.body !== undefined) {
        throw new N8nHttpError('Uma consulta GET não pode enviar corpo.');
      }
      const response = await fetcher(url.toString(), {
        method,
        headers: { Accept: 'application/json', ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal ?? AbortSignal.timeout(15000),
        // Cookies e proteção CSRF serão definidos com o contrato de sessão.
        credentials: 'omit',
        redirect: 'error',
        cache: 'no-store',
      });
      if (!response.ok) {
        // Não reflete respostas que possam conter detalhes internos ou dados pessoais.
        throw new N8nHttpError('Não foi possível concluir a solicitação.', response.status);
      }
      if (response.status === 204) return undefined;
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        throw new N8nHttpError('O backend retornou uma resposta incompatível.', response.status);
      }
      return response.json() as Promise<T>;
    },
  };
}
