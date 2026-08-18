import { Element, getCurrentSession, withParent } from '@close-by/clay-core';
import { AlertDialogElement } from './alert-dialog';
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

function detachElement(el: Element): void {
  const session = getCurrentSession();
  const parent = el.parent;
  if (parent) {
    parent.children = parent.children.filter((c) => c.id !== el.id);
    el.parent = null;
  }
  el.destroy();
  session?.syncRootChildren();
  session?.flushPatches();
}

function runEphemeralDialog<T>(
  fallback: T,
  build: (settle: (value: T) => void) => DialogElement,
): Promise<T> {
  const session = getCurrentSession();
  const root = session?.root;
  if (!session || !root) return Promise.resolve(fallback);

  return new Promise<T>((resolve) => {
    let settled = false;
    const settle = (value: T) => {
      if (settled) return;
      settled = true;
      dlg.close();
      detachElement(dlg);
      resolve(value);
    };

    let dlg!: DialogElement;
    withParent(root, () => {
      dlg = build(settle);
    });

    dlg.open();
    session.syncRootChildren();
    session.flushPatches();
  });
}

function runEphemeralAlertDialog(
  fallback: boolean,
  build: (settle: (value: boolean) => void) => AlertDialogElement,
): Promise<boolean> {
  const session = getCurrentSession();
  const root = session?.root;
  if (!session || !root) return Promise.resolve(fallback);

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      dlg.close();
      detachElement(dlg);
      resolve(value);
    };

    let dlg!: AlertDialogElement;
    withParent(root, () => {
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

  return runEphemeralAlertDialog(false, (settle) =>
    new AlertDialogElement({
      title,
      description: message,
      confirmLabel,
      cancelLabel,
      confirmVariant,
      open: false,
      onConfirm: () => settle(true),
      onClose: () => settle(false),
    }),
  );
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
