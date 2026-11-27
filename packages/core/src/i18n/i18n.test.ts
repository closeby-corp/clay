import { describe, expect, test } from 'bun:test';
import {
  CLAY_CATALOGS,
  fallbackChain,
  formatDate,
  formatNumber,
  formatRelativeTime,
  matchLocale,
  mergeCatalogs,
  monthNames,
  normalizeLocale,
  translate,
  weekdayNames,
  weekStartsOn,
} from './index';

const en = CLAY_CATALOGS.en!;
const pt = CLAY_CATALOGS['pt-PT']!;
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('built-in catalogs', () => {
  test('every English key exists in pt-PT with a non-empty translation', () => {
    const missing = Object.keys(en).filter((k) => typeof pt[k] !== 'string' || !pt[k]!.trim());
    expect(missing).toEqual([]);
  });

  test('pt-PT has no keys English lacks', () => {
    expect(Object.keys(pt).filter((k) => !(k in en))).toEqual([]);
  });

  test('pt-PT keeps the same {placeholders} as English', () => {
    const mismatched = Object.keys(en).filter(
      (k) => JSON.stringify(placeholders(en[k]!)) !== JSON.stringify(placeholders(pt[k] ?? '')),
    );
    expect(mismatched).toEqual([]);
  });

  test('plural keys come in _one/_other pairs', () => {
    for (const k of Object.keys(en)) {
      if (k.endsWith('_one')) expect(en[k.replace(/_one$/, '_other')]).toBeString();
      if (k.endsWith('_other')) expect(en[k.replace(/_other$/, '_one')]).toBeString();
    }
  });

  test('keys are namespaced', () => {
    expect(Object.keys(en).filter((k) => !/^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9_]+)+$/.test(k))).toEqual([]);
  });

  test('pt-PT avoids Brazilian Portuguese vocabulary', () => {
    const brazilian = /\b(Tela|Arquivo|Salvar|Usuário|Baixar|Carregando|Deletar|Configurações|Registro|Contato|Digite|Time)\b/;
    const offenders = Object.entries(pt).filter(([, v]) => brazilian.test(v));
    expect(offenders).toEqual([]);
  });

  test('spot-check European Portuguese wording', () => {
    expect(pt['common.searchPlaceholder']).toBe('Pesquisar...');
    expect(pt['common.noResults']).toBe('Sem resultados.');
    expect(pt['common.loading']).toBe('A carregar...');
  });
});

describe('translate', () => {
  const catalogs = mergeCatalogs(
    { en: { 'a.hello': 'Hello {name}', 'a.only': 'English only', 'a.items_one': '{count} item', 'a.items_other': '{count} items' } },
    { 'pt-PT': { 'a.hello': 'Olá {name}', 'a.items_one': '{count} item', 'a.items_other': '{count} itens' } },
  );

  test('looks up the locale and interpolates', () => {
    expect(translate(catalogs, 'pt-PT', 'a.hello', { name: 'Ana' })).toBe('Olá Ana');
    expect(translate(catalogs, 'en', 'a.hello', { name: 'Ana' })).toBe('Hello Ana');
  });

  test('missing key falls back to English, never to the raw key', () => {
    expect(translate(catalogs, 'pt-PT', 'a.only')).toBe('English only');
    expect(translate(catalogs, 'fr', 'a.hello', { name: 'x' })).toBe('Hello x');
  });

  test('regional variants fall back to a same-language catalog', () => {
    expect(translate(catalogs, 'pt-BR', 'a.hello', { name: 'Ana' })).toBe('Olá Ana');
    expect(fallbackChain('pt-BR', ['en', 'pt-PT'])).toEqual(['pt-BR', 'pt', 'pt-PT', 'en']);
  });

  test('plurals use Intl.PluralRules and format the count for the locale', () => {
    expect(translate(catalogs, 'en', 'a.items', { count: 1 })).toBe('1 item');
    expect(translate(catalogs, 'en', 'a.items', { count: 1200 })).toBe('1,200 items');
    expect(translate(catalogs, 'pt-PT', 'a.items', { count: 0 })).toBe('0 itens');
    expect(translate(catalogs, 'pt-PT', 'a.items', { count: 1 })).toBe('1 item');
  });

  test('unknown placeholders are left intact; unknown keys use the explicit fallback', () => {
    expect(translate(catalogs, 'en', 'a.hello')).toBe('Hello {name}');
    expect(translate(catalogs, 'en', 'nope', undefined, 'Fallback')).toBe('Fallback');
  });

  test('mergeCatalogs overrides per key and normalises locale tags', () => {
    const merged = mergeCatalogs(catalogs, { pt_pt: { 'a.hello': 'Viva {name}' } });
    expect(merged['pt-PT']!['a.hello']).toBe('Viva {name}');
    expect(merged['pt-PT']!['a.items_other']).toBe('{count} itens');
    expect(catalogs['pt-PT']!['a.hello']).toBe('Olá {name}');
  });
});

describe('locale matching', () => {
  test('normalizeLocale canonicalises and rejects junk', () => {
    expect(normalizeLocale('pt_pt')).toBe('pt-PT');
    expect(normalizeLocale('EN-us')).toBe('en-US');
    expect(normalizeLocale('')).toBeNull();
    expect(normalizeLocale('<script>')).toBeNull();
    expect(normalizeLocale(42)).toBeNull();
  });

  test('matchLocale walks preferences in order (exact, then same language), else null', () => {
    const supported = ['en', 'pt-PT'];
    expect(matchLocale(['pt-PT'], supported)).toBe('pt-PT');
    expect(matchLocale(['pt-BR', 'en'], supported)).toBe('pt-PT');
    expect(matchLocale(['de-DE', 'en-GB', 'pt-PT'], supported)).toBe('en');
    expect(matchLocale(['pt-BR'], supported)).toBe('pt-PT');
    expect(matchLocale(['en-GB'], supported)).toBe('en');
    expect(matchLocale(['de-DE'], supported)).toBeNull();
  });
});

describe('Intl formatting', () => {
  test('numbers and dates follow the locale', () => {
    expect(formatNumber('en', 1234.5)).toBe('1,234.5');
    expect(formatNumber('pt-PT', 1234.5)).toMatch(/^1\s?234,5$/);
    const d = new Date(Date.UTC(2026, 10, 27, 12));
    expect(formatDate('pt-PT', d, { month: 'long', timeZone: 'UTC' })).toBe('novembro');
    expect(formatDate('en', 'not a date')).toBe('');
  });

  test('relative time', () => {
    const now = Date.UTC(2026, 0, 10, 12);
    expect(formatRelativeTime('en', now - 3 * 60_000, now)).toBe('3 minutes ago');
    expect(formatRelativeTime('pt-PT', now - 3 * 60_000, now)).toBe('há 3 minutos');
    expect(formatRelativeTime('pt-PT', now - 24 * 3600_000, now)).toBe('ontem');
  });

  test('calendar helpers: week start and month/weekday names', () => {
    expect(weekStartsOn('pt-PT')).toBe(1);
    expect(weekStartsOn('en-US')).toBe(0);
    expect(weekStartsOn('en')).toBe(0);
    expect(monthNames('pt-PT')[0]).toBe('janeiro');
    expect(weekdayNames('pt-PT', 'long')[1]).toBe('segunda-feira');
    expect(weekdayNames('en', 'short')[0]).toBe('Sun');
  });
});
