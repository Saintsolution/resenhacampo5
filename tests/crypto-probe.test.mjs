import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const requireLocal = createRequire(import.meta.url);
const code = await readFile(new URL('../docs/n8n/crypto-probe.code.txt', import.meta.url), 'utf8');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const probe = new AsyncFunction('require', code);

test('procedimento falha fechado quando módulos estão indisponíveis', async () => {
  const [item] = await probe(() => { throw new Error('private environment detail'); });
  assert.equal(item.json.ready_for_next_review, false);
  assert.equal(item.json.crypto.available, false);
  assert.ok(item.json.password_algorithms.every(x => x.available === false));
  assert.ok(!JSON.stringify(item).includes('private environment detail'));
});

test('crypto local verifica tokens e SHA-256 sem afirmar suporte a senhas no n8n', async () => {
  const [item] = await probe(name => {
    if (name === 'crypto') return requireLocal('node:crypto');
    throw new Error('not installed for this test');
  });
  assert.equal(item.json.crypto.sha256_known_vector_valid, true);
  assert.equal(item.json.crypto.token_hash_repeatable, true);
  assert.equal(item.json.crypto.token_hash_changes, true);
  assert.equal(item.json.crypto.sample_tokens_differ, true);
  assert.equal(item.json.ready_for_next_review, false);
  const output = JSON.stringify(item);
  assert.ok(!output.includes('SOMENTE-TESTE-JogoLindo'));
  assert.ok(!/[a-f0-9]{64}/.test(output));
});
