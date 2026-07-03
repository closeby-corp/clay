import { describe, expect, test } from 'bun:test';
import {
  badge,
  alert,
  avatar,
  accordion,
  breadcrumbs,
  chat,
  countdown,
  dataTable,
  divider,
  kbd,
  pagination,
  skeleton,
  stat,
  status,
  steps,
  table,
  radialProgress,
  swap,
  themeController,
  mockup,
} from './index';

describe('DaisyUI components smoke', () => {
  test('badge renders daisyUI classes', () => {
    const html = badge('New', { color: 'primary' }).render();
    expect(html).toContain('badge');
    expect(html).toContain('badge-primary');
    expect(html).toContain('New');
  });

  test('alert renders role and type', () => {
    const html = alert('Hello', { type: 'success' }).render();
    expect(html).toContain('role="alert"');
    expect(html).toContain('alert-success');
  });

  test('avatar renders image', () => {
    const html = avatar({ src: '/img.png', alt: 'User' }).render();
    expect(html).toContain('avatar');
    expect(html).toContain('/img.png');
  });

  test('accordion renders collapse items', () => {
    const html = accordion([{ title: 'Q', content: 'A' }]).render();
    expect(html).toContain('collapse');
    expect(html).toContain('Q');
  });

  test('layout/data components render', () => {
    expect(breadcrumbs([{ label: 'Home', href: '/' }]).render()).toContain('breadcrumbs');
    expect(chat([{ text: 'Hi' }]).render()).toContain('chat-bubble');
    expect(countdown(59).render()).toContain('countdown');
    expect(divider('OR').render()).toContain('divider');
    expect(kbd('Ctrl').render()).toContain('kbd');
    expect(pagination({ current: 1, total: 3 }).render()).toContain('join');
    expect(dataTable([{ id: 1, name: 'A' }], { columns: [{ key: 'name', header: 'Name' }], keyField: 'id' }).render()).toContain('table');
    expect(skeleton().render()).toContain('skeleton');
    expect(stat([{ title: 'T', value: '1' }]).render()).toContain('stats');
    expect(status({ type: 'success' }).render()).toContain('status-success');
    expect(steps([{ label: 'One' }]).render()).toContain('steps');
    expect(table([{ key: 'n', label: 'Name' }], [{ n: 'A' }]).render()).toContain('table');
    expect(radialProgress(75).render()).toContain('radial-progress');
    expect(swap('ON', 'OFF').render()).toContain('swap');
    expect(themeController().render()).toContain('theme-controller');
    expect(mockup((m) => m.add('content'), { type: 'browser' }).render()).toContain('mockup-browser');
  });
});
