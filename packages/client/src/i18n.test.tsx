import { afterEach, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { __setI18nBootForTests, applyLocale, format, getLocale, localeHello, t, useFormat, useT } from './i18n';

afterEach(() => __setI18nBootForTests());

function Probe() {
  const tr = useT();
  const fmt = useFormat();
  return <span>{`${tr('common.cancel')}|${fmt.number(1234.5)}|${fmt.weekStartsOn}`}</span>;
}

test('English is the default', () => {
  expect(getLocale()).toBe('en');
  expect(t('common.cancel')).toBe('Cancel');
  expect(renderToStaticMarkup(<Probe />)).toBe('<span>Cancel|1,234.5|0</span>');
});

test('boot locale from the server selects pt-PT strings, number format and Monday weeks', () => {
  __setI18nBootForTests({ locale: 'pt-PT' });
  expect(getLocale()).toBe('pt-PT');
  expect(renderToStaticMarkup(<Probe />)).toMatch(/^<span>Cancelar\|1\s?234,5\|1<\/span>$/);
});

test('app overrides win, and missing keys fall back to English', () => {
  __setI18nBootForTests({
    locale: 'es',
    locales: ['en', 'pt-PT', 'es'],
    messages: { es: { 'common.cancel': 'Cancelar (es)' }, 'pt-PT': { 'common.close': 'Sair' } },
  });
  expect(t('common.cancel')).toBe('Cancelar (es)');
  expect(t('common.save')).toBe('Save');
  applyLocale('pt-PT');
  expect(t('common.close')).toBe('Sair');
  expect(t('common.cancel')).toBe('Cancelar');
});

test('a stored choice beats the default, even without a catalog (English text, its formatting)', () => {
  __setI18nBootForTests({ locale: 'en' }, 'pt-PT');
  expect(getLocale()).toBe('pt-PT');
  __setI18nBootForTests({ locale: 'pt-PT' }, 'de-DE');
  expect(getLocale()).toBe('de-DE');
  expect(t('common.cancel')).toBe('Cancel');
  expect(format().number(1234.5)).toBe('1.234,5');
});

test('applyLocale switches live and null returns to the default', () => {
  __setI18nBootForTests({ locale: 'pt-PT' });
  applyLocale('en');
  expect(t('common.close')).toBe('Close');
  expect(format().locale).toBe('en');
  applyLocale(null);
  expect(getLocale()).toBe('pt-PT');
});

test('hello payload always carries browser languages', () => {
  expect(Array.isArray(localeHello().languages)).toBe(true);
});
