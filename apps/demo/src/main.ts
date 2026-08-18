import { ui } from '@close-by/clay';
import { createDemoRunConfig } from './demo-run';

const port = Bun.env.PORT ? parseInt(Bun.env.PORT) : 4000;

console.log('Clay Demo — NiceGUI-like API + React/ShadCN client');

await ui.loadPages(new URL('./examples', import.meta.url));

ui.run(
  createDemoRunConfig({
    port,
    title: 'Clay Demo',
  }),
);
