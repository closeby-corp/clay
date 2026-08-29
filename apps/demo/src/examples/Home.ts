import { ui } from '@close-by/clay';
import { exampleFrame } from '../chrome';
import { getSessionUser } from './_auth';

export const pageMeta = {
  label: 'Home',
  icon: 'home',
  order: 0,
};

ui.page('/', () => {
  const user = getSessionUser();
  // Same catalog as the sidebar (`demoAppShell` → `navFromPages`), minus Home.
  const examples = ui
    .navFromPages(user ? { role: user.role } : undefined)
    .filter((item) => item.href !== '/');

  exampleFrame(() => {
    ui.column(() => {
      ui.hero(
        {
          gap: 4,
          className: 'min-h-[40vh]',
        },
        () => {
          ui.icon('home').classes('size-10 text-muted-foreground');
          ui.label('Clay').classes('text-4xl font-semibold tracking-tight');
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
          description: 'Same pages as the sidebar — SPA links driven by pageMeta.',
          gap: 3,
        },
        () => {
          ui.column(() => {
            for (const item of examples) {
              ui.link(item.label, item.href, {
                icon: item.icon ?? 'boxes',
                className: 'text-muted-foreground',
              });
            }
          }, { gap: 2 });
        },
      );
    }, { gap: 6 });
  });
});
