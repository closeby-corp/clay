import { ui } from '@badui/ui';
import { exampleHeader, exampleFrame } from '../chrome';

export const pageMeta = {
  label: 'Home',
  icon: 'home',
  order: 0,
};

ui.page('/', () => {
    exampleFrame(() => {
      ui.column(() => {
        exampleHeader(
          undefined,
          'Server-driven UI for TypeScript — NiceGUI-like API with a React + ShadCN client.',
        );
        ui.card(
          {
            title: 'Getting started',
            description:
              'Pick an example from the sidebar. Patterns cover element refs, bindValue, refreshable regions, and GlobalState.',
            gap: 3,
          },
          () => {
            ui.label('WebSocket element tree · refreshable · bindValue / bindTextFrom')
              .classes('text-sm text-muted-foreground');
            ui.label('Open Kitchen Sink for the full ShadCN component catalog.')
              .classes('text-sm text-muted-foreground');
            ui.label('Dashboard shows refreshable stats and a full-chrome DataTable.')
              .classes('text-sm text-muted-foreground');
            ui.label('Charts covers area / bar / line / pie / radar / radial — interactive ranges, cards, and live refresh.')
              .classes('text-sm text-muted-foreground');
            ui.label('Timer & content shows ui.timer, markdown, html, and image.')
              .classes('text-sm text-muted-foreground');
          },
        );
      }, { gap: 6 });
    });
});
