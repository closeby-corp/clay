import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  clearPages,
  getCurrentSession,
  page,
  storage,
  type ServerMessage,
} from '@close-by/clay-core';
import { AUTH_COOKIE_NAME, signAuthToken } from './auth-cookie';
import { ClayServer } from './server';

function waitFor(
  ws: WebSocket,
  predicate: (data: unknown) => boolean,
  ms = 4000,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    const onMessage = (ev: MessageEvent) => {
      let data: unknown;
      try {
        data = JSON.parse(String(ev.data));
      } catch {
        return;
      }
      if (predicate(data)) {
        clearTimeout(timer);
        ws.removeEventListener('message', onMessage);
        resolve(data);
      }
    };
    ws.addEventListener('message', onMessage);
  });
}

describe('auth cookie + session timeouts', () => {
  let dir: string;
  let server: ReturnType<typeof Bun.serve> | null = null;
  let clay: ClayServer | null = null;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'clay-auth-cookie-'));
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.js'), '');
    clearPages();
    storage.clearAll();
  });

  afterEach(async () => {
    server?.stop(true);
    server = null;
    clay?.stop();
    clay = null;
    clearPages();
    storage.clearAll();
    await rm(dir, { recursive: true, force: true });
  });

  test('hello trusts signed auth cookie via default resolveUserId', async () => {
    let seenUser: string | null = null;
    page('/secure', () => {
      seenUser = getCurrentSession()?.userId ?? null;
    });

    const secret = 'cookie-secret';
    clay = new ClayServer({
      port: 0,
      clientDir: dir,
      userStorageDir: false,
      authSecret: secret,
    });
    server = clay.start();

    const token = signAuthToken('trusted-carol', secret);
    const ws = new WebSocket(`ws://127.0.0.1:${clay.port}/ws`, {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
      },
    } as unknown as string[]);

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error('ws error'));
    });

    const mountP = waitFor(ws, (d) => (d as { op?: string }).op === 'mount');
    ws.send(
      JSON.stringify({
        op: 'hello',
        path: '/secure',
        userId: 'anon-local',
      }),
    );
    await mountP;
    expect(seenUser).toBe('trusted-carol');
    ws.close();
  });

  test('POST /auth/session then DELETE', async () => {
    clay = new ClayServer({
      port: 0,
      clientDir: dir,
      userStorageDir: false,
      authSecret: 's',
    });
    server = clay.start();

    const token = signAuthToken('dave', 's');
    const post = await fetch(`http://127.0.0.1:${clay.port}/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    expect(post.status).toBe(204);
    expect(post.headers.get('Set-Cookie') ?? '').toContain(AUTH_COOKIE_NAME);

    const del = await fetch(`http://127.0.0.1:${clay.port}/auth/session`, {
      method: 'DELETE',
    });
    expect(del.status).toBe(204);
    expect(del.headers.get('Set-Cookie') ?? '').toContain('Max-Age=0');
  });

  test('idle timeout clears auth via authSession message', async () => {
    page('/t', () => {});

    clay = new ClayServer({
      port: 0,
      clientDir: dir,
      userStorageDir: false,
      authSecret: 'idle-secret',
      sessionIdleMs: 50,
      sessionExpiredPath: '/examples/auth/login',
    });
    server = clay.start();

    const token = signAuthToken('eve', 'idle-secret');
    const ws = new WebSocket(`ws://127.0.0.1:${clay.port}/ws`, {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
      },
    } as unknown as string[]);

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error('ws error'));
    });

    const mountP = waitFor(ws, (d) => (d as ServerMessage).op === 'mount');
    ws.send(JSON.stringify({ op: 'hello', path: '/t', userId: 'anon' }));
    await mountP;

    const expired = (await waitFor(
      ws,
      (d) => {
        const m = d as ServerMessage;
        return m.op === 'authSession' && m.action === 'clear';
      },
      8000,
    )) as ServerMessage;

    expect(expired).toMatchObject({
      op: 'authSession',
      action: 'clear',
      path: '/examples/auth/login',
    });
    ws.close();
  });
});
