import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as clay from '../packages/ui/src/index';
import * as core from '../packages/core/src/index';
import * as components from '../packages/components/src/index';
import * as server from '../packages/server/src/index';
import * as auth from '../packages/auth/src/index';
import * as persistenceFile from '../packages/persistence-file/src/index';

const root = new URL('../', import.meta.url);
export const surfacePath = new URL('compat/surface.json', root);

export async function computeSurface(): Promise<string[]> {
  const entries = new Set<string>();
  const plainObject = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

  function visit(object: Record<string, unknown>, path: string, depth: number): void {
    for (const key of Object.keys(object)) {
      let value: unknown;
      try {
        value = object[key];
      } catch {
        // Session-backed getters are unavailable outside a page builder.
        continue;
      }
      if (typeof value !== 'function' && !plainObject(value)) continue;
      const name = `${path}.${key}`;
      entries.add(name);
      if (plainObject(value) && depth < 3) visit(value, name, depth + 1);
    }
  }
  visit(clay.ui, 'ui', 1);

  // All six source entries import in Bun; native/network adapter packages are excluded.
  for (const [name, exports] of [
    ['@close-by/clay', clay],
    ['@close-by/clay-core', core],
    ['@close-by/clay-components', components],
    ['@close-by/clay-server', server],
    ['@close-by/clay-auth', auth],
    ['@close-by/clay-persistence-file', persistenceFile],
  ] as const) {
    for (const key of Object.keys(exports)) entries.add(`export:${name}:${key}`);
  }

  function methods(prototype: object, prefix: string): void {
    for (const name of Object.getOwnPropertyNames(prototype)) {
      if (name !== 'constructor' && typeof Object.getOwnPropertyDescriptor(prototype, name)?.value === 'function') {
        entries.add(`${prefix}.${name}`);
      }
    }
  }
  for (let prototype = core.Element.prototype; prototype !== Object.prototype; prototype = Object.getPrototypeOf(prototype)) {
    methods(prototype, 'element');
  }
  for (const [name, value] of Object.entries(clay)) {
    if (typeof value === 'function' && value.prototype instanceof core.Element) {
      methods(value.prototype, `class.${name}`);
    }
  }

  const renderer = await readFile(new URL('packages/client/src/ElementRenderer.tsx', root), 'utf8');
  // shortcut: every `case '...'` from the main `switch (type)` to the end of the file; revisit if another string switch is added after it.
  const switchStart = renderer.indexOf('switch (type)');
  if (switchStart === -1) throw new Error('Missing renderer type switch');
  const mainSwitch = renderer.slice(switchStart);
  for (const match of mainSwitch.matchAll(/case\s+['"]([^'"]+)['"]\s*:/g)) entries.add(`wire.${match[1]}`);

  const protocol = await readFile(new URL('packages/core/src/protocol.ts', root), 'utf8');
  for (const [type, kind] of [['ServerMessage', 'server'], ['ClientMessage', 'client'], ['Patch', 'patch']] as const) {
    const union = protocol.split(`export type ${type} =`)[1]?.split(/\bexport type\b/)[0];
    if (!union) throw new Error(`Missing protocol union: ${type}`);
    for (const match of union.matchAll(/\bop:\s*['"]([^'"]+)['"]/g)) entries.add(`op.${kind}.${match[1]}`);
  }
  const cli = await readFile(new URL('packages/cli/src/parse-args.ts', root), 'utf8');
  for (const match of cli.matchAll(/['"](-[a-zA-Z]|--[a-zA-Z][a-zA-Z0-9-]*)['"]/g)) entries.add(`cli.${match[1]}`);
  return [...entries].sort();
}

if (import.meta.main) {
  const surface = await computeSurface();
  if (process.argv.includes('--write')) {
    await mkdir(new URL('compat/', root), { recursive: true });
    await writeFile(surfacePath, `${JSON.stringify(surface, null, 2)}\n`);
  }
  const counts: Record<string, number> = {};
  for (const entry of surface) {
    const kind = entry.startsWith('export:') ? 'export' : entry.startsWith('op.') ? entry.split('.').slice(0, 2).join('.') : entry.split('.')[0]!;
    counts[kind] = (counts[kind] ?? 0) + 1;
  }
  console.log(`${surface.length} compatibility entries${process.argv.includes('--write') ? ' written to compat/surface.json' : ''}`);
  console.log(counts);
}
