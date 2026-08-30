import { describe, expect, test } from 'bun:test';
import { iframe, viewportEnter } from './index';

describe('iframe', () => {
  test('factory serializes src and attrs', () => {
    const el = iframe('https://example.com/embed', {
      title: 'Demo',
      height: 320,
      sandbox: ['allow-scripts', 'allow-same-origin'],
      loading: 'lazy',
    });
    expect(el.type).toBe('iframe');
    expect(el.props.src).toBe('https://example.com/embed');
    expect(el.props.title).toBe('Demo');
    expect(el.props.height).toBe(320);
    expect(el.props.sandbox).toBe('allow-scripts allow-same-origin');
    expect(el.props.loading).toBe('lazy');
  });
});

describe('viewportEnter', () => {
  test('registers onEnter as enter event; once defaults true', () => {
    const el = viewportEnter({ onEnter: () => {}, rootMargin: '40px' }, () => {});
    expect(el.type).toBe('viewportEnter');
    expect(el.props.once).toBe(true);
    expect(el.props.rootMargin).toBe('40px');
    expect(el.props.events).toEqual(expect.arrayContaining(['enter']));
    expect(el.props.onEnter).toBeUndefined();
  });

  test('props-first and fn-first overloads', () => {
    const a = viewportEnter(() => {}, { once: false });
    const b = viewportEnter({ once: false }, () => {});
    expect(a.props.once).toBe(false);
    expect(b.props.once).toBe(false);
  });

  test('root nearest-scroll is serialized', () => {
    const el = viewportEnter({ root: 'nearest-scroll', onEnter: () => {} }, () => {});
    expect(el.props.root).toBe('nearest-scroll');
  });
});
