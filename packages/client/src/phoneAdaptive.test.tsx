import { afterEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ElementRenderer } from './ElementRenderer';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

function setPhone(matches: boolean) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    // Vaul reads the current URL while rendering its drawer root.
    value: { location: { href: 'http://localhost/' }, matchMedia: () => ({ matches, addEventListener() {}, removeEventListener() {} }) },
  });
}

function render(type: string, props: Record<string, unknown>) {
  return renderToStaticMarkup(createElement(ElementRenderer, {
    emit: () => {},
    node: { id: 'phone-test', type, props, children: [] },
  }));
}

const options = [{ value: 'one', label: 'First option' }, { value: 'two', label: 'Second option' }];

describe('phone adaptive pickers', () => {
  test('select renders a native picker with options and placeholder on phones', () => {
    setPhone(true);
    const html = render('select', { options, value: 'two', placeholder: 'Choose one' });
    expect(html).toContain('<select');
    expect(html).toContain('value="" disabled=""');
    expect(html).toContain('Choose one');
    expect(html).toContain('First option');
    expect(html).toContain('value="two" selected=""');
  });

  test('select keeps the desktop trigger when the phone query does not match', () => {
    setPhone(false);
    const html = render('select', { options });
    expect(html).not.toContain('data-slot="native-select"');
    expect(html).toContain('data-slot="select-trigger"');
  });

  test('select is safe without matchMedia', () => {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
    expect(render('select', { options })).toContain('data-slot="select-trigger"');
  });

  test('combobox shows its selected label on the phone trigger', () => {
    setPhone(true);
    const html = render('combobox', { options, value: 'two' });
    expect(html).toContain('<button');
    expect(html).toContain('Second option');
  });

  test('date uses the native date input and current value on phones', () => {
    setPhone(true);
    const html = render('date', { value: '2026-11-10', disabled: true, error: 'Invalid date' });
    expect(html).toContain('type="date"');
    expect(html).toContain('value="2026-11-10"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-invalid="true"');
  });

  test('dropdownmenu keeps its trigger label on phones', () => {
    setPhone(true);
    const html = render('dropdownmenu', { label: 'Actions' });
    expect(html).toContain('<button');
    expect(html).toContain('Actions');
  });
});
