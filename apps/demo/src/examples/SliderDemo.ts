import { reactive, subscribe } from '@badui/core';
import { ui } from '@badui/ui';

ui.page('/examples/slider-demo', () => {
  ui.app({ ...APP_SHELL }, () => {
  const state = reactive({
    volume: 50,
    brightness: 75,
    muted: false,
    theme: 'light',
  });

  ui.container(() => {
    ui.column(() => {
      ui.label('NiceGUI-Style Controls').classes('text-3xl font-bold');
      ui.label('bindValue keeps controls in sync over WebSocket.')
        .classes('text-muted-foreground');

      ui.card(() => {
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
      });

      const valuesUi = ui.refreshable(() => {
        ui.card(() => {
          ui.label('Current Values').classes('font-bold');
          ui.label(`Volume: ${state.volume}`);
          ui.label(`Brightness: ${state.brightness}`);
          ui.label(`Muted: ${state.muted ? 'Yes' : 'No'}`);
          ui.label(`Theme: ${state.theme}`);
        });
      });

      for (const key of ['volume', 'brightness', 'muted', 'theme'] as const) {
        subscribe(state, key, () => valuesUi.refresh());
      }

      ui.row(() => {
        ui.button('Max Volume', {
          onClick: () => {
            state.volume = 100;
          },
        });
        ui.button('Mute', {
          variant: 'secondary',
          onClick: () => {
            state.muted = true;
            state.volume = 0;
          },
        });
      }, { gap: 2 });
    }, { gap: 3 });
  }, { centered: true, width: 'lg' });
  });
});
import { APP_SHELL } from '../nav';

