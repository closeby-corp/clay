import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  Element,
  clearPages,
  navigate,
  page,
  resetIdSequence,
  storage,
  type ClientMessage,
  type ElementNode,
  type ServerMessage,
} from '@close-by/clay-core';
import { ClayServer } from './server';

function findByType(node: ElementNode, type: string): ElementNode[] {
  const out: ElementNode[] = [];
  const walk = (n: ElementNode) => {
    if (n.type === type) out.push(n);
    for (const c of n.children) walk(c);
  };
  walk(node);
  return out;
}

function waitForMessage(
  ws: WebSocket,
  predicate: (msg: ServerMessage) => boolean,
  timeoutMs = 3000,
): Promise<ServerMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for WebSocket message'));
    }, timeoutMs);

    const onMessage = (ev: MessageEvent) => {
      const msg = JSON.parse(String(ev.data)) as ServerMessage;
      if (predicate(msg)) {
        cleanup();
        resolve(msg);
      }
    };

    const cleanup = () => {
      clearTimeout(timer);
      ws.removeEventListener('message', onMessage);
    };

    ws.addEventListener('message', onMessage);
  });
}

function openWs(port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket open timed out'));
    }, 3000);
    ws.addEventListener('open', () => {
      clearTimeout(timer);
      resolve(ws);
    });
    ws.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('WebSocket failed to open'));
    });
  });
}

function send(ws: WebSocket, msg: ClientMessage): void {
  ws.send(JSON.stringify(msg));
}

