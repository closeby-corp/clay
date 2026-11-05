import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { signAuthToken } from '../../../packages/server/src/auth-cookie';
import { createUploadsApp, type UploadList } from './service';

const README_PATH = new URL('../../../README.md', import.meta.url);
const USER_HEADER = 'X-Prototype-User';
const WINDOW_HEADER = 'X-Prototype-Window';

describe('standalone Clay upload workflow', () => {
  let root: string;
  let dataDir: string;
  let assetsDir: string;
  let baseUrl: string;
  let server: ReturnType<typeof Bun.serve>;
  let secret: string;

  function start() {
    const app = createUploadsApp({ dataDir, assetsDir, secret });
    server = Bun.serve({
      hostname: '127.0.0.1',
      port: 0,
      fetch: (request, server) => app.fetch(request, server.requestIP(request)?.address),
    });
    baseUrl = `http://127.0.0.1:${server.port}`;
  }

  async function login(username = 'alice', password = 'demo-alice', cookie?: string): Promise<string> {
    const requestHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (cookie) requestHeaders.Cookie = cookie;
    const response = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({ username, password }),
    });
    expect(response.status).toBe(200);
    return response.headers.get('set-cookie')!.split(';', 1)[0]!;
  }

  function headers(cookie: string, user = 'alice', window = 'tab-a'): Headers {
    return new Headers({
      Cookie: cookie,
      [USER_HEADER]: user,
      [WINDOW_HEADER]: window,
    });
  }

  async function upload(cookie: string, file: File, window = 'tab-a') {
    return uploadFiles(cookie, [file], window);
  }

  async function uploadFiles(cookie: string, files: File[], window = 'tab-a') {
    const form = new FormData();
    for (const file of files) form.append('files', file);
    return fetch(`${baseUrl}/api/uploads`, {
      method: 'POST',
      headers: headers(cookie, 'alice', window),
      body: form,
    });
  }

  async function list(cookie: string, user = 'alice', window = 'tab-a'): Promise<Response> {
    return fetch(`${baseUrl}/api/uploads`, { headers: headers(cookie, user, window) });
  }

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'clay-mygo-uploads-'));
    dataDir = join(root, 'data');
    assetsDir = join(root, 'assets');
    await mkdir(assetsDir);
    secret = 'test-session-secret';
    start();
  });

  afterEach(async () => {
    server.stop(true);
    await rm(root, { recursive: true, force: true });
  });

  test('health, fixture login, anonymous denial, and static assets including wasm MIME', async () => {
    const health = await fetch(`${baseUrl}/api/health`);
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ status: 'ok' });

    const denied = await fetch(`${baseUrl}/api/uploads`);
    expect(denied.status).toBe(401);
    expect((await denied.json()).error).toBe('Sign in required');

    const cookie = await login();
    expect(cookie.startsWith('clay-mygo-uploads=')).toBe(true);
    expect(await (await fetch(`${baseUrl}/api/session`, { headers: { Cookie: cookie } })).json()).toEqual({
      id: 'alice', name: 'Alice', role: 'user',
    });

    await writeFile(join(assetsDir, 'index.html'), '<main>uploads</main>');
    await writeFile(join(assetsDir, 'app.wasm'), new Uint8Array([0, 97, 115, 109]));
    const html = await fetch(`${baseUrl}/`);
    expect(html.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(await html.text()).toBe('<main>uploads</main>');
    expect((await fetch(`${baseUrl}/app.wasm`)).headers.get('content-type')).toBe('application/wasm');
  });

  test('real README and binary bytes round-trip through upload and attachment download', async () => {
    const cookie = await login();
    const readme = new Uint8Array(await readFile(README_PATH));
    const binary = new Uint8Array([0, 255, 1, 128, 13, 10, 42]);
    const uploaded = await uploadFiles(cookie, [
      new File([readme], 'README.md', { type: 'text/markdown' }),
      new File([binary], 'sample.png', { type: 'image/png' }),
    ]);
    expect(uploaded.status).toBe(201);
    const result = await uploaded.json() as UploadList;
    expect(result.files).toHaveLength(2);
    const readmeFile = result.files.find((file) => file.name === 'README.md')!;
    const imageFile = result.files.find((file) => file.name === 'sample.png')!;
    expect(readmeFile.size).toBe(readme.byteLength);
    expect(readmeFile.uploadedAt).toMatch(/^\d{4}-\d\d-\d\dT.*Z$/);
    expect(Object.keys(readmeFile).sort()).toEqual(['id', 'name', 'size', 'type', 'uploadedAt']);
    expect(result.lifetimeUploads).toBe(2);

    const downloaded = await fetch(`${baseUrl}/api/uploads/${imageFile.id}/content`, { headers: headers(cookie) });
    expect(downloaded.status).toBe(200);
    expect(downloaded.headers.get('content-disposition')).toContain('attachment;');
    expect(new Uint8Array(await downloaded.arrayBuffer())).toEqual(binary);

    const readmeDownload = await fetch(
      `${baseUrl}/api/uploads/${readmeFile.id}/content`,
      { headers: headers(cookie) },
    );
    expect(new Uint8Array(await readmeDownload.arrayBuffer())).toEqual(readme);
  });

  test('accept and 5 MiB limits reject before changing the list or lifetime counter', async () => {
    const cookie = await login();
    const expired = signAuthToken('expired-session', secret, Date.now() - 13 * 60 * 60 * 1000);
    expect((await fetch(`${baseUrl}/api/session`, {
      headers: { Cookie: `clay-mygo-uploads=${expired}` },
    })).status).toBe(401);
    expect((await fetch(`${baseUrl}/api/session`, {
      headers: { Cookie: 'clay-mygo-uploads=invalid.signature' },
    })).status).toBe(401);
    const badType = await upload(cookie, new File(['not an image'], 'program.exe', {
      type: 'application/octet-stream',
    }));
    expect(badType.status).toBe(400);
    expect((await badType.json()).code).toBe('type_not_allowed');

    const oversized = await upload(cookie, new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.txt', {
      type: 'text/plain',
    }));
    expect(oversized.status).toBe(413);
    expect((await oversized.json()).code).toBe('too_large');

    const tooMany = new FormData();
    for (let i = 0; i < 11; i++) tooMany.append('files', new File(['x'], `note-${i}.txt`, { type: 'text/plain' }));
    const countBound = await fetch(`${baseUrl}/api/uploads`, {
      method: 'POST', headers: headers(cookie), body: tooMany,
    });
    expect(countBound.status).toBe(413);

    expect(await (await list(cookie)).json()).toEqual({ files: [], lifetimeUploads: 0 });
  });

  test('files are scoped to user and window while lifetime count survives window changes and delete', async () => {
    const alice = await login();
    const bob = await login('bob', 'demo-bob');
    const uploaded = await upload(alice, new File(['window one'], 'note.txt', { type: 'text/plain' }));
    const item = (await uploaded.json() as UploadList).files[0]!;

    expect((await list(alice, 'alice', 'tab-b')).status).toBe(200);
    expect(await (await list(alice, 'alice', 'tab-b')).json()).toEqual({ files: [], lifetimeUploads: 1 });
    expect(await (await list(bob, 'bob')).json()).toEqual({ files: [], lifetimeUploads: 0 });
    expect((await fetch(`${baseUrl}/api/uploads/${item.id}/content`, {
      headers: headers(alice, 'alice', 'tab-b'),
    })).status).toBe(404);
    expect((await fetch(`${baseUrl}/api/uploads/${item.id}/content`, { headers: headers(bob, 'bob') })).status).toBe(404);
    expect((await fetch(`${baseUrl}/api/uploads/${item.id}`, {
      method: 'DELETE', headers: headers(alice, 'alice', 'tab-b'),
    })).status).toBe(404);

    const deleted = await fetch(`${baseUrl}/api/uploads/${item.id}`, {
      method: 'DELETE', headers: headers(alice),
    });
    expect(deleted.status).toBe(204);
    expect(await (await list(alice)).json()).toEqual({ files: [], lifetimeUploads: 1 });

    const next = await upload(alice, new File(['window two'], 'other.md', { type: 'text/markdown' }), 'tab-b');
    expect((await next.json() as UploadList).lifetimeUploads).toBe(2);
  });

  test('failed metadata commit leaves the listed upload and content available for retry', async () => {
    const cookie = await login();
    const bytes = new Uint8Array([0, 1, 2, 255]);
    const uploaded = await upload(cookie, new File([bytes], 'retry.txt', { type: 'text/plain' }));
    const item = (await uploaded.json() as UploadList).files[0]!;
    const manifestPath = join(dataDir, 'manifest', 'uploads%3Aalice.json');
    const backupPath = `${manifestPath}.backup`;
    const manifest = await readFile(manifestPath);

    await rename(manifestPath, backupPath);
    await mkdir(manifestPath);
    try {
      const commitFailure = await fetch(`${baseUrl}/api/uploads/${item.id}`, {
        method: 'DELETE', headers: headers(cookie),
      });
      expect(commitFailure.status).toBe(500);
    } finally {
      await rm(manifestPath, { recursive: true, force: true });
      await rename(backupPath, manifestPath);
    }

    expect(await readFile(manifestPath)).toEqual(manifest);
    expect(await (await list(cookie)).json()).toEqual({ files: [item], lifetimeUploads: 1 });
    expect(new Uint8Array(await (await fetch(`${baseUrl}/api/uploads/${item.id}/content`, {
      headers: headers(cookie),
    })).arrayBuffer())).toEqual(bytes);

    const retried = await fetch(`${baseUrl}/api/uploads/${item.id}`, {
      method: 'DELETE', headers: headers(cookie),
    });
    expect(retried.status).toBe(204);
    expect(await (await list(cookie)).json()).toEqual({ files: [], lifetimeUploads: 1 });
  });

  test('delete succeeds when post-commit blob cleanup leaves an orphan', async () => {
    const cookie = await login();
    const bytes = new Uint8Array([9, 8, 7]);
    const uploaded = await upload(cookie, new File([bytes], 'orphan.txt', { type: 'text/plain' }));
    const item = (await uploaded.json() as UploadList).files[0]!;
    const filePath = join(dataDir, 'uploads', `${item.id}.bin`);
    const orphanPath = `${filePath}.orphan`;
    await rename(filePath, orphanPath);
    await mkdir(filePath);

    const deleted = await fetch(`${baseUrl}/api/uploads/${item.id}`, {
      method: 'DELETE', headers: headers(cookie),
    });

    expect(deleted.status).toBe(204);
    expect(await (await list(cookie)).json()).toEqual({ files: [], lifetimeUploads: 1 });
    expect(new Uint8Array(await readFile(orphanPath))).toEqual(bytes);
  });

  test('rotating X-Forwarded-For does not evade the login limiter', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': `198.51.100.${attempt + 1}`,
        },
        body: JSON.stringify({ username: 'alice', password: 'wrong' }),
      });
      expect(response.status).toBe(attempt === 4 ? 429 : 401);
    }

    const rotated = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.200' },
      body: JSON.stringify({ username: 'alice', password: 'demo-alice' }),
    });
    expect(rotated.status).toBe(429);
  });

  test('same-name concurrent uploads get separate content and mismatched user is side-effect free', async () => {
    const cookie = await login();
    const mismatched = await fetch(`${baseUrl}/api/uploads`, {
      method: 'POST', headers: headers(cookie, 'bob'),
      body: (() => { const form = new FormData(); form.append('files', new File(['x'], 'x.txt')); return form; })(),
    });
    expect(mismatched.status).toBe(401);

    const [first, second] = await Promise.all([
      upload(cookie, new File(['alpha'], 'same.txt', { type: 'text/plain' })),
      upload(cookie, new File(['bravo'], 'same.txt', { type: 'text/plain' })),
    ]);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    const current = await list(cookie);
    const files = (await current.json() as UploadList).files;
    expect(files).toHaveLength(2);
    expect(new Set(files.map((file) => file.id)).size).toBe(2);
    const contents = await Promise.all(files.map(async (file) => {
      const response = await fetch(`${baseUrl}/api/uploads/${file.id}/content`, { headers: headers(cookie) });
      return new TextDecoder().decode(await response.arrayBuffer());
    }));
    expect(contents.sort()).toEqual(['alpha', 'bravo']);
  });

  test('restart preserves manifest and count; replacement login and logout invalidate their own cookies', async () => {
    const original = await login();
    const uploadResponse = await upload(original, new File(['persist'], 'persist.txt', { type: 'text/plain' }));
    expect(uploadResponse.status).toBe(201);

    server.stop(true);
    const restart = createUploadsApp({ dataDir, assetsDir });
    server = Bun.serve({
      hostname: '127.0.0.1',
      port: 0,
      fetch: (request, server) => restart.fetch(request, server.requestIP(request)?.address),
    });
    baseUrl = `http://127.0.0.1:${server.port}`;
    expect((await fetch(`${baseUrl}/api/session`, { headers: { Cookie: original } })).status).toBe(401);

    const afterRestart = await login();
    expect(await (await list(afterRestart)).json()).toMatchObject({ lifetimeUploads: 1, files: [{ name: 'persist.txt' }] });

    const independent = await login();
    expect((await list(afterRestart)).status).toBe(200);
    expect((await list(independent)).status).toBe(200);
    const replacement = await login('alice', 'demo-alice', afterRestart);
    expect((await list(original)).status).toBe(401);
    expect((await list(afterRestart)).status).toBe(401);
    expect((await list(replacement)).status).toBe(200);
    const logout = await fetch(`${baseUrl}/api/logout`, {
      method: 'POST', headers: headers(replacement),
    });
    expect(logout.status).toBe(204);
    expect(logout.headers.get('set-cookie')).toContain('clay-mygo-uploads=');
    expect((await list(replacement)).status).toBe(401);
    expect((await list(independent)).status).toBe(200);
  });

  test('origin mismatch and route traversal are refused; malicious filenames never touch README', async () => {
    const rejectedLogin = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { Origin: 'http://evil.example', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'demo-alice' }),
    });
    expect(rejectedLogin.status).toBe(403);
    const cookie = await login();
    const before = await readFile(README_PATH);
    const traversalName = await upload(cookie, new File(['separate bytes'], '../../README.md', { type: 'text/markdown' }));
    expect(traversalName.status).toBe(201);
    const item = (await traversalName.json() as UploadList).files[0]!;
    expect(item.name).toBe('../../README.md');

    const blockedHeaders = headers(cookie);
    blockedHeaders.set('Origin', 'http://evil.example');
    const blockedDelete = await fetch(`${baseUrl}/api/uploads/${item.id}`, {
      method: 'DELETE', headers: blockedHeaders,
    });
    expect(blockedDelete.status).toBe(403);
    expect((await list(cookie)).status).toBe(200);
    expect((await fetch(`${baseUrl}/api/uploads/${encodeURIComponent('../../README.md')}/content`, {
      headers: headers(cookie),
    })).status).toBe(404);
    const unknownId = '11111111-1111-4111-8111-111111111111';
    expect((await fetch(`${baseUrl}/api/uploads/${unknownId}/content`, { headers: headers(cookie) })).status).toBe(404);
    expect((await fetch(`${baseUrl}/api/uploads/${unknownId}`, {
      method: 'DELETE', headers: headers(cookie),
    })).status).toBe(404);
    expect((await fetch(`${baseUrl}/api/uploads/${item.id}`, {
      method: 'DELETE', headers: headers(cookie),
    })).status).toBe(204);
    expect(await readFile(README_PATH)).toEqual(before);
  });
});
