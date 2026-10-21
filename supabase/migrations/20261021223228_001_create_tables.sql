/*
# JOGOLINDO — Tabelas Base

Cria todas as tabelas do esquema. Políticas RLS virão na migração seguinte.

1. Novas Tabelas
- organizadores: proprietários de peladas
- peladas: configurações de cada pelada
- participantes: vínculo de usuários a peladas
- convites: tokens de inscrição (72h)
- jogos: datas de jogo
- jogo_presencas: presença/fila/aptidão
- goleiros_juizes: profissionais do jogo
- cobrancas: cobranças Asaas
- assinaturas: assinaturas mensais
- eventos_asaas: webhook idempotência
- caixa: movimentações financeiras
- auditoria: log de ações
*/

CREATE TABLE IF NOT EXISTS organizadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  asaas_api_key_enc text,
  asaas_wallet_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS peladas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizador_id uuid NOT NULL REFERENCES organizadores(id) ON DELETE CASCADE,
  nome text NOT NULL,
  local text NOT NULL,
  dia_semana text NOT NULL DEFAULT 'sabado',
  horario_inicio text NOT NULL DEFAULT '09:00',
  horario_fim text NOT NULL DEFAULT '10:00',
  valor_mensalidade numeric(10,2) NOT NULL DEFAULT 30.00,
  valor_diaria_sem_colete numeric(10,2) NOT NULL DEFAULT 15.00,
  valor_diaria_com_colete numeric(10,2) NOT NULL DEFAULT 20.00,
  valor_colete_avulso numeric(10,2) NOT NULL DEFAULT 5.00,
  dia_vencimento_mensal int NOT NULL DEFAULT 10,
  validade_convite_horas int NOT NULL DEFAULT 72,
  horario_corte_mural text NOT NULL DEFAULT '08:50',
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pelada_id uuid NOT NULL REFERENCES peladas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  apelido text NOT NULL,
  cpf text NOT NULL,
  telefone text NOT NULL,
  email text NOT NULL,
  categoria text NOT NULL DEFAULT 'diarista' CHECK (categoria IN ('owner','admin','mensalista','diarista')),
  papel_administrativo text NOT NULL DEFAULT 'nenhum' CHECK (papel_administrativo IN ('owner','admin','nenhum')),
  situacao text NOT NULL DEFAULT 'ativo' CHECK (situacao IN ('ativo','suspenso','removido')),
  apto_financeiro boolean NOT NULL DEFAULT false,
  asaas_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pelada_id, user_id),
  UNIQUE(pelada_id, cpf)
);

CREATE TABLE IF NOT EXISTS convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pelada_id uuid NOT NULL REFERENCES peladas(id) ON DELETE CASCADE,
  convidador_id uuid NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
  convidador_nome text NOT NULL,
  telefone_destino text NOT NULL,
  categoria_destino text NOT NULL DEFAULT 'diarista' CHECK (categoria_destino IN ('mensalista','diarista')),
  token_hash text NOT NULL UNIQUE,
  situacao text NOT NULL DEFAULT 'pendente' CHECK (situacao IN ('pendente','utilizado','expirado','cancelado')),
  emitido_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  utilizado_em timestamptz,
  participante_id uuid REFERENCES participantes(id) ON DELETE SET NULL,
  email_confirmado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jogos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pelada_id uuid NOT NULL REFERENCES peladas(id) ON DELETE CASCADE,
  data date NOT NULL,
  horario_inicio text NOT NULL DEFAULT '09:00',
  horario_fim text NOT NULL DEFAULT '10:00',
  status text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado','em_andamento','finalizado','cancelado')),
  responsavel_fechamento text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jogo_presencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id uuid NOT NULL REFERENCES jogos(id) ON DELETE CASCADE,
  participante_id uuid NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
  pelada_id uuid NOT NULL REFERENCES peladas(id) ON DELETE CASCADE,
  presente boolean NOT NULL DEFAULT false,
  ordem_fila int,
  apto boolean NOT NULL DEFAULT false,
  pagou_no_dia boolean NOT NULL DEFAULT false,
  com_colete boolean NOT NULL DEFAULT false,
  ocorrencias text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(jogo_id, participante_id)
);

CREATE TABLE IF NOT EXISTS goleiros_juizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id uuid NOT NULL REFERENCES jogos(id) ON DELETE CASCADE,
  pelada_id uuid NOT NULL REFERENCES peladas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  funcao text NOT NULL CHECK (funcao IN ('goleiro','juiz')),
  valor_combinado numeric(10,2) NOT NULL DEFAULT 0,
  pagamento_conferido boolean NOT NULL DEFAULT false,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cobrancas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pelada_id uuid NOT NULL REFERENCES peladas(id) ON DELETE CASCADE,
  participante_id uuid NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
  jogo_id uuid REFERENCES jogos(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('mensalidade','diaria','colete_avulso')),
  competencia text,
  vencimento date NOT NULL,
  valor_bruto numeric(10,2) NOT NULL,
  status_asaas text NOT NULL DEFAULT 'pending' CHECK (status_asaas IN ('pending','confirmed','received','overdue','cancelled','refunded')),
  data_pagamento timestamptz,
  valor_recebido numeric(10,2),
  taxa_asaas numeric(10,2),
  valor_liquido numeric(10,2),
  asaas_customer_id text,
  asaas_payment_id text,
  asaas_subscription_id text,
  invoice_url text,
  com_colete boolean NOT NULL DEFAULT false,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pelada_id uuid NOT NULL REFERENCES peladas(id) ON DELETE CASCADE,
  participante_id uuid NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
  asaas_subscription_id text UNIQUE,
  dia_vencimento int NOT NULL DEFAULT 10,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS eventos_asaas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  payment_id text,
  tipo_evento text NOT NULL,
  recebido_em timestamptz NOT NULL DEFAULT now(),
  processado_em timestamptz,
  resultado text,
  tentativas int NOT NULL DEFAULT 0,
  erro_resumido text
);

CREATE TABLE IF NOT EXISTS caixa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pelada_id uuid NOT NULL REFERENCES peladas(id) ON DELETE CASCADE,
  jogo_id uuid REFERENCES jogos(id) ON DELETE SET NULL,
  payment_id text,
  categoria text NOT NULL CHECK (categoria IN ('mensalidade','diaria','colete','goleiro','juiz','estorno','taxa','outro')),
  descricao text,
  valor_entrada numeric(10,2) NOT NULL DEFAULT 0,
  valor_saida numeric(10,2) NOT NULL DEFAULT 0,
  taxa numeric(10,2) NOT NULL DEFAULT 0,
  valor_liquido numeric(10,2) NOT NULL DEFAULT 0,
  situacao text NOT NULL DEFAULT 'confirmado' CHECK (situacao IN ('confirmado','pendente','cancelado')),
  registrado_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pelada_id uuid REFERENCES peladas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acao text NOT NULL,
  detalhe text,
  created_at timestamptz NOT NULL DEFAULT now()
);
