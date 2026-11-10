import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { clearPages, page } from '@close-by/clay-core';
import { ClayServer, type ClayServerConfig } from './server';

const PNG_1x1 = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
  (c) => c.charCodeAt(0),
);
function pngWithSize(w: number, h: number): Uint8Array {
  const b = new Uint8Array(PNG_1x1);
  const v = new DataView(b.buffer);
  v.setUint32(16, w);
  v.setUint32(20, h);
  return b;
}

describe('pwa', () => {
  let dir: string;
  let clay: ClayServer | null = null;
  afterEach(async () => {
    clay?.stop();
    clay = null;
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  async function boot(cfg: Partial<ClayServerConfig> = {}, bundle = 'console.log(1)') {
    clearPages();
    page('/', () => {});
    dir = await mkdtemp(join(tmpdir(), 'clay-pwa-'));
    await writeFile(join(dir, 'index.js'), bundle);
    clay = new ClayServer({ port: 0, clientDir: dir, userStorageDir: false, ...cfg });
    clay.start();
    const get = (p: string) => fetch(`http://127.0.0.1:${clay!.port}${p}`);
    return { get };
  }

  test('HTML has no PWA tags when off', async () => {
    const { get } = await boot();
    const html = await (await get('/')).text();
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0" />');
    expect(html).not.toMatch(/manifest|theme-color|serviceWorker|apple-/);
    expect((await get('/manifest.webmanifest')).status).toBe(404);
  });

  test('HTML tags and escaping when on', async () => {
    const { get } = await boot({ title: 'A "B"', pwa: { shortName: '<x>&', themeColor: '#123456' } });
    const html = await (await get('/')).text();
    expect(html).toContain('viewport-fit=cover');
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(html).toContain('<meta name="theme-color" content="#123456" />');
    expect(html).not.toContain('prefers-color-scheme');
    expect(html).toContain('content="&lt;x&gt;&amp;"');
    expect(html).toContain('rel="apple-touch-icon" href="/assets/pwa/apple-touch-icon.png"');
    expect(html).toContain("navigator.serviceWorker.register('/sw.js')");
  });

  test('two theme-color tags by default', async () => {
    const { get } = await boot({ pwa: true });
    const html = await (await get('/')).text();
    expect(html).toContain('media="(prefers-color-scheme: light)"');
    expect(html).toContain('media="(prefers-color-scheme: dark)"');
  });

  test('manifest defaults and options', async () => {
    let { get } = await boot({ title: 'My App', pwa: true });
    let res = await get('/manifest.webmanifest');
    expect(res.headers.get('content-type')).toContain('application/manifest+json');
    let m = (await res.json()) as any;
    expect(m).toMatchObject({ name: 'My App', short_name: 'My App', start_url: '/', scope: '/', display: 'standalone' });
    expect(m.description).toBeUndefined();
    expect(m.icons.map((i: any) => i.src)).toContain('/assets/pwa/icon-maskable-512.png');
    clay!.stop();

    ({ get } = await boot({
      pwa: { name: 'N', shortName: 'S', description: 'D', display: 'fullscreen', startUrl: '/x', themeColor: '#000', backgroundColor: '#fff' },
    }));
    m = await (await get('/manifest.webmanifest')).json();
    expect(m).toMatchObject({
      name: 'N', short_name: 'S', description: 'D', display: 'fullscreen', start_url: '/x', theme_color: '#000', background_color: '#fff',
    });
  });

  test('custom PNG icon uses IHDR size', async () => {
    dir = await mkdtemp(join(tmpdir(), 'clay-pwa-icon-'));
    const icon = join(dir, 'i.png');
    await writeFile(icon, pngWithSize(512, 512));
    const { get } = await boot({ pwa: { icon } });
    const m = (await (await get('/manifest.webmanifest')).json()) as any;
    expect(m.icons).toEqual([{ src: '/pwa/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' }]);
    expect(await (await get('/')).text()).toContain('rel="apple-touch-icon" href="/pwa/icon.png"');
    const res = await get('/pwa/icon.png');
    expect(res.headers.get('content-type')).toBe('image/png');
  });

  test('custom SVG icon', async () => {
    dir = await mkdtemp(join(tmpdir(), 'clay-pwa-icon-'));
    const icon = join(dir, 'i.svg');
    await writeFile(icon, '<svg xmlns="http://www.w3.org/2000/svg"/>');
    const { get } = await boot({ pwa: { icon } });
    const m = (await (await get('/manifest.webmanifest')).json()) as any;
    expect(m.icons[0]).toMatchObject({ src: '/pwa/icon.svg', sizes: 'any', type: 'image/svg+xml' });
    const html = await (await get('/')).text();
    expect(html).not.toContain('apple-touch-icon');
    expect(html).toContain('rel="icon" href="/pwa/icon.svg"');
    expect((await get('/pwa/icon.svg')).headers.get('content-type')).toBe('image/svg+xml');
  });

  test('missing custom icon throws', () => {
    expect(() => new ClayServer({ port: 0, userStorageDir: false, pwa: { icon: '/nope/missing.png' } })).toThrow(/pwa\.icon/);
  });

  test('/sw.js worker when on, kill switch when off', async () => {
    let { get } = await boot({ pwa: true }, 'bundle-a');
    let res = await get('/sw.js');
    expect(res.headers.get('content-type')).toBe('text/javascript; charset=utf-8');
    expect(res.headers.get('cache-control')).toBe('no-cache');
    const a = await res.text();
    expect(a).toMatch(/clay-shell-[0-9a-f]+/);
    clay!.stop();
    ({ get } = await boot({ pwa: true }, 'bundle-b'));
    expect(await (await get('/sw.js')).text()).not.toBe(a);
    clay!.stop();

    ({ get } = await boot({}));
    const off = await (await get('/sw.js')).text();
    expect(off).toContain('registration.unregister()');
    expect(off).toContain('skipWaiting');
  });

  test('user routes override /sw.js', async () => {
    const { get } = await boot({ pwa: true, routes: { '/sw.js': () => new Response('custom') } });
    expect(await (await get('/sw.js')).text()).toBe('custom');
  });
});
