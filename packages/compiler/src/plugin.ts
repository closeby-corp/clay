import { mightNeedReactiveLet, transformReactiveLet } from './transform.ts';

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
    name: 'badui-reactive-let',
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

        // Pass through: node_modules, our compiler package, or files that need no rewrite.
        if (
          ignore(args.path) ||
          args.path.includes('/packages/compiler/') ||
          args.path.includes('\\packages\\compiler\\') ||
          !mightNeedReactiveLet(text)
        ) {
          return { contents: text, loader };
        }

        const result = transformReactiveLet(text, args.path);
        if (!result.transformed) {
          return { contents: text, loader };
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

/** Test helper: clear the once-guard (does not unregister Bun plugins). */
export function resetReactiveLetPluginForTests(): void {
  registered = false;
}
