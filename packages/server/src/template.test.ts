import { describe, expect, test } from 'bun:test';
import { generatePageHTML } from './template';

describe('generatePageHTML', () => {
  test('embeds initial signals on #app', () => {
    const html = generatePageHTML({
      content: '<p>hi</p>',
      contextId: 'ctx-1',
      initialSignals: { count: 0, ctxId: 'ctx-1' },
    });

    expect(html).toContain('id="app"');
    expect(html).toContain('"count":0');
    expect(html).toContain('"ctxId":"ctx-1"');
  });

  test('opens persistent SSE stream on load', () => {
    const html = generatePageHTML({
      content: '<p>hi</p>',
      contextId: 'ctx-1',
    });

    expect(html).toContain('id="badui-stream"');
    expect(html).toContain("@get('/badui/stream?ctxId=ctx-1')");
  });

  test('includes datastar script', () => {
    const html = generatePageHTML({ content: '<p>hi</p>' });
    expect(html).toContain('datastar');
    expect(html).not.toContain('htmx');
  });

  test('does not include legacy manual fetch helpers', () => {
    const html = generatePageHTML({ content: '<p>hi</p>', contextId: 'ctx-1' });
    expect(html).not.toContain('handleFileSelect');
    expect(html).not.toContain('showToast');
  });
});