describe('WebSocket session protocol', () => {
  let dir: string;
  let clay: ClayServer | null = null;

  beforeEach(async () => {
    clearPages();
    resetIdSequence();
    storage.clearAll();
    dir = await mkdtemp(join(tmpdir(), 'clay-ws-'));
    await mkdir(dir, { recursive: true });
  });

  afterEach(async () => {
    clay?.stop();
    clay = null;
    clearPages();
    storage.clearAll();
    await rm(dir, { recursive: true, force: true });
  });

  test('hello → mount → event → patch → navigate remount hello', async () => {
    page('/ws-a', () => {
      const label = new Element('label', { text: '0' });
      new Element('button', {
        text: 'inc',
        onClick: () => {
          label.setText(String(Number(label.props.text) + 1));
        },
      });
      new Element('button', {
        text: 'go',
        onClick: () => navigate('/ws-b'),
      });
    });
    page('/ws-b', () => {
      new Element('label', { text: 'arrived' });
    });

    clay = new ClayServer({
      port: 0,
      uploadDir: dir,
      userStorageDir: false,
      clientDir: dir,
    });
    clay.start();

    const ws = await openWs(clay.port);
    try {
      const mountA = waitForMessage(ws, (m) => m.op === 'mount');
      send(ws, { op: 'hello', path: '/ws-a', userId: 'ws-user-1' });
      const mounted = await mountA;
      expect(mounted.op).toBe('mount');
      if (mounted.op !== 'mount') return;

      const incBtn = findByType(mounted.tree, 'button').find((b) => b.props.text === 'inc')!;
      expect(incBtn).toBeTruthy();

      const patchP = waitForMessage(ws, (m) => m.op === 'patch');
      send(ws, { op: 'event', id: incBtn.id, type: 'click' });
      const patchMsg = await patchP;
      expect(patchMsg.op).toBe('patch');
      if (patchMsg.op !== 'patch') return;
      expect(patchMsg.patches).toContainEqual({
        op: 'updateProps',
        id: findByType(mounted.tree, 'label')[0]!.id,
        props: { text: '1' },
      });

      const goBtn = findByType(mounted.tree, 'button').find((b) => b.props.text === 'go')!;
      const navP = waitForMessage(ws, (m) => m.op === 'navigate' && m.path === '/ws-b');
      send(ws, { op: 'event', id: goBtn.id, type: 'click' });
      await navP;

      // Client reacts to navigate by sending a new hello (see useSession)
      const mountB = waitForMessage(ws, (m) => m.op === 'mount');
      send(ws, { op: 'hello', path: '/ws-b', userId: 'ws-user-1' });
      const remounted = await mountB;
      expect(remounted.op).toBe('mount');
      if (remounted.op !== 'mount') return;
      expect(findByType(remounted.tree, 'label')[0]!.props.text).toBe('arrived');
      expect(remounted.sessionId).not.toBe(mounted.sessionId);
    } finally {
      ws.close();
    }
  });

  test('hello userId wires storage.user across remount', async () => {
    page('/ws-store', () => {
      const status = new Element('label', { text: 'idle' });
      new Element('button', {
        text: 'save',
        onClick: async () => {
          await storage.user.set('pref', 'on');
          status.setText('saved');
        },
      });
    });
    page('/ws-read', () => {
      const label = new Element('label', { text: 'pending' });
      new Element('button', {
        text: 'load',
        onClick: async () => {
          const pref = await storage.user.get<string>('pref');
          label.setText(pref ?? 'missing');
        },
      });
    });

    clay = new ClayServer({
      port: 0,
      uploadDir: dir,
      userStorageDir: false,
      clientDir: dir,
    });
    clay.start();

    const ws = await openWs(clay.port);
    try {
      const mountStore = waitForMessage(ws, (m) => m.op === 'mount');
      send(ws, { op: 'hello', path: '/ws-store', userId: 'persist-user' });
      const storeMount = await mountStore;
      if (storeMount.op !== 'mount') return;
      const saveBtn = findByType(storeMount.tree, 'button')[0]!;
      const statusId = findByType(storeMount.tree, 'label')[0]!.id;

      const savedPatch = waitForMessage(
        ws,
        (m) =>
          m.op === 'patch' &&
          m.patches.some(
            (p) =>
              p.op === 'updateProps' &&
              p.id === statusId &&
              p.props.text === 'saved',
          ),
      );
      send(ws, { op: 'event', id: saveBtn.id, type: 'click' });
      await savedPatch;

      const mountRead = waitForMessage(ws, (m) => m.op === 'mount');
      send(ws, { op: 'hello', path: '/ws-read', userId: 'persist-user' });
      const readMount = await mountRead;
      if (readMount.op !== 'mount') return;
      const loadBtn = findByType(readMount.tree, 'button')[0]!;
      const labelId = findByType(readMount.tree, 'label')[0]!.id;

      const loadPatch = waitForMessage(
        ws,
        (m) =>
          m.op === 'patch' &&
          m.patches.some(
            (p) =>
              p.op === 'updateProps' &&
              p.id === labelId &&
              p.props.text === 'on',
          ),
      );
      send(ws, { op: 'event', id: loadBtn.id, type: 'click' });
      await loadPatch;
    } finally {
      ws.close();
    }
  });

  test('hello tabStorage hydrates ui.storage.tab', async () => {
    page('/ws-tab', () => {
      const label = new Element('label', {
        text: String(storage.tab.get<string>('resume') ?? 'missing'),
      });
      void label;
    });

    clay = new ClayServer({
      port: 0,
      uploadDir: dir,
      userStorageDir: false,
      clientDir: dir,
    });
    clay.start();

    const ws = await openWs(clay.port);
    try {
      const mountP = waitForMessage(ws, (m) => m.op === 'mount');
      send(ws, {
        op: 'hello',
        path: '/ws-tab',
        tabStorage: { resume: 'from-bag' },
      });
      const mount = await mountP;
      if (mount.op !== 'mount') return;
      const label = findByType(mount.tree, 'label')[0]!;
      expect(label.props.text).toBe('from-bag');

      const remountP = waitForMessage(ws, (m) => m.op === 'mount');
      send(ws, {
        op: 'hello',
        path: '/ws-tab',
        tabStorage: { resume: 'after-reconnect' },
      });
      const remount = await remountP;
      if (remount.op !== 'mount') return;
      expect(findByType(remount.tree, 'label')[0]!.props.text).toBe('after-reconnect');
    } finally {
      ws.close();
    }
  });

  test('storage.tab.set write-through sends clientStorage scope tab', async () => {
    page('/ws-tab-write', () => {
      new Element('button', {
        text: 'save',
        onClick: () => {
          storage.tab.set('k', 'v');
        },
      });
    });

    clay = new ClayServer({
      port: 0,
      uploadDir: dir,
      userStorageDir: false,
      clientDir: dir,
    });
    clay.start();

    const ws = await openWs(clay.port);
    try {
      const mountP = waitForMessage(ws, (m) => m.op === 'mount');
      send(ws, { op: 'hello', path: '/ws-tab-write' });
      const mount = await mountP;
      if (mount.op !== 'mount') return;
      const btn = findByType(mount.tree, 'button')[0]!;

      const storageOp = waitForMessage(
        ws,
        (m) =>
          m.op === 'clientStorage' &&
          m.scope === 'tab' &&
          m.action === 'set' &&
          m.key === 'k' &&
          m.value === 'v',
      );
      send(ws, { op: 'event', id: btn.id, type: 'click' });
      await storageOp;
    } finally {
      ws.close();
    }
  });
});
