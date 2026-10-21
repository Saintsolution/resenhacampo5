import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Categoria = 'owner' | 'admin' | 'mensalista' | 'diarista';
export type PapelAdmin = 'owner' | 'admin' | 'nenhum';
export type Situacao = 'ativo' | 'suspenso' | 'removido';
export type StatusAsaas =
  | 'pending'
  | 'confirmed'
  | 'received'
  | 'overdue'
  | 'cancelled'
  | 'refunded';
export type TipoCobranca = 'mensalidade' | 'diaria' | 'colete_avulso';
export type StatusJogo = 'agendado' | 'em_andamento' | 'finalizado' | 'cancelado';
export type FuncaoProfissional = 'goleiro' | 'juiz';
export type SituacaoConvite = 'pendente' | 'utilizado' | 'expirado' | 'cancelado';

export interface Organizador {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  asaas_api_key_enc: string | null;
  asaas_wallet_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pelada {
  id: string;
  organizador_id: string;
  nome: string;
  local: string;
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  valor_mensalidade: number;
  valor_diaria_sem_colete: number;
  valor_diaria_com_colete: number;
  valor_colete_avulso: number;
  dia_vencimento_mensal: number;
  validade_convite_horas: number;
  horario_corte_mural: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface Participante {
  id: string;
  pelada_id: string;
  user_id: string | null;
  nome: string;
  apelido: string;
  cpf: string;
  telefone: string;
  email: string;
  categoria: Categoria;
  papel_administrativo: PapelAdmin;
  situacao: Situacao;
  apto_financeiro: boolean;
  asaas_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Convite {
  id: string;
  pelada_id: string;
  convidador_id: string;
  convidador_nome: string;
  telefone_destino: string;
  categoria_destino: 'mensalista' | 'diarista';
  token_hash: string;
  situacao: SituacaoConvite;
  emitido_em: string;
  expira_em: string;
  utilizado_em: string | null;
  participante_id: string | null;
  email_confirmado_em: string | null;
  created_at: string;
}

export interface Jogo {
  id: string;
  pelada_id: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  status: StatusJogo;
  responsavel_fechamento: string | null;
  observacoes: string | null;
  created_at: string;
}

export interface JogoPresenca {
  id: string;
  jogo_id: string;
  participante_id: string;
  pelada_id: string;
  presente: boolean;
  ordem_fila: number | null;
  apto: boolean;
  pagou_no_dia: boolean;
  com_colete: boolean;
  ocorrencias: string | null;
  updated_at: string;
}

export interface GoleiroJuiz {
  id: string;
  jogo_id: string;
  pelada_id: string;
  nome: string;
  funcao: FuncaoProfissional;
  valor_combinado: number;
  pagamento_conferido: boolean;
  observacoes: string | null;
  created_at: string;
}

export interface Cobranca {
  id: string;
  pelada_id: string;
  participante_id: string;
  jogo_id: string | null;
  tipo: TipoCobranca;
  competencia: string | null;
  vencimento: string;
  valor_bruto: number;
  status_asaas: StatusAsaas;
  data_pagamento: string | null;
  valor_recebido: number | null;
  taxa_asaas: number | null;
  valor_liquido: number | null;
  asaas_customer_id: string | null;
  asaas_payment_id: string | null;
  asaas_subscription_id: string | null;
  invoice_url: string | null;
  com_colete: boolean;
  atualizado_em: string;
  created_at: string;
}

export interface Assinatura {
  id: string;
  pelada_id: string;
  participante_id: string;
  asaas_subscription_id: string | null;
  dia_vencimento: number;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface Caixa {
  id: string;
  pelada_id: string;
  jogo_id: string | null;
  payment_id: string | null;
  categoria: string;
  descricao: string | null;
  valor_entrada: number;
  valor_saida: number;
  taxa: number;
  valor_liquido: number;
  situacao: string;
  registrado_por: string | null;
  created_at: string;
}

export interface ParticipanteComRelacoes extends Participante {
  pelada?: Pelada;
}

export interface CobrancaComParticipante extends Cobranca {
  participante?: Pick<Participante, 'id' | 'nome' | 'apelido'>;
}
