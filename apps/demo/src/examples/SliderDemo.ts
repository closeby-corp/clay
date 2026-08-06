import { ui, reactive, subscribe } from '@badui/ui';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'Slider Demo',
  icon: 'sliders-horizontal',
  order: 70,
};

ui.page('/examples/slider-demo', () => {
    const state = reactive({
      volume: 50,
      brightness: 75,
      muted: false,
      theme: 'light',
    });

    exampleFrame(() => {
      ui.column(() => {
        exampleHeader(undefined, 'bindValue keeps controls in sync over WebSocket.');

      ui.card(
        {
          title: 'Controls',
          description: 'Sliders, checkbox, and select bound to the same reactive object.',
          gap: 4,
        },
        () => {
          ui.slider({
            min: 0,
            max: 100,
            value: state.volume,
            label: 'Volume',
            showValue: true,
          }).bindValue(state, 'volume');

          ui.slider({
            min: 0,
            max: 100,
            value: state.brightness,
            label: 'Brightness',
            showValue: true,
          }).bindValue(state, 'brightness');

          ui.checkbox({ label: 'Mute audio', checked: state.muted }).bindValue(state, 'muted');

          ui.select({
            label: 'Theme',
            value: state.theme,
            options: [
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ],
          }).bindValue(state, 'theme');
        },
      );

      const valuesUi = ui.refreshable(() => {
        ui.card(
          {
            title: 'Current values',
            description: 'Updates when any bound field changes.',
            gap: 2,
          },
          () => {
            ui.label(`Volume: ${state.volume}`).classes('text-sm');
            ui.label(`Brightness: ${state.brightness}`).classes('text-sm');
            ui.label(`Muted: ${state.muted ? 'Yes' : 'No'}`).classes('text-sm');
            ui.label(`Theme: ${state.theme}`).classes('text-sm');
          },
        );
      });

      for (const key of ['volume', 'brightness', 'muted', 'theme'] as const) {
        subscribe(state, key, () => valuesUi.refresh());
      }

      ui.row(() => {
        ui.button('Max volume', {
          variant: 'outline',
          size: 'sm',
          onClick: () => {
            state.volume = 100;
          },
        });
        ui.button('Mute', {
          variant: 'secondary',
          size: 'sm',
          onClick: () => {
            state.muted = true;
            state.volume = 0;
          },
        });
      }, { gap: 2 });
      }, { gap: 6 });
    });
});
