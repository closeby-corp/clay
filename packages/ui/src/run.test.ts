import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { clearPages, getPage, getRegisteredPaths, setPageWrapper } from '@close-by/clay-core';
import { run, resetRunState, wasRunCalled, page } from './index.ts';

beforeEach(() => {
  clearPages();
  setPageWrapper(null);
  resetRunState();
});

afterEach(() => {
  clearPages();
  setPageWrapper(null);
  resetRunState();
});

describe('ui.run root overload', () => {
  test('registers / from root when missing, then starts', () => {
    const server = run(
      () => {
        /* page builder */
      },
      { port: 0 },
    );
    try {
      expect(getPage('/')).toBeDefined();
      expect(getRegisteredPaths()).toContain('/');
      expect(wasRunCalled()).toBe(true);
    } finally {
      server.stop();
    }
  });

  test('does not overwrite an existing / page', () => {
    const existing = () => {};
    page('/', existing);
    const server = run(() => {}, { port: 0 });
    try {
      expect(getPage('/')).toBe(existing);
    } finally {
      server.stop();
    }
  });

  test('config-only form still marks run called', () => {
    page('/x', () => {});
    const server = run({ port: 0 });
    try {
      expect(wasRunCalled()).toBe(true);
      expect(getRegisteredPaths()).toContain('/x');
    } finally {
      server.stop();
    }
  });
});
