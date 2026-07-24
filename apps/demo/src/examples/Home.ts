import { ui } from '@badui/ui';

const EXAMPLES = [
  { href: '/examples/counter', title: 'Counter', description: 'Element refs, setText, and refreshable history' },
  { href: '/examples/todo', title: 'Todo', description: 'bindValue, refreshable list, checkboxes' },
  { href: '/examples/chat', title: 'Chat', description: 'Shared messages via GlobalState' },
  { href: '/examples/upload', title: 'File Upload', description: 'Mock upload list with refreshable UI' },
  { href: '/examples/dashboard', title: 'Dashboard', description: 'Stats and simple data table' },
  { href: '/examples/datatable', title: 'DataTable', description: 'Sortable table of sample rows' },
  { href: '/examples/slider-demo', title: 'Slider Demo', description: 'Sliders, checkbox, and select' },
  { href: '/examples/form-demo', title: 'Form Demo', description: 'Form controls and live values' },
] as const;

ui.page('/', () => {
  ui.hero(() => {
    ui.column(() => {
      ui.label('BadUI').classes('text-5xl font-bold tracking-tight');
      ui.label('Server-driven UI for TypeScript — NiceGUI-like API, React + ShadCN client')
        .classes('max-w-xl text-lg text-muted-foreground');
      ui.label('WebSocket element tree · refreshable regions · bindValue / bindTextFrom')
        .classes('text-sm text-muted-foreground mb-6');

      ui.label('Examples').classes('text-xl font-semibold mb-2');

      ui.column(() => {
        for (const example of EXAMPLES) {
          ui.link(example.title, example.href).classes('text-lg font-medium');
          ui.label(example.description).classes('text-sm text-muted-foreground -mt-1 mb-2');
        }
      }, { gap: 1 });
    }, { gap: 2 });
  });
});
