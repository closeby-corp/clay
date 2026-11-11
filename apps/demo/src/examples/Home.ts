import { ui } from '@close-by/clay';
import { exampleFrame } from '../chrome';
import { getSessionUser } from './_auth';

export const pageMeta = {
  label: 'Home',
  icon: 'home',
  order: 0,
};

const HELLO = `import { ui } from '@close-by/clay';

export default function () {
  let count = 0;
  const label = ui.label(\`Count: \${count}\`);

  ui.row(() => {
    ui.button('-', { onClick: () => label.setText(\`Count: \${--count}\`) });
    ui.button('+', { onClick: () => label.setText(\`Count: \${++count}\`) });
  });
}`;

const FEATURES: Array<{ icon: string; title: string; body: string; href: string }> = [
  {
    icon: 'server',
    title: 'Server-driven',
    body: 'The UI is TypeScript on the server. The browser renders it and sends events back over a WebSocket. No React to write.',
    href: '/examples/counter',
  },
  {
    icon: 'zap',
    title: 'Reactive by default',
    body: 'Plain `let` variables drive the tree. Change one, and the elements that read it patch themselves.',
    href: '/examples/reactive-let-orders',
  },
  {
    icon: 'table',
    title: 'Serious data',
    body: 'DataTable with sort, filter, grouping and remote paging. Charts, lists, and DuckDB / ClickHouse helpers.',
    href: '/examples/datatable',
  },
  {
    icon: 'palette',
    title: 'Twenty-five palettes',
    body: 'Warm, cool, mono and neon, each with light and dark. Switch live or set a default per app.',
    href: '/examples/themes',
  },
  {
    icon: 'layout-dashboard',
    title: 'Fills the page',
    body: 'Rows, columns and cards that grow, scroll and fill the viewport, so layouts work without CSS.',
    href: '/examples/layout',
  },
  {
    icon: 'lock',
    title: 'Auth included',
    body: 'Signed cookie sessions, hashed passwords, roles, login limiter and an audit log out of the box.',
    href: '/examples/auth',
  },
];

ui.page('/', () => {
  const user = getSessionUser();
  const nav = ui.navFromPages(user ? { role: user.role } : undefined);
  const groups = nav.filter((item) => item.items?.length);

  exampleFrame(() => {
    ui.column(() => {
      // ── Hero ──────────────────────────────────────────────────────────
      ui.hero({ gap: 5, className: 'min-h-[48vh]' }, () => {
        ui.icon('layers').classes('clay-brand-gradient size-16 rounded-2xl p-3.5 shadow-primary');
        ui.label('Clay').classes('clay-brand-text pb-1 text-7xl font-extrabold tracking-tighter');
        ui.label('Server-driven UI for TypeScript.').classes(
          'text-2xl font-semibold tracking-tight',
        );
        ui.label(
          'Write screens as ui.* calls on the server. Clay renders a React + ShadCN app in the browser, keeps it in sync over a WebSocket, and stays out of your way.',
        ).classes('max-w-2xl text-center text-base text-balance text-muted-foreground');
        ui.row(() => {
          ui.button('Browse examples', {
            icon: 'compass',
            size: 'lg',
            onClick: () => ui.scroll.intoView('#browse'),
          });
          ui.button('Read the docs', {
            icon: 'book-open',
            variant: 'outline',
            size: 'lg',
            onClick: () => ui.openExternal('https://github.com/closeby-corp/clay/tree/main/docs'),
          });
        }, { gap: 3 }).classes('mt-2');
        ui.codeBlock({ code: 'bun add @close-by/clay-cli @close-by/clay && bunx clay hello.ts', language: 'bash' })
          .classes('mt-4 w-full max-w-xl text-left');
      });

      // ── Live proof + code ───────────────────────────────────────────────
      ui.grid({ cols: 2, gap: 6 }, () => {
        ui.card(
          {
            title: 'hello.ts',
            description: 'This is the whole app. No build step, no client code.',
            gap: 3,
          },
          () => {
            ui.codeBlock({ code: HELLO, language: 'ts', showCopy: true });
          },
        );
        ui.card(
          {
            title: 'Running right here',
            description: 'Each click is a round-trip to the server. The label is patched, not re-rendered.',
            gap: 6,
            className: 'justify-center',
          },
          () => {
            let count = 0;
            const label = ui
              .label(`Count: ${count}`)
              .classes('text-5xl font-bold tabular-nums tracking-tight');
            ui.row(() => {
              ui.button('-', {
                variant: 'outline',
                size: 'lg',
                onClick: () => {
                  label.setText(`Count: ${--count}`);
                },
              });
              ui.button('+', {
                size: 'lg',
                onClick: () => {
                  label.setText(`Count: ${++count}`);
                },
              });
            }, { gap: 3 });
          },
        );
      });

      // ── Features ──────────────────────────────────────────────────────
      ui.column(() => {
        ui.label('What is already mixed in').classes('text-2xl font-bold tracking-tight');
        ui.label('Not a box of parts. Press it into shape.').classes('text-muted-foreground');
      }, { gap: 1 }).classes('mt-6');
      ui.grid({ minColWidth: '18rem', gap: 4 }, () => {
        for (const f of FEATURES) {
          ui.card({ gap: 2, className: 'transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-card' }, () => {
            ui.icon(f.icon).classes('clay-brand-gradient size-9 rounded-lg p-2');
            ui.label(f.title).classes('text-lg font-semibold tracking-tight');
            ui.label(f.body).classes('text-sm text-muted-foreground');
            ui.link('See it →', f.href, { className: 'text-sm font-medium' });
          });
        }
      });

      // ── Browse ────────────────────────────────────────────────────────
      ui.html('<div id="browse" style="scroll-margin-top:5rem"></div>');
      ui.column(() => {
        ui.label('Browse the examples').classes('text-2xl font-bold tracking-tight');
        ui.label('Same groups as the sidebar. Every page is a file under apps/demo/src/examples.').classes(
          'text-muted-foreground',
        );
      }, { gap: 1 }).classes('mt-6');
      ui.grid({ minColWidth: '16rem', gap: 4 }, () => {
        for (const group of groups) {
          ui.card({ gap: 2 }, () => {
            ui.row(() => {
              ui.icon(group.icon ?? 'folder').classes('size-4 text-primary');
              ui.label(group.label).classes('font-semibold');
            }, { gap: 2 });
            ui.column(() => {
              for (const item of group.items ?? []) {
                ui.link(item.label, item.href, {
                  icon: item.icon ?? 'boxes',
                  className:
                    'rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground hover:no-underline',
                });
              }
            }, { gap: 1 });
          });
        }
      });

      ui.label('close-by clay · MIT · not a box of parts — clay.').classes(
        'mt-8 pb-4 text-center text-xs text-muted-foreground',
      );
    }, { gap: 8 });
  });
});
