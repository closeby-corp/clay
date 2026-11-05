import { describe, expect, test } from 'bun:test';
import { card, column, container, grid, row } from './index';

describe('layout fill props', () => {
  test('row/column/container forward grow, scroll, fillViewport', () => {
    const r = row({ grow: true, scroll: 'x' }, () => {});
    expect(r.props.grow).toBe(true);
    expect(r.props.scroll).toBe('x');

    const c = column({ fillViewport: true, grow: 2 }, () => {});
    expect(c.props.fillViewport).toBe(true);
    expect(c.props.grow).toBe(2);

    expect(container({ grow: true }, () => {}).props.grow).toBe(true);
  });

  test('card forwards grow + scroll', () => {
    const el = card({ title: 'Inbox', grow: true, scroll: true }, () => {});
    expect(el.props.grow).toBe(true);
    expect(el.props.scroll).toBe(true);
  });

  test('grid defaults to auto-fit 16rem; cols disables auto-fit; numbers become px', () => {
    const auto = grid(() => {});
    expect(auto.type).toBe('grid');
    expect(auto.props.minColWidth).toBe('16rem');
    expect(auto.props.gap).toBe(4);

    const fixed = grid({ cols: 3 }, () => {});
    expect(fixed.props.cols).toBe(3);
    expect(fixed.props.minColWidth).toBeUndefined();

    expect(grid({ minColWidth: 240 }, () => {}).props.minColWidth).toBe('240px');
  });
});
