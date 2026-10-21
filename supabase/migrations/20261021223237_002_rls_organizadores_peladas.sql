/*
# JOGOLINDO — RLS: Organizadores e Peladas

Habilita RLS e cria políticas para organizadores e peladas.

1. Segurança
- organizadores: usuário vê/edita apenas seu próprio registro
- peladas: owner vê/edita apenas suas peladas; participantes veem peladas às quais pertencem
*/

ALTER TABLE organizadores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_organizador" ON organizadores;
CREATE POLICY "select_own_organizador" ON organizadores FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_organizador" ON organizadores;
CREATE POLICY "insert_own_organizador" ON organizadores FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_organizador" ON organizadores;
CREATE POLICY "update_own_organizador" ON organizadores FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE peladas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_peladas_member" ON peladas;
CREATE POLICY "select_peladas_member" ON peladas FOR SELECT
  TO authenticated USING (
    organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid())
    OR id IN (SELECT pelada_id FROM participantes WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_peladas_owner" ON peladas;
CREATE POLICY "insert_peladas_owner" ON peladas FOR INSERT
  TO authenticated WITH CHECK (
    organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_peladas_owner" ON peladas;
CREATE POLICY "update_peladas_owner" ON peladas FOR UPDATE
  TO authenticated USING (
    organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid())
  ) WITH CHECK (
    organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_peladas_owner" ON peladas;
CREATE POLICY "delete_peladas_owner" ON peladas FOR DELETE
  TO authenticated USING (
    organizador_id IN (SELECT id FROM organizadores WHERE user_id = auth.uid())
  );
