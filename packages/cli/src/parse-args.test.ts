import { describe, expect, test } from 'bun:test';
import { parseArgs } from './parse-args.ts';

describe('parseArgs', () => {
  test('parses entry and defaults', () => {
    expect(parseArgs(['hello.ts'])).toMatchObject({
      entry: 'hello.ts',
      port: 3000,
      app: false,
      open: true,
      reload: false,
      reactiveLet: false,
    });
  });

  test('parses flags', () => {
    expect(
      parseArgs(['./pages', '--app', '-p', '4000', '-t', 'Demo', '--no-open', '--reload']),
    ).toEqual({
      entry: './pages',
      port: 4000,
      title: 'Demo',
      app: true,
      open: false,
      reload: true,
      reactiveLet: false,
      help: false,
    });
  });

  test('--reactive-let', () => {
    expect(parseArgs(['app.ts', '--reactive-let']).reactiveLet).toBe(true);
  });

  test('--no-reactive-let', () => {
    expect(parseArgs(['app.ts', '--no-reactive-let']).reactiveLet).toBe(false);
  });

  test('help flag', () => {
    expect(parseArgs(['--help']).help).toBe(true);
  });
});
