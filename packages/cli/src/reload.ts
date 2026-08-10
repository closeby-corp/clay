import { watch, unlinkSync, writeFileSync, type FSWatcher } from 'fs';
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
  return `_clay-reload-${pid}.ts`;
}

/** Marker so reload children open the browser only on the first start. */
export function reloadOpenMarkerFileName(pid = process.pid): string {
  return `_clay-reload-opened-${pid}`;
}

/** Stub that re-invokes the CLI under `bun --watch` with the user's project as cwd. */
export function buildReloadStubSource(cliPath: string, filteredArgv: string[]): string {
  const cliUrl = JSON.stringify(pathToFileURL(cliPath).href);
  const argvLit = JSON.stringify(filteredArgv);
  return `process.env.CLAY_RELOAD_CHILD = "1";
const { main } = await import(${cliUrl});
await main(${argvLit});
`;
}

/**
 * Bun `--watch` ignores mtime-only updates (`utimes` / `touch`). Rewrite stub
 * contents so the child process actually restarts.
 */
export function writeReloadStubNudge(stubPath: string, baseSource: string, now = Date.now()): void {
  writeFileSync(stubPath, `${baseSource}\n// clay-reload-nudge ${now}\n`);
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
 * For directory entries, rewrite the stub when files change so Bun `--watch`
 * restarts (dynamic page imports alone are not reliably watched).
 */
export function watchDirectoryForNewModules(
  absDir: string,
  stubPath: string,
  getStubSource: () => string,
  debounceMs = 50,
): FSWatcher {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return watch(absDir, { recursive: true }, (_event, filename) => {
    if (typeof filename === 'string' && filename.includes('_clay-reload-')) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        writeReloadStubNudge(stubPath, getStubSource());
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
    opts.env?.CLAY_RELOAD_CHILD === '1' ||
    process.env.CLAY_RELOAD_CHILD === '1'
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
  const openMarkerPath = join(watchRoot, reloadOpenMarkerFileName());
  // Absolute entry so the child resolves correctly regardless of stub location.
  const filtered = filterReloadArgv(argv).map((a) => (a === entry ? absEntry : a));
  const execPath = opts.execPath ?? process.execPath;
  const childEnv = {
    ...process.env,
    ...opts.env,
    CLAY_RELOAD_CHILD: '1',
    CLAY_RELOAD_OPEN_MARKER: openMarkerPath,
  };

  const stubSource = () => buildReloadStubSource(opts.cliPath, filtered);
  writeReloadStubNudge(stubPath, stubSource(), 0);

  let dirWatcher: FSWatcher | undefined;
  const cleanup = () => {
    dirWatcher?.close();
    try {
      unlinkSync(stubPath);
    } catch {
      // already removed
    }
    try {
      unlinkSync(openMarkerPath);
    } catch {
      // first run may never have opened
    }
  };

  if (isDirectory) {
    dirWatcher = watchDirectoryForNewModules(absEntry, stubPath, stubSource);
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
