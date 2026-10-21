/*
# JOGOLINDO — Funções Auxiliares e Triggers

1. Funções
- update_updated_at(): trigger para atualizar updated_at automaticamente
- get_current_participante(): retorna o participante associado ao usuário autenticado em uma pelada
- expire_old_convites(): marca convites pendentes vencidos como expirados
*/

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_organizadores_updated ON organizadores;
CREATE TRIGGER trg_organizadores_updated
  BEFORE UPDATE ON organizadores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_peladas_updated ON peladas;
CREATE TRIGGER trg_peladas_updated
  BEFORE UPDATE ON peladas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_participantes_updated ON participantes;
CREATE TRIGGER trg_participantes_updated
  BEFORE UPDATE ON participantes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_cobrancas_updated ON cobrancas;
CREATE TRIGGER trg_cobrancas_updated
  BEFORE UPDATE ON cobrancas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_assinaturas_updated ON assinaturas;
CREATE TRIGGER trg_assinaturas_updated
  BEFORE UPDATE ON assinaturas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_presencas_updated ON jogo_presencas;
CREATE TRIGGER trg_presencas_updated
  BEFORE UPDATE ON jogo_presencas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION get_current_participante(p_pelada_id uuid)
RETURNS TABLE (
  id uuid,
  nome text,
  apelido text,
  categoria text,
  papel_administrativo text,
  situacao text,
  apto_financeiro boolean,
  user_id uuid
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT id, nome, apelido, categoria, papel_administrativo, situacao, apto_financeiro, user_id
  FROM participantes
  WHERE pelada_id = p_pelada_id AND user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION expire_old_convites()
RETURNS void
LANGUAGE sql
AS $$
  UPDATE convites
  SET situacao = 'expirado'
  WHERE situacao = 'pendente' AND expira_em < now();
$$;
