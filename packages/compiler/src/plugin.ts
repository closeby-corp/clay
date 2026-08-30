import { mightNeedReactiveLet, transformReactiveLet } from './transform.ts';
import { looksLikeClayPage } from './page-globals.ts';
import { warnClayPageIssues } from './warn-page.ts';

export type RegisterReactiveLetPluginOptions = {
  /** Skip paths matching this predicate (default: node_modules). */
  ignore?: (path: string) => boolean;
};

let registered = false;

function loaderForPath(path: string): 'ts' | 'tsx' {
  return path.endsWith('tsx') || path.endsWith('jsx') ? 'tsx' : 'ts';
}

/**
 * Register a Bun `onLoad` plugin that rewrites reactive `let` in TS modules.
 * Safe to call multiple times (no-op after the first successful register).
 *
 * Important: Bun's runtime `onLoad` must return an object (contents + loader).
 * Returning `undefined` throws `Expected module mock to return an object`.
 *
 * Must run **before** target modules are imported.
 */
export function registerReactiveLetPlugin(
  opts: RegisterReactiveLetPluginOptions = {},
): void {
  if (registered) return;
  if (typeof Bun === 'undefined' || typeof Bun.plugin !== 'function') {
    return;
  }

  const ignore =
    opts.ignore ??
    ((path: string) => path.includes('/node_modules/') || path.includes('\\node_modules\\'));

  Bun.plugin({
    name: 'clay-reactive-let',
    setup(build) {
      build.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async (args) => {
        const loader = loaderForPath(args.path);

        let text: string;
        try {
          text = await Bun.file(args.path).text();
        } catch {
          // Unreadable path — pass an empty module rather than undefined (Bun throws).
          return { contents: '', loader };
        }

        // Pass through: node_modules or our compiler package.
        if (
          ignore(args.path) ||
          args.path.includes('/packages/compiler/') ||
          args.path.includes('\\packages\\compiler\\')
        ) {
          return { contents: text, loader };
        }

        if (looksLikeClayPage(text)) {
          warnClayPageIssues(text, args.path);
        }

        if (!mightNeedReactiveLet(text)) {
          return { contents: text, loader };
        }

        const result = transformReactiveLet(text, args.path);
        if (result.errors && result.errors.length > 0) {
          for (const e of result.errors) {
            console.error(`[clay-reactive-let] ${args.path}: ${e}`);
          }
          throw new Error(
            `[clay-reactive-let] ${result.errors[0]} (${args.path})`,
          );
        }
        if (!result.transformed) {
          return { contents: text, loader };
        }

        for (const w of result.warnings) {
          console.warn(`[clay-reactive-let] ${args.path}: ${w}`);
        }

        return {
          contents: result.code,
          loader,
        };
      });
    },
  });

  registered = true;
}

/** True after a successful `registerReactiveLetPlugin` in this process. */
export function isReactiveLetPluginRegistered(): boolean {
  return registered;
}

/**
 * Scan file paths; if any need reactive-let, register the Bun plugin.
 * Call **before** importing those modules (e.g. from `loadPages`).
 * @returns whether the plugin was (already) registered after this call
 */
export async function ensureReactiveLetPluginForPaths(
  paths: string[],
): Promise<boolean> {
  if (registered) return true;
  for (const path of paths) {
    try {
      const text = await Bun.file(path).text();
      if (mightNeedReactiveLet(text)) {
        registerReactiveLetPlugin();
        return true;
      }
    } catch {
      // skip unreadable — import will surface
    }
  }
  return registered;
}

/** Test helper: clear the once-guard (does not unregister Bun plugins). */
export function resetReactiveLetPluginForTests(): void {
  registered = false;
}
