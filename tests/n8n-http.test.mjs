import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/n8n/http.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { createN8nClient, N8nHttpError } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
// URLs e caminhos abaixo são fixtures locais; nenhum endpoint real é acessado.
const base = 'https://backend.example/approved/';

test('não faz chamadas ao criar o cliente e rejeita bases inseguras', () => {
  let called = false;
  createN8nClient(base, async () => { called = true; });
  assert.equal(called, false);
  for (const url of ['http://backend.example', 'https://user:secret@backend.example', 'https://backend.example/?secret=x', 'https://backend.example/#x']) {
    assert.throws(() => createN8nClient(url), N8nHttpError);
  }
});

test('rejeita caminhos externos e travessia antes de chamar fetch', async () => {
  let calls = 0;
  const client = createN8nClient(base, async () => { calls++; });
  for (const path of ['', '/external', '//other.example', 'https://other.example', '../outside', '%2e%2e/outside', 'back\\slash', 'fixture#fragment']) {
    await assert.rejects(client.request(path), N8nHttpError);
  }
  assert.equal(calls, 0);
});

test('envia JSON sem credenciais, redirects, cache ou tentativas automáticas', async () => {
  let calls = 0;
  const client = createN8nClient(base, async (url, init) => {
    calls++;
    assert.equal(url, `${base}fixture`);
    assert.equal(init.method, 'POST');
    assert.equal(init.credentials, 'omit');
    assert.equal(init.redirect, 'error');
    assert.equal(init.cache, 'no-store');
    assert.equal(init.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(init.body), { exemplo: true });
    assert.ok(init.signal instanceof AbortSignal);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  });
  assert.deepEqual(await client.request('fixture', { method: 'POST', body: { exemplo: true } }), { ok: true });
  assert.equal(calls, 1);
});

test('erros HTTP preservam status sem expor o conteúdo do backend', async () => {
  let calls = 0;
  const client = createN8nClient(base, async () => { calls++; return new Response('private detail', { status: 403 }); });
  await assert.rejects(client.request('fixture'), error => error instanceof N8nHttpError && error.status === 403 && !error.message.includes('private detail'));
  assert.equal(calls, 1);
});

test('trata 204 e rejeita HTML ou GET com corpo', async () => {
  assert.equal(await createN8nClient(base, async () => new Response(null, { status: 204 })).request('fixture'), undefined);
  await assert.rejects(createN8nClient(base, async () => new Response('<html/>')).request('fixture'), N8nHttpError);
  await assert.rejects(createN8nClient(base).request('fixture', { body: {} }), N8nHttpError);
});

test('encaminha cancelamento fornecido pelo chamador', async () => {
  const controller = new AbortController();
  controller.abort();
  const client = createN8nClient(base, async (_url, init) => {
    assert.equal(init.signal, controller.signal);
    init.signal.throwIfAborted();
  });
  await assert.rejects(client.request('fixture', { signal: controller.signal }), { name: 'AbortError' });
});
