import type { MessageCatalogs, PluralBase } from './translate';
import * as common from './messages/common';
import * as dataTable from './messages/dataTable';
import * as widgets from './messages/widgets';
import * as viz from './messages/viz';
import * as shell from './messages/shell';
import * as server from './messages/server';

/** Built-in English messages (the fallback for every locale). */
export const en = {
  ...common.en,
  ...dataTable.en,
  ...widgets.en,
  ...viz.en,
  ...shell.en,
  ...server.en,
};

/** Every built-in Clay message key. */
export type ClayMessageKey = keyof typeof en;

/** A key accepted by `t()`: any catalog key, or the base of a `_one`/`_other` plural pair. */
export type ClayTranslationKey = PluralBase<ClayMessageKey>;

/** A complete Clay catalog (every key). Use `Partial<ClayMessages>` for overrides. */
export type ClayMessages = Record<ClayMessageKey, string>;

/** Built-in European Portuguese messages. */
export const ptPT: ClayMessages = {
  ...common.ptPT,
  ...dataTable.ptPT,
  ...widgets.ptPT,
  ...viz.ptPT,
  ...shell.ptPT,
  ...server.ptPT,
};

/** Catalogs shipped with Clay, keyed by locale. */
export const CLAY_CATALOGS: MessageCatalogs = {
  en,
  'pt-PT': ptPT,
};

/** Locales with a built-in catalog. */
export const CLAY_LOCALES = Object.keys(CLAY_CATALOGS) as readonly string[];
