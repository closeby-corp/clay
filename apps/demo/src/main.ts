import { ui } from '@badui/ui';
import { createDemoRunConfig } from './demo-run';

const port = Bun.env.PORT ? parseInt(Bun.env.PORT) : 4000;

console.log('BadUI Demo — NiceGUI-like API + React/ShadCN client');

await ui.loadPages(new URL('./examples', import.meta.url));

ui.run(
  createDemoRunConfig({
    port,
    title: 'BadUI Demo',
  }),
);
