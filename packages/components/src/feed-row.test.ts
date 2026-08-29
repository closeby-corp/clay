import { describe, expect, test } from 'bun:test';
import { reactive } from '@close-by/clay-core';
import { feedList, feedRow } from './feed-row';

describe('feedRow / feedList', () => {
  test('feedRow builds row with status and bindText title', async () => {
    const live = reactive({ title: 'ORD-1', selected: false });
    const el = feedRow({
      selected: live.selected,
      status: { color: 'emerald' },
      title: () => live.title,
      meta: 'client · $12',
      trailing: '2m ago',
      onClick: () => {
        live.selected = true;
      },
    });
    expect(el.type).toBe('row');
    expect(el.props.className).toContain('hover:bg-muted/40');
    live.title = 'ORD-2';
    await Promise.resolve();
    await Promise.resolve();
    expect(el.children.length).toBeGreaterThan(0);
  });

  test('feedList uses bordered divided container defaults', () => {
    const el = feedList(() => {
      feedRow({ title: 'One', status: { color: 'muted' } });
    });
    expect(el.type).toBe('container');
    expect(String(el.props.className)).toContain('divide-y');
    expect(String(el.props.className)).toContain('rounded-md border');
  });

  test('feedRow selected styling', () => {
    const el = feedRow({ title: 'x', selected: true, status: { color: 'red' } });
    expect(el.props.className).toContain('bg-primary/10');
  });
});
