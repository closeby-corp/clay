import { watch, unlinkSync, utimesSync, type FSWatcher } from 'fs';
import { isAbsolute, join, dirname, resolve } from 'path';
import { pathToFileURL } from 'url';
import { stat } from 'fs/promises';
import { parseArgs } from './parse-args.ts';

export function filterReloadArgv(argv: string[]): string[] {
  return argv.filter((a) => a !== '--reload');
}

export function resolveEntryPath(entry: string, cwd = process.cwd()): string {
  return isAbsolute(entry) ? entry : resolve(cwd, entry);
}

/** Directory Bun should treat as the watch project root (entry file's parent, or the page dir). */
export function resolveWatchRoot(absEntry: string, isDirectory: boolean): string {
  return isDirectory ? absEntry : dirname(absEntry);
}

/** Leading `_` so `ui.loadPages` skips this stub if it lands inside a pages dir. */
export function reloadStubFileName(pid = process.pid): string {
  return `_badui-reload-${pid}.ts`;
}

/** Stub that re-invokes the CLI under `bun --watch` with the user's project as cwd. */
export function buildReloadStubSource(cliPath: string, filteredArgv: string[]): string {
  const cliUrl = JSON.stringify(pathToFileURL(cliPath).href);
  const argvLit = JSON.stringify(filteredArgv);
  return `process.env.BADUI_RELOAD_CHILD = "1";
const { main } = await import(${cliUrl});
await main(${argvLit});
`;
}

/**
 * `bun --watch <stub>` so Bun tracks the stub (in the app tree) and, after load,
 * the entry module graph — not the CLI package as the watch root.
 */
export function buildReloadChildCommand(
  execPath: string,
  stubPath: string,
): string[] {
  return [execPath, '--watch', stubPath];
}

/**
 * For directory entries, nudge the stub when files change so new page modules
 * (not yet in the import graph) still trigger a Bun --watch restart.
 */
export function watchDirectoryForNewModules(
  absDir: string,
  stubPath: string,
  debounceMs = 50,
): FSWatcher {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return watch(absDir, { recursive: true }, (_event, filename) => {
    if (typeof filename === 'string' && filename.includes('_badui-reload-')) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        const now = new Date();
        utimesSync(stubPath, now, now);
      } catch {
        // stub may be mid-replace during shutdown
      }
    }, debounceMs);
  });
}

/**
 * When `--reload` is set, run the CLI under `bun --watch` with a stub living next
 * to the user's entry so restarts follow the app entry / page dir (and imports),
 * not the CLI module path.
 */
export async function maybeReload(
  argv: string[],
  opts: {
    cliPath: string;
    execPath?: string;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  },
): Promise<boolean> {
  if (
    !argv.includes('--reload') ||
    opts.env?.BADUI_RELOAD_CHILD === '1' ||
    process.env.BADUI_RELOAD_CHILD === '1'
  ) {
    return false;
  }

  let entry: string | undefined;
  try {
    entry = parseArgs(argv).entry;
  } catch {
    return false;
  }
  if (!entry) return false;

  const cwd = opts.cwd ?? process.cwd();
  const absEntry = resolveEntryPath(entry, cwd);
  let entryStat;
  try {
    entryStat = await stat(absEntry);
  } catch {
    return false;
  }

  const isDirectory = entryStat.isDirectory();
  const watchRoot = resolveWatchRoot(absEntry, isDirectory);
  const stubPath = join(watchRoot, reloadStubFileName());
  // Absolute entry so the child resolves correctly regardless of stub location.
  const filtered = filterReloadArgv(argv).map((a) => (a === entry ? absEntry : a));
  const execPath = opts.execPath ?? process.execPath;
  const childEnv = { ...process.env, ...opts.env, BADUI_RELOAD_CHILD: '1' };

  await Bun.write(stubPath, buildReloadStubSource(opts.cliPath, filtered));

  let dirWatcher: FSWatcher | undefined;
  const cleanup = () => {
    dirWatcher?.close();
    try {
      unlinkSync(stubPath);
    } catch {
      // already removed
    }
  };

  if (isDirectory) {
    dirWatcher = watchDirectoryForNewModules(absEntry, stubPath);
  }

  const child = Bun.spawn(buildReloadChildCommand(execPath, stubPath), {
    cwd,
    env: childEnv,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const stop = () => {
    cleanup();
    child.kill();
  };

  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  process.once('exit', cleanup);

  const code = await child.exited;
  cleanup();
  process.exit(code ?? 0);
  return true;
}
