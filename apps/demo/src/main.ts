import { fileURLToPath } from 'url';
import { ui } from '@badui/ui';

import './examples';

const port = Bun.env.PORT ? parseInt(Bun.env.PORT) : 4000;

console.log('BadUI Demo — NiceGUI-like API + React/ShadCN client');

ui.run({
  port,
  title: 'BadUI Demo',
  clientDir: fileURLToPath(new URL('../../../packages/client/dist', import.meta.url)),
  css: fileURLToPath(new URL('./globals.css', import.meta.url)),
});
