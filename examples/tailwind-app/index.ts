import { ui, resolveClayClientDir } from '@close-by/clay';
import { join } from 'path';

await ui.loadPages(new URL('./pages', import.meta.url));

ui.run({
  port: Number(process.env.PORT) || 4300,
  title: 'Clay Tailwind App',
  clientDir: resolveClayClientDir(),
  // Auto Tailwind scans pages/ by default; tokens merge after utilities.
  css: join(import.meta.dir, 'src/tokens.css'),
  app: {
    title: 'Clay Tailwind App',
    nav: ui.navFromPages(),
  },
});
