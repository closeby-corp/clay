import { ui } from '@clay/ui';

/**
 * Page intro under the shell SiteHeader.
 * Pass title only when it differs from the active nav / headerTitle.
 */
export function exampleHeader(title?: string, description?: string): void {
  if (!title && !description) return;
  ui.column(() => {
    if (title) {
      ui.label(title).classes('text-2xl font-semibold tracking-tight');
    }
    if (description) {
      ui.label(description).classes('text-sm text-muted-foreground');
    }
  }, { gap: 1 });
}

/** Section label above a preview block. */
export function exampleSection(title: string, description?: string): void {
  ui.column(() => {
    ui.label(title).classes('text-sm font-medium leading-none');
    if (description) {
      ui.label(description).classes('text-sm text-muted-foreground');
    }
  }, { gap: 1 });
}

/** Constrain examples inside the full-bleed shell (wide enough for boards/tables). */
export function exampleFrame(fn: () => void): void {
  ui.container({ centered: true, width: '6xl' }, fn);
}
