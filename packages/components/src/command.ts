import { Element, withParent } from '@clay/core';

export type CommandMode = 'dialog' | 'inline';

export type CommandProps = {
  /**
   * `dialog` (default) — modal command palette with server-owned `open`.
   * `inline` — always-visible command list (no dialog chrome).
   */
  mode?: CommandMode;
  /** Server-owned open state (dialog mode only; default false). */
  open?: boolean;
  title?: string;
  description?: string;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  onOpenChange?: (open: boolean) => void | Promise<void>;
};

export type CommandItemOptions = {
  disabled?: boolean;
  shortcut?: string;
  onSelect?: () => void | Promise<void>;
};

export class CommandGroupElement extends Element {
  constructor(heading: string) {
    super('commandgroup', { heading });
  }

  item(value: string, label: string, opts: CommandItemOptions = {}): Element {
    return new Element('commanditem', {
      value,
      label,
      disabled: opts.disabled ?? false,
      shortcut: opts.shortcut,
      onSelect: opts.onSelect,
    });
  }
}

export class CommandElement extends Element {
  constructor(props: CommandProps = {}) {
    const mode: CommandMode = props.mode === 'inline' ? 'inline' : 'dialog';
    super('command', {
      mode,
      open: mode === 'inline' ? true : (props.open ?? false),
      title: props.title ?? 'Command Palette',
      description: props.description ?? 'Search for a command to run…',
      placeholder: props.placeholder ?? 'Type a command or search…',
      emptyText: props.emptyText ?? 'No results found.',
      className: props.className,
      onOpenChange: mode === 'dialog' ? props.onOpenChange : undefined,
    });

    if (mode === 'dialog') {
      this.on('openChange', async (value) => {
        this.setOpen(!!value);
      });
    }
  }

  setOpen(open: boolean): this {
    if (this.props.mode === 'inline') return this;
    if (this.props.open === open) return this;
    this.update({ open });
    return this;
  }

  open(): void {
    this.setOpen(true);
  }

  close(): void {
    this.setOpen(false);
  }

  group(heading: string, fn: (g: CommandGroupElement) => void): CommandGroupElement {
    const group = new CommandGroupElement(heading);
    withParent(group, () => fn(group));
    return group;
  }

  separator(): Element {
    return new Element('commandseparator', {});
  }
}

export function command(
  fn: (c: CommandElement) => void,
  props?: CommandProps,
): CommandElement;
export function command(
  props: CommandProps,
  fn: (c: CommandElement) => void,
): CommandElement;
export function command(
  propsOrFn: CommandProps | ((c: CommandElement) => void),
  fnOrProps?: ((c: CommandElement) => void) | CommandProps,
): CommandElement {
  let props: CommandProps = {};
  let fn: (c: CommandElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as CommandProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (c: CommandElement) => void;
  }

  const el = new CommandElement(props);
  withParent(el, () => fn(el));
  return el;
}
