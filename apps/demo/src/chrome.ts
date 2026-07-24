import { ui } from '@badui/ui';

/** Docs-style page header used across demo examples. */
export function exampleHeader(title: string, description?: string): void {
  ui.column(() => {
    ui.label(title).classes('text-2xl font-semibold tracking-tight');
    if (description) {
      ui.label(description).classes('text-sm text-muted-foreground');
    }
  }, { gap: 1 });
}

/** Section label above a preview block (ShadCN docs “Examples” rhythm). */
export function exampleSection(title: string, description?: string): void {
  ui.column(() => {
    ui.label(title).classes('text-sm font-medium leading-none');
    if (description) {
      ui.label(description).classes('text-sm text-muted-foreground');
    }
  }, { gap: 1 });
}
