/*
# JOGOLINDO — RLS: Participantes e Convites

Habilita RLS e cria políticas para participantes e convites.

1. Segurança
- participantes: membros veem participantes de suas peladas; owner/admin inserem/editam
- convites: leitura pública (para validação por token); inserção por membros; update por owner/admin
*/

ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_participantes_member" ON participantes;
CREATE POLICY "select_participantes_member" ON participantes FOR SELECT
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR pelada_id IN (SELECT pelada_id FROM participantes p2 WHERE p2.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_participantes_owner_admin" ON participantes;
CREATE POLICY "insert_participantes_owner_admin" ON participantes FOR INSERT
  TO authenticated WITH CHECK (
    pelada_id IN (
      SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = participantes.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "update_participantes_owner_admin_self" ON participantes;
CREATE POLICY "update_participantes_owner_admin_self" ON participantes FOR UPDATE
  TO authenticated USING (
    user_id = auth.uid()
    OR pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = participantes.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  ) WITH CHECK (
    user_id = auth.uid()
    OR pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = participantes.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "delete_participantes_owner_admin" ON participantes;
CREATE POLICY "delete_participantes_owner_admin" ON participantes FOR DELETE
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = participantes.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  );

ALTER TABLE convites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_convites_public" ON convites;
CREATE POLICY "select_convites_public" ON convites FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_convites_member" ON convites;
CREATE POLICY "insert_convites_member" ON convites FOR INSERT
  TO authenticated WITH CHECK (
    convidador_id IN (SELECT id FROM participantes WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_convites_owner_admin" ON convites;
CREATE POLICY "update_convites_owner_admin" ON convites FOR UPDATE
  TO authenticated USING (
    pelada_id IN (SELECT id FROM peladas WHERE organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid()))
    OR convidador_id IN (SELECT id FROM participantes WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM participantes p2
      WHERE p2.pelada_id = convites.pelada_id
        AND p2.user_id = auth.uid()
        AND p2.papel_administrativo IN ('owner','admin')
    )
  ) WITH CHECK (true);
