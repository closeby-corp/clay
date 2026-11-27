import type { MessageDict } from '../translate';

/**
 * Strings Clay builds on the server (element props, notices) where the client has no
 * fallback of its own. Translated at build time with the session locale (`t()` in
 * `../../locale.ts`); `ui.setLocale` remounts the page so they rebuild.
 */
export const en = {
  'server.themePicker.label': 'Theme',
  'server.themePicker.appearance': 'Appearance',
  'server.themePicker.light': 'Light',
  'server.themePicker.dark': 'Dark',
  'server.themePicker.system': 'System',
  'server.themePicker.palette': 'Palette',
  'server.presence.online': '{count} online',
  'server.prompt.title': 'Prompt',
  'server.choose.title': 'Choose',
  'server.selectionActions.explain': 'Explain',
  'server.selectionActions.improve': 'Improve',
  'server.selectionActions.shorten': 'Shorten',
  'server.selectionActions.tone': 'Tone',
  'server.selectionActions.grammar': 'Grammar',
  'server.dataTable.keyColumn': 'Key',
  'server.dataTable.valueColumn': 'Value',
  'server.dataTable.exportDownloaded': 'Downloaded {format}',
  'server.dataTable.exportCopied': 'Copied {format} to clipboard',
  'server.pages.examplesGroup': 'Examples',
} satisfies MessageDict;

export const ptPT: Record<keyof typeof en, string> = {
  'server.themePicker.label': 'Tema',
  'server.themePicker.appearance': 'Aspeto',
  'server.themePicker.light': 'Claro',
  'server.themePicker.dark': 'Escuro',
  'server.themePicker.system': 'Sistema',
  'server.themePicker.palette': 'Paleta',
  'server.presence.online': '{count} online',
  'server.prompt.title': 'Introduzir valor',
  'server.choose.title': 'Escolher',
  'server.selectionActions.explain': 'Explicar',
  'server.selectionActions.improve': 'Melhorar',
  'server.selectionActions.shorten': 'Encurtar',
  'server.selectionActions.tone': 'Tom',
  'server.selectionActions.grammar': 'Gramática',
  'server.dataTable.keyColumn': 'Chave',
  'server.dataTable.valueColumn': 'Valor',
  'server.dataTable.exportDownloaded': '{format} transferido',
  'server.dataTable.exportCopied': '{format} copiado para a área de transferência',
  'server.pages.examplesGroup': 'Exemplos',
};
