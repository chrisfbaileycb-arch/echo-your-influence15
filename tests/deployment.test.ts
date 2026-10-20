import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ownerGate } from '../src/lib/owner-gate.server.ts';
import { installBrowserKeys, saveBrowserKeys } from '../src/lib/browser-keys.ts';

test('owner gate protects APIs and validates signed cookies and write origins', async () => {
  process.env.OWNER_PASSWORD = 'test-only-password';
  assert.equal((await ownerGate(new Request('https://echo.test/health')))?.status, 200);
  assert.equal((await ownerGate(new Request('https://echo.test/welcome')))?.status, 200);
  assert.equal((await ownerGate(new Request('https://echo.test/api/cloud/data/products')))?.status, 401);
  const login = await ownerGate(new Request('https://echo.test/owner-login', {
    method: 'POST', headers: { origin: 'https://echo.test' }, body: 'password=test-only-password',
  }));
  assert.equal(login?.status, 303);
  const cookie = login!.headers.get('set-cookie')!.split(';')[0];
  assert.equal(await ownerGate(new Request('https://echo.test/dashboard', { headers: { cookie } })), null);
  assert.equal((await ownerGate(new Request('https://echo.test/api/cloud/data/products', {
    method: 'POST', headers: { cookie, origin: 'https://evil.test' },
  })))?.status, 403);
  assert.equal((await ownerGate(new Request('https://echo.test/api/cloud/data/products', {
    headers: { cookie: cookie + 'x' },
  })))?.status, 401);
  delete process.env.OWNER_PASSWORD;
  assert.equal((await ownerGate(new Request('https://echo.test/dashboard')))?.status, 503);
});

test('browser keys attach only to same-origin workflow requests and disconnect immediately', async () => {
  const storage = new Map<string, string>();
  const calls: Array<{ input: unknown; init?: RequestInit }> = [];
  Object.assign(globalThis, {
    sessionStorage: { getItem: (key: string) => storage.get(key) || null, setItem: (key: string, value: string) => storage.set(key, value) },
    window: { location: { href: 'https://echo.test/dashboard', origin: 'https://echo.test' }, fetch: async (input: unknown, init?: RequestInit) => {
      calls.push({ input, init }); return new Response('{}');
    } },
  });
  installBrowserKeys();
  saveBrowserKeys({ gemini: 'test-key-never-real' });
  await window.fetch('/_server/test', { method: 'POST' });
  assert.equal(new Headers(calls.at(-1)?.init?.headers).get('x-echo-key-gemini'), 'test-key-never-real');
  assert.equal(calls.at(-1)?.init?.redirect, 'error');
  await window.fetch('https://external.test/api/data');
  assert.equal(new Headers(calls.at(-1)?.init?.headers).has('x-echo-key-gemini'), false);
  await window.fetch('/assets/image.png');
  assert.equal(new Headers(calls.at(-1)?.init?.headers).has('x-echo-key-gemini'), false);
  saveBrowserKeys({});
  await window.fetch('/api/cloud/functions/test');
  assert.equal(new Headers(calls.at(-1)?.init?.headers).has('x-echo-key-gemini'), false);
});

test('workspace writes persist and reload from the mounted data directory', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'echo-storage-'));
  process.env.RAILWAY_VOLUME_MOUNT_PATH = directory;
  try {
    const { cloudStore } = await import('../src/lib/cloud/store.server.ts?first');
    cloudStore.upsertDoc('profiles', 'test-profile', { email: 'test@example.test' });
    const { cloudStore: reloaded } = await import('../src/lib/cloud/store.server.ts?second');
    assert.equal(reloaded.getCollection('profiles').find(item => item.id === 'test-profile')?.email, 'test@example.test');
    reloaded.deleteDoc('profiles', 'test-profile');
    assert.equal(reloaded.getCollection('profiles').some(item => item.id === 'test-profile'), false);
  } finally {
    delete process.env.RAILWAY_VOLUME_MOUNT_PATH;
    rmSync(directory, { recursive: true });
  }
});
