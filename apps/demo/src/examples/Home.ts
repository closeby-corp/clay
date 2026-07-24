import { ui } from '@badui/ui';
import { exampleHeader } from '../chrome';
import { APP_SHELL } from '../nav';

ui.page('/', () => {
  ui.app({ ...APP_SHELL }, () => {
    ui.column(() => {
      exampleHeader(
        'Examples',
        'Server-driven UI for TypeScript — NiceGUI-like API with a React + ShadCN client.',
      );
      ui.card(
        {
          title: 'Getting started',
          description: 'Pick an example from the sidebar. Patterns cover element refs, bindValue, refreshable regions, and GlobalState.',
          gap: 3,
        },
        () => {
          ui.label('WebSocket element tree · refreshable · bindValue / bindTextFrom')
            .classes('text-sm text-muted-foreground');
          ui.label('Open Kitchen Sink for the full ShadCN component catalog.')
            .classes('text-sm text-muted-foreground');
        },
      );
    }, { gap: 6 });
  });
});
