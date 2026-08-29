#!/usr/bin/env bun
import { spawn, $ } from 'bun';

await $`bunx @tailwindcss/cli -i ./src/globals.css -o ./src/globals.generated.css`;

const css = spawn({
  cmd: [
    'bunx',
    '@tailwindcss/cli',
    '-i',
    './src/globals.css',
    '-o',
    './src/globals.generated.css',
    '--watch',
  ],
  stdout: 'inherit',
  stderr: 'inherit',
  stdin: 'inherit',
});

const clay = spawn({
  cmd: ['bunx', 'clay', './pages', '--app', '--title', 'Clay Tailwind App', '--reload', '--no-open'],
  stdout: 'inherit',
  stderr: 'inherit',
  stdin: 'inherit',
});

function shutdown(code = 0) {
  try {
    css.kill();
  } catch {}
  try {
    clay.kill();
  } catch {}
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

const codes = await Promise.all([css.exited, clay.exited]);
shutdown(codes.find((c) => c !== 0) ?? 0);
