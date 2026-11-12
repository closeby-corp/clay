import { ui } from '@close-by/clay';

/**
 * Page intro under the shell SiteHeader.
 * Pass title only when it differs from the active nav / headerTitle.
 */
export function exampleHeader(title?: string, description?: string, actions?: () => void): void {
  if (!title && !description && !actions) return;
  if (title) {
    ui.pageHeading({ title, description }, actions);
    return;
  }
  ui.row(() => {
    if (description) ui.label(description).classes('text-sm text-muted-foreground flex-1');
    if (actions) ui.row(actions, { gap: 2 }).classes('ml-auto shrink-0');
  }, { gap: 4 }).classes('items-start justify-between');
}

/** Section label above a preview block. */
export function exampleSection(title: string, description?: string): void {
  ui.column(() => {
    ui.label(title).classes('text-base font-semibold tracking-tight leading-none');
    if (description) {
      ui.label(description).classes('text-sm text-muted-foreground');
    }
  }, { gap: 1 });
}

/** Constrain examples inside the full-bleed shell (wide enough for boards/tables). */
export function exampleFrame(fn: () => void): void {
  ui.container({ centered: true, width: '6xl' }, fn);
}
