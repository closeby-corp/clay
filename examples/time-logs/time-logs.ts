import { ui } from '@close-by/clay';

type Worker = {
  name: string;
  trade: string;
  regular: number;
  overtime: number;
  unapproved: number;
  approved?: string;
  convert?: boolean;
  empty?: boolean;
};

const fmt = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  return `${hours}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;
};
const grid = 'grid grid-cols-[28px_180px_minmax(140px,1fr)_80px_85px_85px_100px_290px] items-center gap-3';
const muted = 'text-muted-foreground';
const tiny = 'text-[10px] font-medium uppercase tracking-wider text-muted-foreground';
const secondary = 'h-9 rounded-lg border border-border bg-secondary text-xs font-medium text-secondary-foreground shadow-none hover:bg-accent';
const card = 'overflow-hidden rounded-xl bg-card shadow-card';

export default function timeLogs() {
  const palette = ui.getUrlSearchParams().get('palette');
  ui.theme.palette(ui.theme.palettes.find(name => name === palette) ?? 'chalk');
  ui.theme.set(ui.getUrlSearchParams().get('mode') === 'dark' ? 'dark' : 'light');
  const rows: Worker[] = [
    { name: 'Andrey Lokas', trade: 'Carpenter', regular: 3762, overtime: 0, unapproved: 2562, convert: true },
    { name: 'Cameron Williamson', trade: 'Plumber', regular: 2400, overtime: 270, unapproved: 1080 },
    { name: 'Devon Lane', trade: 'Plumber', regular: 0, overtime: 0, unapproved: 0, empty: true },
    { name: 'Jerome Bell', trade: 'Roofer', regular: 2400, overtime: 120, unapproved: 0, approved: 'Mon, Nov 9' },
    { name: 'Floyd Miles', trade: 'Tile setter', regular: 2400, overtime: 315, unapproved: 0, approved: 'Mon, Nov 9' },
    { name: 'Cody Fisher', trade: 'Electrician', regular: 2310, overtime: 0, unapproved: 0, approved: 'Sun, Nov 8' },
    { name: 'Jan Losert', trade: 'General laborer', regular: 1920, overtime: 0, unapproved: 0, approved: 'Sun, Nov 8' },
  ];
  const expanded = new Set<string>();
  let stats: ReturnType<typeof ui.refreshable>;
  let review: ReturnType<typeof ui.refreshable>;
  let approved: ReturnType<typeof ui.refreshable>;
  const refresh = () => { stats.refresh(); review.refresh(); approved.refresh(); };
  const notify = (message: string) => () => { ui.notify(message); };

  function navItem(label: string, icon: string, chevron = false) {
    ui.row(() => {
      ui.icon(icon).classes('size-[17px] shrink-0 text-muted-foreground');
      ui.link(label, '#').classes('flex-1 text-[13px] text-foreground no-underline');
      if (chevron) ui.icon('chevron-up').classes('size-3 text-muted-foreground');
    }, { gap: 3 }).classes('min-h-9 px-3');
  }

  function sidebar() {
    ui.column(() => {
      ui.row(() => {
        ui.row(() => ui.icon('grip').classes('size-6 text-muted-foreground'))
          .classes('size-10 items-center justify-center rounded-xl bg-secondary');
        ui.column(() => {
          ui.label('BRICK').classes('text-xl font-extrabold leading-5 tracking-[0.18em]');
          ui.label('CONSTRUCTION').classes('mt-1 text-[8px] font-semibold tracking-[0.25em] text-muted-foreground');
        }, { gap: 0 });
      }, { gap: 3 }).classes('mb-8 px-3');
      navItem('Search', 'search');
      ui.label('WORKSPACE').classes(`${tiny} mb-2 mt-7 px-3`);
      navItem('Dashboard', 'house');
      navItem('Time tracking', 'clock', true);
      ui.column(() => {
        ui.link('Time logs', '#').classes('rounded-lg bg-sidebar-accent px-3 py-2 text-[13px] font-semibold text-foreground no-underline');
        ui.link('Track hours', '#').classes('px-3 py-2 text-[13px] text-muted-foreground no-underline');
      }, { gap: 1 }).classes('ml-8');
      navItem('Task list', 'list-checks');
      ui.label('MONEY').classes(`${tiny} mb-2 mt-6 px-3`);
      for (const [label, icon] of [['Lead pipeline', 'filter'], ['Estimates', 'clipboard-list'], ['Invoice', 'receipt'], ['Projects', 'briefcase']]) navItem(label!, icon!);
      ui.label('FIELD').classes(`${tiny} mb-2 mt-6 px-3`);
      for (const [label, icon] of [['Schedule', 'calendar'], ['Photo and files', 'images'], ['People', 'user'], ['Map', 'map-pin'], ['Reports', 'bar-chart-3']]) navItem(label!, icon!);
      ui.column(() => {
        ui.row(() => {
          ui.avatar({ fallback: 'DM', alt: 'Duck Morgan', size: 'sm' }).classes('bg-secondary text-xs');
          ui.column(() => {
            ui.label('Duck Morgan').classes('text-xs font-medium');
            ui.label('Admin').classes('text-[11px] text-muted-foreground');
          }, { gap: 0 }).classes('flex-1');
          ui.icon('chevron-down').classes('size-3 text-muted-foreground');
        }, { gap: 3 }).classes('px-3 py-5');
        ui.separator().classes('bg-secondary');
      }, { gap: 0 }).classes('mt-auto pt-8');
    }, { gap: 0 }).classes('fixed inset-y-0 left-0 z-10 w-[240px] overflow-y-auto border-r border-border bg-sidebar px-4 py-8');
  }

  function header() {
    ui.row(() => {
      ui.row(() => {
        ui.label('Time tracking').classes('text-[22px] font-medium text-muted-foreground');
        ui.icon('chevron-right').classes('size-5 text-muted-foreground');
        ui.label('Time logs').classes('text-[22px] font-semibold tracking-tight');
        ui.link('Tutorial Video', '#', { icon: 'circle-play' })
          .classes('ml-4 text-xs text-muted-foreground no-underline');
      }, { gap: 2 });
      ui.row(() => {
        ui.label('Payroll mode').classes('mr-1 text-xs text-muted-foreground');
        ui.switch({ checked: true, label: 'Payroll mode', size: 'sm' })
          .classes('[&_label]:hidden');
        ui.button('Pay period report', { icon: 'file-text', variant: 'secondary', onClick: notify('Pay period report is ready to export') }).classes(secondary);
        ui.button('Payroll settings', { icon: 'settings', variant: 'secondary', onClick: notify('Payroll settings') }).classes(secondary);
      }, { gap: 3 });
    }, { gap: 4 }).classes('justify-between');
    ui.row(() => {
      ui.row(() => {
        ui.button('Sun, Nov 1 to Sat, Nov 7, 2026', { icon: 'calendar', variant: 'secondary', onClick: notify('Showing the Nov 1–7 pay period') }).classes(`${secondary} rounded-full pr-9`);
        ui.icon('chevron-down').classes('-ml-7 mr-3 size-3 pointer-events-none');
        ui.label('Pay period closed Nov 7').classes('ml-3 text-xs text-muted-foreground');
      }, { gap: 2 });
      ui.link('Full company time logs', '#', { icon: 'external-link', iconPosition: 'end' })
        .classes('text-xs font-medium text-muted-foreground no-underline');
    }, { gap: 4 }).classes('mt-7 justify-between');
  }

  function statTime(value: string, classes: string) {
    const [hours, minutes] = value.split(' ');
    ui.row(() => {
      ui.label(hours!).classes(`${classes} text-foreground`);
      if (minutes) ui.label(minutes).classes(`${classes} text-muted-foreground`);
    }, { gap: 1 }).classes('items-baseline');
  }

  function statsCard() {
    const regular = rows.reduce((sum, r) => sum + r.regular, 0);
    const overtime = rows.reduce((sum, r) => sum + r.overtime, 0);
    const pending = rows.reduce((sum, r) => sum + r.unapproved, 0);
    const total = regular + overtime;
    const accepted = total - pending;
    const percent = Math.round(accepted / total * 100);
    ui.row(() => {
      ui.column(() => {
        ui.label('LEFT TO APPROVE').classes(tiny);
        ui.row(() => {
          statTime(fmt(pending), 'text-[30px] font-medium tracking-tight leading-none');
          const workers = rows.filter(r => r.unapproved > 0).length;
          ui.label(`from ${workers} ${workers === 1 ? 'worker' : 'workers'}`).classes('pb-1 text-[11px] text-muted-foreground');
        }, { gap: 3 }).classes('items-end');
        ui.progress({ value: percent }).classes('mt-2 h-[6px] bg-secondary [&>div]:bg-chart-2');
        ui.row(() => {
          ui.label(`${fmt(accepted)} approved`).classes('text-[10px] text-muted-foreground');
          ui.label(`${percent}% of logged hours`).classes('text-[10px] text-muted-foreground');
        }, { gap: 2 }).classes('mt-2 justify-between');
      }, { gap: 1 }).classes('flex-[2] px-6 py-5');
      for (const [title, value] of [['Regular', fmt(regular)], ['Overtime', fmt(overtime)], ['Total hours', fmt(total)], ['Total paid', '—']]) {
        ui.column(() => {
          ui.row(() => {
            ui.label(title).classes('text-xs text-muted-foreground');
            if (title === 'Total paid') ui.tooltip({ text: 'Calculated once all time is approved' }, () => {
              ui.button('', { icon: 'info', variant: 'ghost', size: 'icon' }).classes('size-4 text-muted-foreground');
            });
          }, { gap: 2 });
          statTime(value!, 'text-[24px] font-medium tracking-tight leading-none');
          if (title === 'Total paid') ui.label('Shows once all time is approved').classes('mt-1 max-w-36 text-[10px] leading-4 text-muted-foreground');
        }, { gap: 3 }).classes('min-w-0 flex-1 self-stretch border-l border-border px-6 py-6');
      }
    }, { gap: 0 }).classes(`${card} mt-8 items-stretch`);
  }

  function dropdown(label: string, icon: string, items: string[]) {
    ui.row(() => {
      ui.icon(icon).classes('size-4 text-muted-foreground');
      ui.dropdownMenu({ label, variant: 'ghost', className: 'h-8 px-1 text-xs text-muted-foreground' }, menu => {
        for (const item of items) menu.item(item, item, { onSelect: notify(`${item} selected`) });
      });
      ui.icon('chevron-down').classes('size-3 text-muted-foreground');
    }, { gap: 1 });
  }

  function sectionTitle(title: string, count: number, controls = false) {
    ui.row(() => {
      ui.row(() => {
        ui.label(title).classes('text-base font-semibold tracking-tight');
        ui.badge(String(count), { variant: 'secondary' }).classes('rounded-md bg-secondary px-2 text-[11px] text-muted-foreground');
      }, { gap: 2 });
      if (controls) ui.row(() => {
        dropdown('Filter by', 'sliders-horizontal', ['Trade', 'Status', 'Has overtime']);
        dropdown('Export', 'download', ['CSV', 'PDF', 'Send to payroll']);
      }, { gap: 5 });
    }, { gap: 4 }).classes('mb-4 mt-8 justify-between');
  }

  function details(worker: Worker) {
    const total = worker.regular + worker.overtime;
    // Divide the exact minute total across five workdays, leaving the weekend clear.
    const daily = Math.floor(total / 5);
    ui.column(() => {
      ui.label('DAILY BREAKDOWN · NOV 1–7').classes(tiny);
      ui.row(() => {
        for (let day = 0; day < 7; day++) {
          const minutes = day === 0 || day === 6 ? 0 : daily + (day === 5 ? total % 5 : 0);
          ui.column(() => {
            ui.label(['Sun, Nov 1', 'Mon, Nov 2', 'Tue, Nov 3', 'Wed, Nov 4', 'Thu, Nov 5', 'Fri, Nov 6', 'Sat, Nov 7'][day]!).classes('text-[11px] text-muted-foreground');
            ui.label(fmt(minutes)).classes('text-xs font-medium');
          }, { gap: 2 }).classes('flex-1 rounded-lg border border-border bg-card p-3');
        }
      }, { gap: 3 }).classes('mt-3');
    }, { gap: 0 }).classes('border-t border-border/70 bg-background px-12 py-5');
  }

  function workerRow(worker: Worker) {
    ui.column(() => {
      ui.row(() => {
        if (worker.empty) ui.label('');
        else ui.button('', {
          icon: expanded.has(worker.name) ? 'chevron-up' : 'chevron-down',
          variant: 'ghost', size: 'icon',
          onClick: () => {
            if (expanded.has(worker.name)) expanded.delete(worker.name);
            else expanded.add(worker.name);
            review.refresh(); approved.refresh();
          },
        }).classes('size-7 text-muted-foreground').update({ 'aria-label': `Toggle daily breakdown for ${worker.name}`, 'aria-expanded': expanded.has(worker.name) });
        ui.row(() => {
          ui.avatar({ fallback: worker.name.split(' ').map(part => part[0]).join(''), alt: worker.name, size: 'sm' })
            .classes('size-9 bg-secondary text-[11px] text-muted-foreground');
          ui.column(() => {
            ui.label(worker.name).classes('text-[12px] font-semibold');
            ui.label(worker.trade).classes('mt-1 text-[11px] text-muted-foreground');
          }, { gap: 0 });
        }, { gap: 3 });
        const attention = worker.approved ? `Approved ${worker.approved}`
          : worker.empty ? 'No time logged this pay period'
          : worker.convert ? 'Overtime logged as regular: 22h 42m'
          : worker.name === 'Cameron Williamson' ? 'Unapproved: Thu, Nov 5 and Fri, Nov 6'
          : `Unapproved: ${fmt(worker.unapproved)}`;
        ui.label(attention).classes(`text-[11px] leading-5 ${worker.approved || worker.empty ? muted : 'text-foreground'}`);
        ui.label(worker.empty ? '–' : fmt(worker.regular)).classes('justify-self-end text-right text-xs tabular-nums');
        ui.label(worker.empty ? '–' : fmt(worker.overtime)).classes(`justify-self-end text-right text-xs tabular-nums ${worker.overtime ? 'font-medium [color:color-mix(in_srgb,var(--chart-3)_70%,var(--foreground))]' : muted}`);
        ui.label(worker.empty ? '–' : fmt(worker.regular + worker.overtime)).classes('justify-self-end text-right text-xs font-medium tabular-nums');
        ui.label(worker.approved ? '' : worker.empty ? '–' : fmt(worker.unapproved)).classes(`justify-self-end text-right text-xs tabular-nums ${worker.unapproved ? 'text-destructive' : muted}`);
        ui.row(() => {
          if (worker.unapproved) ui.button(worker.convert ? 'Convert to overtime' : 'Approve all', {
            variant: worker.convert ? 'default' : 'secondary', size: 'sm',
            onClick: () => {
              if (worker.convert) {
                worker.overtime = worker.regular - 2400;
                worker.regular = 2400;
                worker.convert = false;
              } else {
                worker.unapproved = 0;
                worker.approved = 'Tue, Nov 10';
              }
              refresh();
            },
          }).classes(worker.convert ? 'h-8 rounded-lg px-3 text-[11px]' : `${secondary} h-8 px-3 text-[11px]`);
          ui.button('Add time', { variant: 'secondary', size: 'sm', onClick: notify(`Add time for ${worker.name}`) })
            .classes(`${secondary} h-8 px-3 text-[11px]`);
        }, { gap: 2 }).classes('flex-nowrap justify-end');
      }, { gap: 0 }).classes(`${grid} min-h-[88px] px-4 py-4`);
      if (expanded.has(worker.name)) details(worker);
    }, { gap: 0 }).classes('border-t border-border/70 first:border-t-0');
  }

  ui.row(() => {
    sidebar();
    ui.column(() => {
      header();
      stats = ui.refreshable(statsCard);
      review = ui.refreshable(() => {
        const workers = rows.filter(r => !r.approved);
        sectionTitle('Needs your review', workers.length, true);
        ui.column(() => {
          ui.row(() => {
            for (const [index, title] of ['', 'WORKER', 'WHAT NEEDS ATTENTION', 'REGULAR', 'OVERTIME', 'TOTAL', 'UNAPPROVED', ''].entries()) {
              ui.label(title).classes(`${tiny} ${index >= 3 ? 'justify-self-end text-right' : ''}`);
            }
          }, { gap: 0 }).classes(`${grid} min-h-11 bg-background px-4`);
          workers.forEach(workerRow);
        }, { gap: 0 }).classes(card);
      });
      approved = ui.refreshable(() => {
        const workers = rows.filter(r => r.approved);
        sectionTitle('Approved', workers.length);
        ui.column(() => workers.forEach(workerRow), { gap: 0 }).classes(card);
      });
    }, { gap: 0 }).classes('ml-[240px] min-w-0 flex-1 px-9 pb-12 pt-9');
  }, { gap: 0 }).classes('min-h-screen w-full items-start bg-background font-sans text-[13px] text-foreground');
}
