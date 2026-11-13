import { existsSync, readFileSync } from 'fs';
import { extname, isAbsolute, resolve } from 'path';

/** Options for installable-web-app support (`ui.run({ pwa })`). */
export type ClayPwaConfig = {
  /** App name (install prompt, splash). Default: the server `title`. */
  name?: string;
  /** Short name under the home-screen icon. Default: `name`. */
  shortName?: string;
  /** Manifest description. */
  description?: string;
  /** CSS color for the browser/OS chrome. Default: Clay's light/dark background. */
  themeColor?: string;
  /** Splash-screen background. Default: Clay's light background. */
  backgroundColor?: string;
  /** Display mode. Default `'standalone'`. */
  display?: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  /** URL opened when launched from the home screen. Default `'/'`. */
  startUrl?: string;
  /** Path (relative to cwd) to a square PNG (512px+ recommended) or SVG. Default: Clay's bundled icons. */
  icon?: string;
};

/** Approximation of the default ("kiln") `--background` values in index.css. */
export const PWA_LIGHT_BG = '#fcfaf7';
export const PWA_DARK_BG = '#16120f';

export type PwaIcon = {
  /** Absolute file path of the custom icon. */
  file: string;
  /** Served URL: `/pwa/icon.png` or `/pwa/icon.svg`. */
  url: string;
  type: 'image/png' | 'image/svg+xml';
  sizes: string;
};

export type ResolvedPwa = {
  config: ClayPwaConfig;
  name: string;
  icon?: PwaIcon;
};

export function pngSize(buf: Uint8Array): { width: number; height: number } | null {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 24 || sig.some((b, i) => buf[i] !== b)) return null;
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  return { width: v.getUint32(16), height: v.getUint32(20) };
}

/** Normalize the `pwa` option; throws if a custom icon is missing or unsupported. */
export function resolvePwa(pwa: boolean | ClayPwaConfig | undefined, title: string): ResolvedPwa | undefined {
  if (!pwa) return undefined;
  const config = pwa === true ? {} : pwa;
  const name = config.name ?? title;
  let icon: PwaIcon | undefined;
  if (config.icon) {
    const file = isAbsolute(config.icon) ? config.icon : resolve(process.cwd(), config.icon);
    if (!existsSync(file)) throw new Error(`pwa.icon: file not found: ${file}`);
    const ext = extname(file).toLowerCase();
    if (ext === '.svg') {
      icon = { file, url: '/pwa/icon.svg', type: 'image/svg+xml', sizes: 'any' };
    } else if (ext === '.png') {
      const size = pngSize(readFileSync(file));
      if (!size) throw new Error(`pwa.icon: not a valid PNG: ${file}`);
      icon = { file, url: '/pwa/icon.png', type: 'image/png', sizes: `${size.width}x${size.height}` };
    } else {
      throw new Error(`pwa.icon: must be a .png or .svg file: ${file}`);
    }
  }
  return { config, name, icon };
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const DEFAULT_ICONS = {
  any192: '/assets/pwa/icon-192.png',
  any512: '/assets/pwa/icon-512.png',
  maskable: '/assets/pwa/icon-maskable-512.png',
  apple: '/assets/pwa/apple-touch-icon.png',
};

export function pwaHeadHtml(p: ResolvedPwa): string {
  const { config, name, icon } = p;
  const lines: string[] = [
    `  <link rel="manifest" href="/manifest.webmanifest" />`,
  ];
  if (config.themeColor) {
    lines.push(`  <meta name="theme-color" content="${escapeHtml(config.themeColor)}" />`);
  } else {
    lines.push(
      `  <meta name="theme-color" content="${PWA_LIGHT_BG}" media="(prefers-color-scheme: light)" />`,
      `  <meta name="theme-color" content="${PWA_DARK_BG}" media="(prefers-color-scheme: dark)" />`,
    );
  }
  lines.push(
    `  <meta name="mobile-web-app-capable" content="yes" />`,
    `  <meta name="apple-mobile-web-app-capable" content="yes" />`,
    `  <meta name="apple-mobile-web-app-title" content="${escapeHtml(config.shortName ?? name)}" />`,
    `  <meta name="apple-mobile-web-app-status-bar-style" content="default" />`,
  );
  if (icon) {
    lines.push(`  <link rel="icon" href="${icon.url}" type="${icon.type}" />`);
    if (icon.type === 'image/png') lines.push(`  <link rel="apple-touch-icon" href="${icon.url}" />`);
  } else {
    lines.push(
      `  <link rel="icon" href="${DEFAULT_ICONS.any192}" type="image/png" />`,
      `  <link rel="apple-touch-icon" href="${DEFAULT_ICONS.apple}" />`,
    );
  }
  lines.push(
    `  <script>if('serviceWorker' in navigator){var controlled=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',function(){if(controlled)window.__CLAY_RELOAD__('sw:'+window.__CLAY_VERSION__);controlled=true});addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).catch(function(){})})}</script>`,
  );
  return lines.join('\n') + '\n';
}

export function pwaManifest(p: ResolvedPwa): Record<string, unknown> {
  const { config, name, icon } = p;
  const icons = icon
    ? [{ src: icon.url, sizes: icon.sizes, type: icon.type, purpose: 'any' }]
    : [
        { src: DEFAULT_ICONS.any192, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: DEFAULT_ICONS.any512, sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: DEFAULT_ICONS.maskable, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ];
  return {
    name,
    short_name: config.shortName ?? name,
    ...(config.description ? { description: config.description } : {}),
    start_url: config.startUrl ?? '/',
    scope: '/',
    display: config.display ?? 'standalone',
    theme_color: config.themeColor ?? PWA_LIGHT_BG,
    background_color: config.backgroundColor ?? PWA_LIGHT_BG,
    icons,
  };
}

/** Version every fixed-name entry asset together, including app styles. */
export function clientVersion(clientDir: string, cssPaths: string[] = []): string {
  const hash = new Bun.CryptoHasher('sha256');
  for (const file of [resolve(clientDir, 'index.js'), resolve(clientDir, 'index.css'), ...cssPaths]) {
    const content = existsSync(file) ? readFileSync(file) : new Uint8Array();
    hash.update(String(content.length) + ':');
    hash.update(content);
  }
  return hash.digest('hex').slice(0, 16);
}

export function pwaServiceWorker(version: string, p: ResolvedPwa, extraUrls: string[] = []): string {
  const precache = [
    '/',
    '/assets/index.js?v=' + version,
    '/assets/index.css?v=' + version,
    // App CSS (`css` option + auto Tailwind) so the offline shell is styled.
    ...extraUrls,
    '/manifest.webmanifest',
    ...(p.icon ? [p.icon.url] : [DEFAULT_ICONS.any192, DEFAULT_ICONS.any512, DEFAULT_ICONS.maskable, DEFAULT_ICONS.apple]),
  ];
  return `const CACHE = ${JSON.stringify('clay-shell-' + version)};
const PRECACHE = ${JSON.stringify(precache)};
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {}))),
    ).then(() => self.skipWaiting()),
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('clay-shell-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
async function networkFirst(request, cacheKey, store) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request);
    if (store && res.status === 200) await cache.put(cacheKey, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
    throw err;
  }
}
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/', url.pathname === '/'));
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname === '/manifest.webmanifest' || url.pathname.startsWith('/pwa/')) {
    event.respondWith(networkFirst(request, request, true));
  }
});
`;
}

export const KILL_SWITCH_SW = `self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('clay-shell-')).map((k) => caches.delete(k))))
      .then(() => self.registration.unregister()),
  );
});
`;
