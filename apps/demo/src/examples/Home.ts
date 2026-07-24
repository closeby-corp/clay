import { ui } from '@badui/ui';
import { APP_SHELL } from '../nav';

ui.page('/', () => {
  ui.app({ ...APP_SHELL }, () => {
    ui.column(() => {
      ui.label('BadUI').classes('text-5xl font-bold tracking-tight');
      ui.label('Server-driven UI for TypeScript — NiceGUI-like API, React + ShadCN client')
        .classes('max-w-xl text-lg text-muted-foreground');
      ui.label('WebSocket element tree · refreshable regions · bindValue / bindTextFrom')
        .classes('text-sm text-muted-foreground');
      ui.label('Pick an example from the sidebar to explore patterns.')
        .classes('mt-4 text-sm text-muted-foreground');
    }, { gap: 2 });
  });
});
