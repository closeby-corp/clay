import { dirname, isAbsolute, join, resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';
import { stat } from 'fs/promises';
import { registerReactiveLetPlugin } from '@close-by/clay-compiler/plugin';
import { getRegisteredPaths } from '@close-by/clay-core';
import {
  ui,
  wasRunCalled,
  resetRunState,
  importFresh,
  resetPageDiscovery,
  type RunConfig,
} from '@close-by/clay';
import { parseArgs, printUsage } from './parse-args.ts';
import { openBrowser, resolveBundledClientDir, resolveTitle } from './helpers.ts';
import { maybeReload } from './reload.ts';

const BUNDLED_CLIENT_DIR = resolveBundledClientDir();

const NO_PAGES_HINT = `No pages registered.

Use one of:
  // hello.ts — root page
  import { ui } from '@close-by/clay';
  ui.run(() => { ui.label('Hello'); });

  // or export a default builder (CLI registers as /)
  export default function () { ui.label('Hello'); }

  // or call ui.page(...) then let the CLI start the server
`;

function buildRunConfig(opts: {
  port: number;
  title: string;
  app: boolean;
}): RunConfig {
  const config: RunConfig = {
    port: opts.port,
    title: opts.title,
    clientDir: BUNDLED_CLIENT_DIR,
  };
  if (opts.app) {
    config.app = {
      title: opts.title,
      nav: ui.navFromPages(),
    };
  }
  return config;
}

function ensureStarted(config: RunConfig): ReturnType<typeof ui.run> | null {
  if (wasRunCalled()) return null;
  return ui.run(config);
}

/** Open once under `--reload` (marker path from parent); always open otherwise. */
export function shouldOpenBrowser(openFlag: boolean): boolean {
  if (!openFlag) return false;
  if (process.env.CLAY_RELOAD_CHILD !== '1') return true;
  const marker = process.env.CLAY_RELOAD_OPEN_MARKER;
  if (!marker) return true;
  if (existsSync(marker)) return false;
  try {
    writeFileSync(marker, `${Date.now()}\n`);
  } catch {
    // still open; worst case a second tab on races
  }
  return true;
}

async function loadEntryFile(absPath: string): Promise<void> {
  resetPageDiscovery();
  const mod = (await importFresh(absPath)) as {
    default?: unknown;
  };

  if (getRegisteredPaths().length === 0) {
    if (typeof mod.default === 'function') {
      ui.page('/', mod.default as () => void);
    } else if (!wasRunCalled()) {
      throw new Error(NO_PAGES_HINT);
    }
  }
}

async function loadEntryDir(absDir: string): Promise<void> {
  const loaded = await ui.loadPages(absDir);
  if (loaded.length === 0 && getRegisteredPaths().length === 0) {
    throw new Error(`No page modules found under ${absDir}`);
  }
}

/**
 * Optional `_run.ts` / `_run.tsx` next to a page directory (skipped by `loadPages`).
 * Export `configureRun(base) => RunConfig` to merge auth / shell / etc. into CLI defaults.
 */
export async function applyDirRunConfig(
  absDir: string,
  base: RunConfig,
): Promise<RunConfig> {
  for (const name of ['_run.ts', '_run.tsx'] as const) {
    const path = join(absDir, name);
    if (!existsSync(path)) continue;
    const mod = (await importFresh(path)) as {
      configureRun?: (config: RunConfig) => RunConfig;
    };
    if (typeof mod.configureRun === 'function') {
      return mod.configureRun(base);
    }
  }
  return base;
}

function isAddrInUse(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return (
    e?.code === 'EADDRINUSE' ||
    (typeof e?.message === 'string' && e.message.includes('EADDRINUSE'))
  );
}

async function startServerWithRetry(
  config: RunConfig,
  attempts = 25,
  delayMs = 40,
): Promise<ReturnType<typeof ui.run>> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    resetRunState();
    try {
      const server = ensureStarted(config);
      if (server) return server;
      // Entry already called ui.run() during import.
      if (wasRunCalled()) {
        throw new Error(
          'ui.run() was already called by the entry module; CLI cannot start a second server. Remove ui.run from page modules when using the CLI.',
        );
      }
      throw new Error('Failed to start Clay server (ensureStarted returned null).');
    } catch (err) {
      lastErr = err;
      if (isAddrInUse(err) && i < attempts - 1) {
        await Bun.sleep(delayMs);
        continue;
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  if (await maybeReload(argv, { cliPath: import.meta.path })) return;

  let args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    printUsage();
    process.exit(1);
  }

  if (args.help || !args.entry) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }

  if (process.env.CLAY_RELOAD_CHILD === '1') {
    console.log('↻ clay: reloading…');
  }

  resetRunState();
  resetPageDiscovery();

  if (args.reactiveLet) {
    registerReactiveLetPlugin();
  }

  const absEntry = isAbsolute(args.entry) ? args.entry : resolve(process.cwd(), args.entry);

  let entryStat;
  try {
    entryStat = await stat(absEntry);
  } catch {
    console.error(`Entry not found: ${absEntry}`);
    process.exit(1);
  }

  const isDir = entryStat.isDirectory();
  const title = await resolveTitle(args.title, process.cwd());

  const contentRoot = isDir ? absEntry : dirname(absEntry);
  if (args.tailwind) {
    process.env.CLAY_TAILWIND_CONTENT = contentRoot;
    if (args.reload) process.env.CLAY_TAILWIND_WATCH = '1';
    delete process.env.CLAY_NO_TAILWIND;
  } else {
    process.env.CLAY_NO_TAILWIND = '1';
    delete process.env.CLAY_TAILWIND_CONTENT;
  }

  try {
    if (isDir) {
      await loadEntryDir(absEntry);
    } else {
      await loadEntryFile(absEntry);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  if (getRegisteredPaths().length === 0 && !wasRunCalled()) {
    console.error(NO_PAGES_HINT);
    process.exit(1);
  }

  let config = buildRunConfig({
    port: args.port,
    title,
    app: args.app,
  });
  if (isDir) {
    config = await applyDirRunConfig(absEntry, config);
  }

  if (args.tailwind) {
    const contentRoot = isDir ? absEntry : dirname(absEntry);
    config = {
      ...config,
      // Prefer explicit entry scan; still allow configureRun css to merge.
      tailwind: {
        content: [contentRoot],
        watch: args.reload,
      },
    };
  } else {
    config = { ...config, tailwind: false };
  }

  // Entry modules that call ui.run() themselves — nothing left for the CLI to do.
  if (wasRunCalled()) {
    const url = `http://localhost:${args.port}`;
    if (shouldOpenBrowser(args.open)) {
      openBrowser(url);
    }
    return;
  }

  let server: ReturnType<typeof ui.run>;
  try {
    server = await startServerWithRetry(config);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const port = server.port;
  const url = `http://localhost:${port}`;
  if (shouldOpenBrowser(args.open)) {
    openBrowser(url);
  }
}

if (import.meta.main) {
  void main();
}
