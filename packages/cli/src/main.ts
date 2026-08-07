import { pathToFileURL } from 'url';
import { isAbsolute, join, resolve } from 'path';
import { existsSync } from 'fs';
import { stat } from 'fs/promises';
import { registerReactiveLetPlugin } from '@badui/compiler/plugin';
import { getRegisteredPaths } from '@badui/core';
import { ui, wasRunCalled, resetRunState, type RunConfig } from '@badui/ui';
import { parseArgs, printUsage } from './parse-args.ts';
import { openBrowser, resolveBundledClientDir, resolveTitle } from './helpers.ts';
import { maybeReload } from './reload.ts';

const BUNDLED_CLIENT_DIR = resolveBundledClientDir();

const NO_PAGES_HINT = `No pages registered.

Use one of:
  // hello.ts — root page
  import { ui } from '@badui/ui';
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

async function loadEntryFile(absPath: string): Promise<void> {
  const mod = (await import(pathToFileURL(absPath).href)) as {
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
    const mod = (await import(pathToFileURL(path).href)) as {
      configureRun?: (config: RunConfig) => RunConfig;
    };
    if (typeof mod.configureRun === 'function') {
      return mod.configureRun(base);
    }
  }
  return base;
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

  resetRunState();

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

  let server: ReturnType<typeof ui.run> | null = null;
  try {
    server = ensureStarted(config);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const port = server?.port ?? args.port;
  const url = `http://localhost:${port}`;
  if (args.open) {
    openBrowser(url);
  }
}

if (import.meta.main) {
  void main();
}
