import { fileURLToPath } from 'url';
import { ui } from '@badui/ui';

const port = Bun.env.PORT ? parseInt(Bun.env.PORT) : 4000;

console.log('BadUI Demo — NiceGUI-like API + React/ShadCN client');

await ui.loadPages(new URL('./examples', import.meta.url));

ui.run({
  port,
  title: 'BadUI Demo',
  css: fileURLToPath(new URL('./globals.css', import.meta.url)),
  app: {
    nav: ui.navFromPages(),
  },
});
