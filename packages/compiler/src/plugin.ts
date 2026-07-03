import { plugin } from 'bun';
import { shouldTransformSource, transformSource } from './transform';

const EXAMPLES_PATTERN = /\/examples\/[^/]+\.ts$/;

export function registerBaduiPlugin(): void {
  plugin({
    name: 'badui-compiler',
    setup(build) {
      build.onLoad({ filter: EXAMPLES_PATTERN }, async (args) => {
        const source = await Bun.file(args.path).text();
        const contents = transformSource(source, args.path);
        return { contents, loader: 'ts' };
      });
    },
  });
}

// Auto-register when loaded as preload entry.
registerBaduiPlugin();
