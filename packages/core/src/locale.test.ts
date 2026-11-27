import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  ClientSession,
  availableLocales,
  clearPages,
  clientI18nBoot,
  configureI18n,
  defineMessages,
  formatNumber,
  getDefaultLocale,
  getLocale,
  page,
  resetIdSequence,
  resolveHelloLocale,
  runWithSession,
  setLocale,
  t,
  type ServerMessage,
  setCurrentSession,
} from './index';

function session(locale: string | null = null, sent: ServerMessage[] = []): ClientSession {
  const s = new ClientSession('/locale-test', (m) => sent.push(m));
  s.locale = locale;
  return s;
}

describe('server i18n runtime', () => {
  beforeEach(() => {
    setCurrentSession(null);
    clearPages();
    resetIdSequence();
    page('/locale-test', () => {});
  });
  afterEach(() => configureI18n(null));

  describe('configureI18n', () => {
    test('defaults to English with the built-in catalogs', () => {
      configureI18n(null);
      expect(getDefaultLocale()).toBe('en');
      expect(getLocale()).toBe('en');
      expect(availableLocales()).toEqual(['en', 'pt-PT']);
      expect(clientI18nBoot()).toEqual({ locale: 'en', locales: ['en', 'pt-PT'], messages: {} });
      expect(t('common.cancel')).toBe('Cancel');
    });

    test('explicit default locale is normalised and used outside sessions', () => {
      configureI18n({ locale: 'pt_pt' });
      expect(getDefaultLocale()).toBe('pt-PT');
      expect(getLocale()).toBe('pt-PT');
      expect(t('common.cancel')).toBe('Cancelar');
      expect(clientI18nBoot().locale).toBe('pt-PT');
      expect(() => configureI18n({ locale: 'not a locale!' })).toThrow('Invalid locale');
    });

    test("'auto' keeps English as the default and tells the client to follow the browser", () => {
      configureI18n({ locale: 'auto' });
      expect(getDefaultLocale()).toBe('en');
      expect(clientI18nBoot().locale).toBe('auto');
    });

    test('overrides add locales; only Clay keys are shipped to the client', () => {
      configureI18n({
        messages: {
          'pt-pt': { 'common.cancel': 'Desistir', 'app.only': 'Só da app' },
          es: { 'common.cancel': 'Cancelar (es)' },
        },
      });
      expect(availableLocales()).toEqual(['en', 'pt-PT', 'es']);
      expect(clientI18nBoot().messages).toEqual({
        'pt-PT': { 'common.cancel': 'Desistir' },
        es: { 'common.cancel': 'Cancelar (es)' },
      });
    });
  });

  describe('resolveHelloLocale', () => {
    test('stored choice wins when it has a catalog (case / separator insensitive)', () => {
      expect(resolveHelloLocale('pt_pt', ['en-US'])).toBe('pt-PT');
      expect(resolveHelloLocale('en', ['pt-PT'])).toBe('en');
    });

    test('a stored choice without a catalog is kept (English text, its own formatting)', () => {
      expect(resolveHelloLocale('fr', ['pt-PT'])).toBe('fr');
    });

    test('invalid stored values fall back to the app default', () => {
      expect(resolveHelloLocale(42, undefined)).toBe('en');
      configureI18n({ locale: 'pt-PT' });
      expect(resolveHelloLocale('<script>', ['en'])).toBe('pt-PT');
    });

    test("'auto' matches browser languages by language (pt-BR → pt-PT), else English", () => {
      configureI18n({ locale: 'auto' });
      expect(resolveHelloLocale(undefined, ['pt-BR', 'en-US'])).toBe('pt-PT');
      expect(resolveHelloLocale(undefined, ['de-DE', 'en-GB'])).toBe('en');
      expect(resolveHelloLocale(undefined, ['de-DE'])).toBe('en');
      expect(resolveHelloLocale(undefined, 'pt-PT')).toBe('en'); // not an array
      expect(resolveHelloLocale(null, [1, 'pt'])).toBe('pt-PT');
      // A stored choice still beats the browser.
      expect(resolveHelloLocale('en', ['pt-PT'])).toBe('en');
    });

    test('without auto, browser languages are ignored', () => {
      expect(resolveHelloLocale(undefined, ['pt-PT'])).toBe('en');
    });
  });

  describe('setLocale / getLocale', () => {
    test('sends a locale op and switches getLocale / t for the session', () => {
      const sent: ServerMessage[] = [];
      const s = session(null, sent);
      s.mount();
      sent.length = 0;
      runWithSession(s, () => {
        expect(getLocale()).toBe('en');
        setLocale('pt-pt');
        expect(getLocale()).toBe('pt-PT');
        expect(t('common.cancel')).toBe('Cancelar');
        expect(formatNumber(1234.5)).toBe(new Intl.NumberFormat('pt-PT').format(1234.5));
        setLocale('en', { remount: false });
        expect(getLocale()).toBe('en');
      });
      expect(sent.filter((m) => m.op === 'locale')).toEqual([
        { op: 'locale', locale: 'pt-PT', remount: true },
        { op: 'locale', locale: 'en', remount: false },
      ]);
      // Outside the session, the app default applies.
      expect(getLocale()).toBe('en');
    });

    test('null clears the choice back to the app default; shell session follows', () => {
      configureI18n({ locale: 'pt-PT' });
      const sent: ServerMessage[] = [];
      const s = session('en', sent);
      const shell = session('en');
      s.shellSession = shell;
      runWithSession(s, () => setLocale(null));
      expect(s.locale).toBe('pt-PT');
      expect(shell.locale).toBe('pt-PT');
      expect(sent.at(-1)).toEqual({ op: 'locale', locale: null, remount: true });
    });

    test("null under locale: 'auto' re-resolves from the browser languages", () => {
      configureI18n({ locale: 'auto' });
      const s = session('en');
      s.clientLanguages = ['pt-BR', 'en'];
      runWithSession(s, () => setLocale(null, { remount: false }));
      expect(s.locale).toBe('pt-PT');
    });

    test('called from the shell session, the mounted page session follows', () => {
      const shell = session('en');
      const page = session('en');
      shell.pageSession = page;
      page.shellSession = shell;
      runWithSession(shell, () => setLocale('pt-PT', { remount: false }));
      expect(page.locale).toBe('pt-PT');
      runWithSession(page, () => expect(t('common.cancel')).toBe('Cancelar'));
    });

    test('invalid locales throw; no session is a no-op', () => {
      const s = session();
      expect(() => runWithSession(s, () => setLocale('???'))).toThrow('Invalid locale');
      expect(() => setLocale('pt-PT')).not.toThrow();
      expect(getLocale()).toBe('en');
    });
  });

  describe('t()', () => {
    test('app overrides take precedence over built-in messages', () => {
      configureI18n({ messages: { 'pt-PT': { 'common.cancel': 'Desistir' }, en: { 'common.ok': 'Okay' } } });
      runWithSession(session('pt-PT'), () => {
        expect(t('common.cancel')).toBe('Desistir');
        // Not overridden in pt-PT → built-in pt-PT.
        expect(t('common.close')).toBe('Fechar');
      });
      expect(t('common.ok')).toBe('Okay');
    });

    test('keys missing from a locale fall back to English', () => {
      configureI18n({ messages: { en: { 'app.welcome': 'Welcome, {name}' }, es: { 'common.cancel': 'Cancelar' } } });
      runWithSession(session('pt-PT'), () => {
        expect(t('app.welcome', { name: 'Ana' })).toBe('Welcome, Ana');
      });
      runWithSession(session('es'), () => {
        expect(t('common.cancel')).toBe('Cancelar');
        expect(t('common.close')).toBe('Close');
      });
      // Region variants use the language's catalog (pt-BR → pt-PT), then English.
      runWithSession(session('pt-BR'), () => expect(t('common.close')).toBe('Fechar'));
      expect(t('no.such.key')).toBe('no.such.key');
    });
  });

  describe('defineMessages', () => {
    const msg = defineMessages({
      en: { greeting: 'Hello, {name}', items_one: '{count} item', items_other: '{count} items', onlyEn: 'English only' },
      'pt-PT': { greeting: 'Olá, {name}', items_one: '{count} item', items_other: '{count} itens' },
    });

    test('uses the session locale with plurals and English fallback', () => {
      expect(msg('greeting', { name: 'Ada' })).toBe('Hello, Ada');
      expect(msg('items', { count: 1 })).toBe('1 item');
      expect(msg('items', { count: 3 })).toBe('3 items');
      runWithSession(session('pt-PT'), () => {
        expect(msg('greeting', { name: 'Ada' })).toBe('Olá, Ada');
        expect(msg('items', { count: 1 })).toBe('1 item');
        expect(msg('items', { count: 0 })).toBe('0 itens');
        expect(msg('items', { count: 1500 })).toBe(`${new Intl.NumberFormat('pt-PT').format(1500)} itens`);
        expect(msg('onlyEn')).toBe('English only');
      });
    });

    test('.in() translates for an explicit locale; .locales lists dictionaries', () => {
      expect(msg.in('pt_PT', 'items', { count: 2 })).toBe('2 itens');
      expect(msg.in('pt-BR', 'greeting', { name: 'Rui' })).toBe('Olá, Rui');
      expect(msg.in('de', 'greeting', { name: 'Jan' })).toBe('Hello, Jan');
      expect(msg.in('garbage!', 'greeting', { name: 'X' })).toBe('Hello, X');
      expect(msg.locales).toEqual(['en', 'pt-PT']);
    });
  });
});
