import { describe, expect, test } from 'bun:test';
import { patchResponse } from './patch-response';
import { readBadUISignals, BadRequestError } from './datastar';

describe('patchResponse', () => {
  test('returns text/event-stream with patch-elements', async () => {
    const res = patchResponse({
      elements: '<div id="c-test">hello</div>',
      useViewTransition: true,
    });

    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const text = await res.text();
    expect(text).toContain('event: datastar-patch-elements');
    expect(text).toContain('data: elements <div id="c-test">hello</div>');
    expect(text).toContain('data: useViewTransition true');
  });

  test('includes patch-signals when provided', async () => {
    const res = patchResponse({
      elements: '<div id="x">x</div>',
      signals: { search_key: '' },
    });
    const text = await res.text();
    expect(text).toContain('event: datastar-patch-signals');
    expect(text).toContain('search_key');
  });
});

describe('readBadUISignals', () => {
  test('parses compId and evtType from JSON body', async () => {
    const req = new Request('http://localhost/badui/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compId: 'c1', evtType: 'click', ctxId: 'ctx' }),
    });
    const signals = await readBadUISignals(req);
    expect(signals.compId).toBe('c1');
    expect(signals.evtType).toBe('click');
    expect(signals.ctxId).toBe('ctx');
  });

  test('throws BadRequestError on invalid JSON', async () => {
    const req = new Request('http://localhost/badui/events', {
      method: 'POST',
      body: 'not json',
    });
    await expect(readBadUISignals(req)).rejects.toBeInstanceOf(BadRequestError);
  });
});
