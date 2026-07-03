import { describe, expect, test } from 'bun:test';
import { card, column, container, label, row } from './ui';
import { resetStackForTests, runPageBuilder } from './stack';

describe('ui layout classes chaining', () => {
  test('row().classes() applies extra classes', () => {
    resetStackForTests();
    const root = runPageBuilder(() => {
      column(() => {
        row(() => {
          label('A');
          label('B');
        }).classes('justify-around w-full');
      });
    });

    const html = root.render();
    expect(html).toContain('justify-around');
    expect(html).toContain('w-full');
    expect(html).toContain('flex-row');
  });

  test('row(props, fn).classes() supports reversed args', () => {
    resetStackForTests();
    const root = runPageBuilder(() => {
      column(() => {
        row({ gap: '8' }, () => {
          label('A');
        }).classes('justify-between');
      });
    });

    const html = root.render();
    expect(html).toContain('gap-8');
    expect(html).toContain('justify-between');
  });

  test('column().classes() applies extra classes', () => {
    resetStackForTests();
    const root = runPageBuilder(() => {
      column(() => {
        label('A');
      }).classes('items-start');
    });

    expect(root.render()).toContain('items-start');
  });

  test('container().classes() applies extra classes', () => {
    resetStackForTests();
    const root = runPageBuilder(() => {
      container(() => {
        label('A');
      }).classes('bg-red-500');
    });

    expect(root.render()).toContain('bg-red-500');
  });

  test('card().classes() applies extra classes', () => {
    resetStackForTests();
    const root = runPageBuilder(() => {
      row(() => {
        card({ bordered: true }, () => {
          label('A');
        }).classes('w-48');
      });
    });

    expect(root.render()).toContain('w-48');
  });
});
