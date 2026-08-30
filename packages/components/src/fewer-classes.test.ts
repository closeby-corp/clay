import { describe, expect, test } from 'bun:test';
import {
  empty,
  input,
  label,
  pageHeading,
  resizable,
  select,
  spinner,
  row,
  column,
} from './index';

describe('fewer-classes semantic props', () => {
  test('label tone and size', () => {
    const el = label('Hi', { tone: 'muted', size: 'sm' });
    expect(el.props.tone).toBe('muted');
    expect(el.props.size).toBe('sm');
  });

  test('spinner size', () => {
    expect(spinner().props.size).toBe('sm');
    expect(spinner({ size: 'xs' }).props.size).toBe('xs');
  });

  test('pageHeading', () => {
    const el = pageHeading({ title: 'Orders', description: 'Live feed' });
    expect(el.type).toBe('pageHeading');
    expect(el.props.title).toBe('Orders');
    expect(el.props.description).toBe('Live feed');
  });

  test('empty density inline', () => {
    const el = empty({ title: 'Nothing', density: 'inline' });
    expect(el.props.density).toBe('inline');
  });

  test('input/select width and inline', () => {
    const i = input({ label: 'Search', width: 'md', inline: true });
    expect(i.props.width).toBe('md');
    expect(i.props.inline).toBe(true);
    const s = select({
      label: 'Show',
      width: 'sm',
      inline: true,
      options: [{ value: 'all', label: 'All' }],
    });
    expect(s.props.width).toBe('sm');
    expect(s.props.inline).toBe(true);
  });

  test('resizable fill', () => {
    const el = resizable({ fill: 'parent', orientation: 'horizontal' }, () => {});
    expect(el.props.fill).toBe('parent');
  });

  test('row align justify minWidthZero', () => {
    const el = row({ align: 'end', justify: 'between', minWidthZero: true }, () => {});
    expect(el.props.align).toBe('end');
    expect(el.props.justify).toBe('between');
    expect(el.props.minWidthZero).toBe(true);
  });

  test('column minWidthZero', () => {
    const el = column({ minWidthZero: true, gap: 0 }, () => {});
    expect(el.props.minWidthZero).toBe(true);
  });
});
