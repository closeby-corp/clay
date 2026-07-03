import { ui, getCurrentContainer } from '@badui/ui';
import { label, row, card, slider, checkbox, select } from '@badui/components';

ui.page('/examples/slider-demo', () => {
  const volume = slider('volume', {
    min: 0,
    max: 100,
    value: 50,
    label: 'Volume',
    showValue: true,
    color: 'primary',
  });

  const brightness = slider('brightness', {
    min: 0,
    max: 100,
    value: 75,
    label: 'Brightness',
    showValue: true,
    color: 'accent',
  });

  const muted = checkbox('muted', {
    label: 'Mute audio',
    color: 'warning',
  });

  const theme = select('theme', [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ], {
    label: 'Theme',
    value: 'light',
  });

  ui.container(() => {
    ui.column(() => {
      ui.label('NiceGUI-Style Controls').classes('text-3xl font-bold');
      ui.label('Form controls use get/set; page state uses plain assignment').classes('text-neutral opacity-70 mb-4');

      getCurrentContainer().add(card({ bordered: true }, volume, brightness, muted, theme));

      getCurrentContainer().add(card(
        { bordered: true, bgColor: 'bg-base-200' },
        label('Current Values').classes('font-bold mb-2'),
        row(label('Volume:').classes('w-24'), label(volume)),
        row(label('Brightness:').classes('w-24'), label(brightness)),
        row(label('Muted:').classes('w-24'), label(() => (muted.get() ? 'Yes' : 'No'))),
        row(label('Theme:').classes('w-24'), label(theme)),
      ));

      ui.row(() => {
        ui.button('Max Volume', {
          color: 'primary',
          on_click: () => { volume.set(100); },
        });
        ui.button('Mute', {
          color: 'warning',
          on_click: () => { muted.set(true); volume.set(0); },
        });
        ui.button('Reset All', {
          variant: 'outline',
          on_click: () => {
            volume.set(50);
            brightness.set(75);
            muted.set(false);
            theme.set('light');
          },
        });
      });
    });
  }, { centered: true, width: 'md' });
});
