import { ui } from '@badui/ui';
import { exampleFrame } from '../chrome';

export const pageMeta = {
  label: 'Home',
  icon: 'home',
  order: 0,
};

ui.page('/', () => {
  exampleFrame(() => {
    ui.column(() => {
      ui.hero(
        {
          gap: 4,
          className: 'min-h-[40vh]',
        },
        () => {
          ui.icon('home').classes('size-10 text-muted-foreground');
          ui.label('BadUI').classes('text-4xl font-semibold tracking-tight');
          ui.label(
            'Server-driven UI for TypeScript — NiceGUI-like API with a React + ShadCN client.',
          ).classes('max-w-md text-sm text-muted-foreground');
          ui.row(() => {
            ui.button('Open Feedback demo', {
              onClick: () => ui.navigate('/examples/feedback'),
            });
            ui.button('Kitchen Sink', {
              variant: 'outline',
              onClick: () => ui.navigate('/examples/kitchen-sink'),
            });
          }, { gap: 2 });
        },
      );

      ui.card(
        {
          title: 'Explore examples',
          description: 'SPA links and imperative navigate — pick a pattern from the sidebar too.',
          gap: 3,
        },
        () => {
          ui.column(() => {
            ui.row(() => {
              ui.icon('lock').classes('size-4 text-muted-foreground');
              ui.link('Account', '/examples/auth');
            }, { gap: 2 }).classes('items-center');
            ui.row(() => {
              ui.icon('form-input').classes('size-4 text-muted-foreground');
              ui.link('Form Demo', '/examples/form-demo');
            }, { gap: 2 }).classes('items-center');
            ui.row(() => {
              ui.icon('layout-dashboard').classes('size-4 text-muted-foreground');
              ui.link('Overlays', '/examples/overlays');
            }, { gap: 2 }).classes('items-center');
            ui.row(() => {
              ui.icon('layers').classes('size-4 text-muted-foreground');
              ui.link('Dialog Stack', '/examples/dialog-stack');
            }, { gap: 2 }).classes('items-center');
            ui.row(() => {
              ui.icon('sliders-horizontal').classes('size-4 text-muted-foreground');
              ui.link('Controls', '/examples/controls');
            }, { gap: 2 }).classes('items-center');
            ui.row(() => {
              ui.icon('help-circle').classes('size-4 text-muted-foreground');
              ui.link('Feedback', '/examples/feedback');
            }, { gap: 2 }).classes('items-center');
            ui.row(() => {
              ui.icon('chart-area').classes('size-4 text-muted-foreground');
              ui.link('Charts', '/examples/charts');
            }, { gap: 2 }).classes('items-center');
            ui.row(() => {
              ui.icon('table-2').classes('size-4 text-muted-foreground');
              ui.link('DataTable', '/examples/datatable');
            }, { gap: 2 }).classes('items-center');
            ui.row(() => {
              ui.icon('upload').classes('size-4 text-muted-foreground');
              ui.link('File Upload', '/examples/upload');
            }, { gap: 2 }).classes('items-center');
            ui.row(() => {
              ui.icon('workflow').classes('size-4 text-muted-foreground');
              ui.link('Flow', '/examples/flow');
            }, { gap: 2 }).classes('items-center');
            ui.row(() => {
              ui.icon('columns-3').classes('size-4 text-muted-foreground');
              ui.link('Kanban', '/examples/kanban');
            }, { gap: 2 }).classes('items-center');
            ui.row(() => {
              ui.icon('file-pen').classes('size-4 text-muted-foreground');
              ui.link('Editor', '/examples/editor');
            }, { gap: 2 }).classes('items-center');
          }, { gap: 2 });
        },
      );
    }, { gap: 6 });
  });
});
