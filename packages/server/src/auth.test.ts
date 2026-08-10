import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { clearPages, page, storage } from '@clay/core';
import { ClayServer } from './server';

function waitFor(ws: WebSocket, predicate: (data: unknown) => boolean, ms = 4000): Promise<unknown> {
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

describe('resolveUserId auth hook', () => {
  let dir: string;
  let server: ReturnType<typeof Bun.serve> | null = null;
  let clay: ClayServer | null = null;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'clay-auth-'));
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.js'), '');
    clearPages();
    storage.clearAll();
  });

  afterEach(async () => {
    server?.stop(true);
    server = null;
    clay = null;
    clearPages();
    storage.clearAll();
    await rm(dir, { recursive: true, force: true });
  });

  test('resolveUserId can prefer a trusted header over hello userId', async () => {
    page('/auth', () => {});

    let resolved: string | null | undefined;
    clay = new ClayServer({
      port: 0,
      clientDir: dir,
      userStorageDir: false,
      resolveUserId: ({ headers, helloUserId }) => {
        const trusted = headers.get('x-forwarded-user');
        resolved = trusted || helloUserId || null;
        return resolved;
      },
    });
    server = clay.start();

    // Bun's WebSocket constructor accepts a second options bag with headers.
    const ws = new WebSocket(`ws://127.0.0.1:${clay.port}/ws`, {
      headers: { 'x-forwarded-user': 'trusted-alice' },
    } as unknown as string[]);

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error('ws error'));
    });

    const mountP = waitFor(ws, (d) => (d as { op?: string }).op === 'mount');
    ws.send(
      JSON.stringify({
        op: 'hello',
        path: '/auth',
        userId: 'anon-local',
      }),
    );
    await mountP;
    expect(resolved).toBe('trusted-alice');

    ws.close();
  });

  test('falls back to hello userId when hook returns null', async () => {
    page('/auth', () => {});
    let seenHello: string | undefined;
    clay = new ClayServer({
      port: 0,
      clientDir: dir,
      userStorageDir: false,
      resolveUserId: ({ helloUserId }) => {
        seenHello = helloUserId;
        return null;
      },
    });
    server = clay.start();

    const ws = new WebSocket(`ws://127.0.0.1:${clay.port}/ws`);
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error('ws error'));
    });

    const mountP = waitFor(ws, (d) => (d as { op?: string }).op === 'mount');
    ws.send(JSON.stringify({ op: 'hello', path: '/auth', userId: 'fallback-bob' }));
    await mountP;
    expect(seenHello).toBe('fallback-bob');
    ws.close();
  });
});
