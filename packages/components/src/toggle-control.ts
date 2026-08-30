import { Element } from '@close-by/clay-core';
import { type IconSlotProps, withIconSlot } from './icon-text';

export type ToggleControlVariant = 'default' | 'outline';
export type ToggleControlSize = 'default' | 'sm' | 'lg';

export type ToggleControlProps = IconSlotProps & {
  text?: string;
  pressed?: boolean;
  variant?: ToggleControlVariant;
  size?: ToggleControlSize;
  disabled?: boolean;
  className?: string;
  onPressedChange?: (pressed: boolean) => void | Promise<void>;
};

/** Pressed/on-off control for toolbars (distinct from `switch` and `toggleGroup`). */
export function toggleControl(props: ToggleControlProps = {}): Element {
  return new Element(
    'toggle',
    withIconSlot(props, {
      text: props.text ?? '',
      pressed: props.pressed ?? false,
      variant: props.variant ?? 'default',
      size: props.size ?? 'default',
      disabled: props.disabled ?? false,
      className: props.className,
      onPressedChange: props.onPressedChange,
    }),
  );
}
