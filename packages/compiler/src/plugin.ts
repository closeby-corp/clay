import { mightNeedReactiveLet, transformReactiveLet } from './transform.ts';

export type RegisterReactiveLetPluginOptions = {
  /** Skip paths matching this predicate (default: node_modules). */
  ignore?: (path: string) => boolean;
};

let registered = false;

/**
 * Register a Bun `onLoad` plugin that rewrites reactive `let` in TS modules.
 * Safe to call multiple times (no-op after the first successful register).
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
        if (ignore(args.path)) return;
        // Avoid transforming our own package / tests in a weird loop
        if (args.path.includes('/packages/compiler/')) return;

        let text: string;
        try {
          text = await Bun.file(args.path).text();
        } catch {
          return;
        }
        if (!mightNeedReactiveLet(text)) return;

        const result = transformReactiveLet(text, args.path);
        if (!result.transformed) return;

        const loader = args.path.endsWith('tsx') || args.path.endsWith('jsx') ? 'tsx' : 'ts';
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
