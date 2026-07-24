import { Element, getCurrentSession, withParent } from '@badui/core';
import { DialogElement } from './dialog';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

export type ConfirmOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
};

export type PromptOptions = {
  title?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export type ChooseOption = string | { value: string; label: string };

export type ChooseOptions = {
  title?: string;
  cancelLabel?: string;
};

function normalizeChoices(choices: ChooseOption[]): Array<{ value: string; label: string }> {
  return choices.map((c) => (typeof c === 'string' ? { value: c, label: c } : c));
}

function makeButton(
  text: string,
  props: { variant?: ButtonVariant; onClick?: () => void | Promise<void> },
): Element {
  return new Element('button', {
    text,
    variant: props.variant ?? 'default',
    size: 'default',
    disabled: false,
    onClick: props.onClick,
  });
}

function makeLabel(text: string, className?: string): Element {
  return new Element('label', { text, className });
}

function makeInput(props: {
  value: string;
  placeholder?: string;
  onInput?: (value: string) => void;
}): Element {
  return new Element('input', {
    value: props.value,
    placeholder: props.placeholder ?? '',
    type: 'text',
    onInput: props.onInput,
  });
}

function detachDialog(dlg: DialogElement): void {
  const session = getCurrentSession();
  const parent = dlg.parent;
  if (parent) {
    parent.children = parent.children.filter((c) => c.id !== dlg.id);
    dlg.parent = null;
  }
  dlg.destroy();
  session?.syncRootChildren();
  session?.flushPatches();
}

function runEphemeralDialog<T>(
  fallback: T,
  build: (settle: (value: T) => void) => DialogElement,
): Promise<T> {
  const session = getCurrentSession();
  if (!session?.root) return Promise.resolve(fallback);

  return new Promise<T>((resolve) => {
    let settled = false;
    const settle = (value: T) => {
      if (settled) return;
      settled = true;
      dlg.close();
      detachDialog(dlg);
      resolve(value);
    };

    let dlg!: DialogElement;
    withParent(session.root, () => {
      dlg = build(settle);
    });

    dlg.open();
    session.syncRootChildren();
    session.flushPatches();
  });
}

export function confirm(message: string, options: ConfirmOptions = {}): Promise<boolean> {
  const title = options.title ?? 'Confirm';
  const confirmLabel = options.confirmLabel ?? 'OK';
  const cancelLabel = options.cancelLabel ?? 'Cancel';
  const confirmVariant = options.confirmVariant ?? 'default';

  return runEphemeralDialog(false, (settle) => {
    const dlg = new DialogElement({
      title,
      open: false,
      onClose: () => settle(false),
    });
    withParent(dlg, () => {
      makeLabel(message, 'text-muted-foreground');
      const actions = new Element('row', { gap: 2 });
      withParent(actions, () => {
        makeButton(cancelLabel, {
          variant: 'outline',
          onClick: () => settle(false),
        });
        makeButton(confirmLabel, {
          variant: confirmVariant,
          onClick: () => settle(true),
        });
      });
    });
    return dlg;
  });
}

export function prompt(message: string, options: PromptOptions = {}): Promise<string | null> {
  const title = options.title ?? 'Prompt';
  const confirmLabel = options.confirmLabel ?? 'OK';
  const cancelLabel = options.cancelLabel ?? 'Cancel';
  let value = options.defaultValue ?? '';

  return runEphemeralDialog<string | null>(null, (settle) => {
    const dlg = new DialogElement({
      title,
      open: false,
      onClose: () => settle(null),
    });
    withParent(dlg, () => {
      const body = new Element('column', { gap: 3 });
      withParent(body, () => {
        makeLabel(message, 'text-muted-foreground');
        makeInput({
          value,
          placeholder: options.placeholder,
          onInput: (next) => {
            value = String(next ?? '');
          },
        });
      });
      const actions = new Element('row', { gap: 2 });
      withParent(actions, () => {
        makeButton(cancelLabel, {
          variant: 'outline',
          onClick: () => settle(null),
        });
        makeButton(confirmLabel, {
          onClick: () => settle(value),
        });
      });
    });
    return dlg;
  });
}

export function choose(
  message: string,
  choices: ChooseOption[],
  options: ChooseOptions = {},
): Promise<string | null> {
  const title = options.title ?? 'Choose';
  const cancelLabel = options.cancelLabel ?? 'Cancel';
  const items = normalizeChoices(choices);

  return runEphemeralDialog<string | null>(null, (settle) => {
    const dlg = new DialogElement({
      title,
      open: false,
      onClose: () => settle(null),
    });
    withParent(dlg, () => {
      const body = new Element('column', { gap: 3 });
      withParent(body, () => {
        makeLabel(message, 'text-muted-foreground');
        const list = new Element('column', { gap: 2 });
        withParent(list, () => {
          for (const item of items) {
            makeButton(item.label, {
              variant: 'outline',
              onClick: () => settle(item.value),
            });
          }
        });
      });
      makeButton(cancelLabel, {
        variant: 'ghost',
        onClick: () => settle(null),
      });
    });
    return dlg;
  });
}
