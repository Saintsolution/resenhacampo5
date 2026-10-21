/*
# JOGOLINDO — RLS: Financeiro (Cobrancas, Assinaturas, Eventos, Caixa) + Auditoria + Índices + Funções

1. Segurança
- cobrancas: owner/admin/participante próprio veem; owner/admin inserem/editam
- assinaturas: idem
- eventos_asaas: owner vê; anon pode inserir (webhook); owner atualiza
- caixa: owner/admin veem/inserem; owner edita/deleta
- auditoria: owner/admin veem; authenticated insere próprios
*/

ALTER TABLE cobrancas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_cobrancas_owner_admin_self" ON cobrancas;
CREATE POLICY "select_cobrancas_owner_admin_self" ON cobrancas FOR SELECT
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR participante_id IN (SELECT id FROM participantes WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = cobrancas.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "insert_cobrancas_owner_admin" ON cobrancas;
CREATE POLICY "insert_cobrancas_owner_admin" ON cobrancas FOR INSERT
  TO authenticated WITH CHECK (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = cobrancas.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "update_cobrancas_owner_admin" ON cobrancas;
CREATE POLICY "update_cobrancas_owner_admin" ON cobrancas FOR UPDATE
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = cobrancas.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_cobrancas_owner_admin" ON cobrancas;
CREATE POLICY "delete_cobrancas_owner_admin" ON cobrancas FOR DELETE
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
  );

ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_assinaturas_owner_admin_self" ON assinaturas;
CREATE POLICY "select_assinaturas_owner_admin_self" ON assinaturas FOR SELECT
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR participante_id IN (SELECT id FROM participantes WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = assinaturas.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "insert_assinaturas_owner_admin" ON assinaturas;
CREATE POLICY "insert_assinaturas_owner_admin" ON assinaturas FOR INSERT
  TO authenticated WITH CHECK (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = assinaturas.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "update_assinaturas_owner_admin" ON assinaturas;
CREATE POLICY "update_assinaturas_owner_admin" ON assinaturas FOR UPDATE
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = assinaturas.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_assinaturas_owner_admin" ON assinaturas;
CREATE POLICY "delete_assinaturas_owner_admin" ON assinaturas FOR DELETE
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
  );

ALTER TABLE eventos_asaas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_eventos_owner" ON eventos_asaas;
CREATE POLICY "select_eventos_owner" ON eventos_asaas FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM organizadores WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_eventos_public" ON eventos_asaas;
CREATE POLICY "insert_eventos_public" ON eventos_asaas FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_eventos_owner" ON eventos_asaas;
CREATE POLICY "update_eventos_owner" ON eventos_asaas FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM organizadores WHERE user_id = auth.uid())
  ) WITH CHECK (true);

ALTER TABLE caixa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_caixa_owner_admin" ON caixa;
CREATE POLICY "select_caixa_owner_admin" ON caixa FOR SELECT
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = caixa.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "insert_caixa_owner_admin" ON caixa;
CREATE POLICY "insert_caixa_owner_admin" ON caixa FOR INSERT
  TO authenticated WITH CHECK (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = caixa.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "update_caixa_owner" ON caixa;
CREATE POLICY "update_caixa_owner" ON caixa FOR UPDATE
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_caixa_owner" ON caixa;
CREATE POLICY "delete_caixa_owner" ON caixa FOR DELETE
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid())
  ));

ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_auditoria_owner_admin" ON auditoria;
CREATE POLICY "select_auditoria_owner_admin" ON auditoria FOR SELECT
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = auditoria.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "insert_auditoria_auth" ON auditoria;
CREATE POLICY "insert_auditoria_auth" ON auditoria FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_participantes_pelada ON participantes(pelada_id);
CREATE INDEX IF NOT EXISTS idx_participantes_user ON participantes(user_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_pelada ON cobrancas(pelada_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_participante ON cobrancas(participante_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON cobrancas(status_asaas);
CREATE INDEX IF NOT EXISTS idx_jogos_pelada ON jogos(pelada_id);
CREATE INDEX IF NOT EXISTS idx_convites_pelada ON convites(pelada_id);
CREATE INDEX IF NOT EXISTS idx_presencas_jogo ON jogo_presencas(jogo_id);
