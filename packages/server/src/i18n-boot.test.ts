import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  Element,
  clearPages,
  configureI18n,
  getLocale,
  page,
  resetIdSequence,
  setLocale,
  t,
  type ClientMessage,
  type ServerMessage,
} from '@close-by/clay-core';
import { ClayServer } from './server';

function openWs(port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    ws.addEventListener('open', () => resolve(ws));
    ws.addEventListener('error', () => reject(new Error('WebSocket failed to open')));
  });
}

function next(ws: WebSocket, op: ServerMessage['op']): Promise<ServerMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${op}`)), 3000);
    const onMessage = (ev: MessageEvent) => {
      const msg = JSON.parse(String(ev.data)) as ServerMessage;
      if (msg.op !== op) return;
      clearTimeout(timer);
      ws.removeEventListener('message', onMessage);
      resolve(msg);
    };
    ws.addEventListener('message', onMessage);
  });
}

function hello(ws: WebSocket, extra: Partial<Extract<ClientMessage, { op: 'hello' }>> = {}): void {
  ws.send(JSON.stringify({ op: 'hello', path: '/', ...extra } satisfies ClientMessage));
}

function bootFromHtml(html: string): { locale: string; locales: string[]; messages: Record<string, Record<string, string>> } {
  const m = html.match(/window\.__CLAY_I18N__=(.*?)<\/script>/);
  if (!m) throw new Error('no __CLAY_I18N__ boot script');
  return JSON.parse(m[1]!);
}

describe('i18n reaches the client', () => {
  let dir: string;
  let clay: ClayServer | null = null;

  beforeEach(async () => {
    clearPages();
    resetIdSequence();
    dir = await mkdtemp(join(tmpdir(), 'clay-i18n-'));
  });

  afterEach(async () => {
    clay?.stop();
    clay = null;
    clearPages();
    configureI18n(null);
    await rm(dir, { recursive: true, force: true });
  });

  test('default English boot: lang="en" and no overrides', async () => {
    page('/', () => {});
    clay = new ClayServer({ port: 0, userStorageDir: false, clientDir: dir });
    clay.start();
    const html = await (await fetch(`http://127.0.0.1:${clay.port}/`)).text();
    expect(html).toContain('<html lang="en"');
    const boot = bootFromHtml(html);
    expect(boot.locale).toBe('en');
    expect(boot.locales).toContain('pt-PT');
    expect(boot.messages).toEqual({});
  });

  test('ui.run({ locale, messages }) is embedded in the SPA HTML (Clay keys only, escaped)', async () => {
    page('/', () => {});
    clay = new ClayServer({
      port: 0,
      userStorageDir: false,
      clientDir: dir,
      locale: 'pt-PT',
      messages: {
        'pt-PT': { 'common.cancel': 'Desistir', 'app.only': 'not a Clay key' },
        es: { 'common.cancel': '</script><b>Cancelar' },
      },
    });
    clay.start();
    const html = await (await fetch(`http://127.0.0.1:${clay.port}/`)).text();
    expect(html).toContain('<html lang="pt-PT"');
    expect(html).not.toContain('</script><b>');
    const boot = bootFromHtml(html);
    expect(boot.locale).toBe('pt-PT');
    expect(boot.locales).toEqual(expect.arrayContaining(['en', 'pt-PT', 'es']));
    expect(boot.messages['pt-PT']).toEqual({ 'common.cancel': 'Desistir' });
    expect(boot.messages.es!['common.cancel']).toBe('</script><b>Cancelar');
  });

  test('hello resolves the session locale; ui.setLocale pushes a locale op', async () => {
    const seen: string[] = [];
    page('/', () => {
      seen.push(getLocale());
      new Element('button', {
        text: t('common.cancel'),
        onClick: () => setLocale('en', { remount: false }),
      });
    });
    clay = new ClayServer({ port: 0, userStorageDir: false, clientDir: dir, locale: 'auto' });
    clay.start();
    const ws = await openWs(clay.port);
    try {
      const mounted = next(ws, 'mount');
      hello(ws, { languages: ['pt-BR', 'en-US'] });
      const mount = (await mounted) as Extract<ServerMessage, { op: 'mount' }>;
      expect(seen).toEqual(['pt-PT']);
      const button = mount.tree.children[0]!;
      expect(button.props.text).toBe('Cancelar');

      const localeOp = next(ws, 'locale');
      ws.send(JSON.stringify({ op: 'event', id: button.id, type: 'click' } satisfies ClientMessage));
      expect(await localeOp).toEqual({ op: 'locale', locale: 'en', remount: false });

      // A stored choice wins over browser languages on the next hello.
      const remounted = next(ws, 'mount');
      hello(ws, { locale: 'en', languages: ['pt-PT'] });
      const again = (await remounted) as Extract<ServerMessage, { op: 'mount' }>;
      expect(again.tree.children[0]!.props.text).toBe('Cancel');
      expect(seen.at(-1)).toBe('en');
    } finally {
      ws.close();
    }
  });
});
