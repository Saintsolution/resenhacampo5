/*
# JOGOLINDO — RLS: Jogos, Presenças, Goleiros/Juízes

1. Segurança
- jogos: membros veem jogos de suas peladas; owner/admin gerenciam
- jogo_presencas: membros veem; owner/admin gerenciam
- goleiros_juizes: membros veem; owner/admin gerenciam
*/

ALTER TABLE jogos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_jogos_member" ON jogos;
CREATE POLICY "select_jogos_member" ON jogos FOR SELECT
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR pelada_id IN (SELECT pelada_id FROM participantes WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_jogos_owner_admin" ON jogos;
CREATE POLICY "insert_jogos_owner_admin" ON jogos FOR INSERT
  TO authenticated WITH CHECK (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = jogos.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "update_jogos_owner_admin" ON jogos;
CREATE POLICY "update_jogos_owner_admin" ON jogos FOR UPDATE
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = jogos.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_jogos_owner_admin" ON jogos;
CREATE POLICY "delete_jogos_owner_admin" ON jogos FOR DELETE
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = jogos.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );

ALTER TABLE jogo_presencas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_presencas_member" ON jogo_presencas;
CREATE POLICY "select_presencas_member" ON jogo_presencas FOR SELECT
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR pelada_id IN (SELECT pelada_id FROM participantes WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_presencas_owner_admin" ON jogo_presencas;
CREATE POLICY "insert_presencas_owner_admin" ON jogo_presencas FOR INSERT
  TO authenticated WITH CHECK (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = jogo_presencas.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "update_presencas_owner_admin" ON jogo_presencas;
CREATE POLICY "update_presencas_owner_admin" ON jogo_presencas FOR UPDATE
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = jogo_presencas.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_presencas_owner_admin" ON jogo_presencas;
CREATE POLICY "delete_presencas_owner_admin" ON jogo_presencas FOR DELETE
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = jogo_presencas.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );

ALTER TABLE goleiros_juizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_goleiros_juizes_member" ON goleiros_juizes;
CREATE POLICY "select_goleiros_juizes_member" ON goleiros_juizes FOR SELECT
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR pelada_id IN (SELECT pelada_id FROM participantes WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_goleiros_juizes_owner_admin" ON goleiros_juizes;
CREATE POLICY "insert_goleiros_juizes_owner_admin" ON goleiros_juizes FOR INSERT
  TO authenticated WITH CHECK (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = goleiros_juizes.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "update_goleiros_juizes_owner_admin" ON goleiros_juizes;
CREATE POLICY "update_goleiros_juizes_owner_admin" ON goleiros_juizes FOR UPDATE
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = goleiros_juizes.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_goleiros_juizes_owner_admin" ON goleiros_juizes;
CREATE POLICY "delete_goleiros_juizes_owner_admin" ON goleiros_juizes FOR DELETE
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = goleiros_juizes.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );
