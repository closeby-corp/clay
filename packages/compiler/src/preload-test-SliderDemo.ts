import { plugin } from 'bun';
import { transformSource } from './transform';
plugin({
  name: 't',
  setup(build) {
    build.onLoad({ filter: /\/examples\/SliderDemo\.ts$/ }, async (args) => {
      const source = await Bun.file(args.path).text();
      const contents = transformSource(source, args.path);
      if (contents === source) return;
      return { contents, loader: 'ts' };
    });
  },
});
