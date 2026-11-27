import { describe, expect, test } from 'bun:test';
import { ClientSession, runWithSession, type Element } from '@close-by/clay-core';
import { presenceBadge, themePicker } from './index';

function inLocale<T>(locale: string | null, fn: () => T): T {
  const session = new ClientSession('/i18n', () => {});
  session.locale = locale;
  return runWithSession(session, fn);
}

function texts(menu: Element): string[] {
  return menu.children.map((c) => String(c.props.label ?? c.props.text ?? '-'));
}

describe('themePicker / presenceBadge strings', () => {
  test('English by default', () => {
    const menu = inLocale(null, () => themePicker());
    expect(menu.props.label).toBe('Theme');
    expect(texts(menu).slice(0, 5)).toEqual(['Appearance', 'Light', 'Dark', 'System', '-']);
    expect(texts(menu)[5]).toBe('Palette');
  });

  test('pt-PT session', () => {
    const menu = inLocale('pt-PT', () => themePicker());
    expect(menu.props.label).toBe('Tema');
    expect(texts(menu).slice(0, 4)).toEqual(['Aspeto', 'Claro', 'Escuro', 'Sistema']);
    expect(texts(menu)[5]).toBe('Paleta');
    // Palette names are product names and stay as-is.
    expect(texts(menu)[6]).toBe('kiln');

    const badge = inLocale('pt-PT', () => presenceBadge());
    expect(String(badge.children[1]!.props.text)).toMatch(/^\d+ online$/);
  });
});
