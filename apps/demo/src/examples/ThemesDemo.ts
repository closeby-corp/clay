import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Themes',
  icon: 'palette',
  order: 10,
  group: 'Start here',
  groupIcon: 'sparkles',
};

/** Swatch preview per palette (light-mode primary + two chart colours). */
const SWATCHES: Record<string, { blurb: string; colors: string[] }> = {
  kiln: { blurb: 'Warm clay — the default', colors: ['oklch(0.565 0.19 40)', 'oklch(0.58 0.21 292)', 'oklch(0.62 0.13 185)'] },
  cobalt: { blurb: 'Classic SaaS blue', colors: ['oklch(0.53 0.2 262)', 'oklch(0.7 0.14 200)', 'oklch(0.75 0.15 150)'] },
  ocean: { blurb: 'Calm teal, cool greys', colors: ['oklch(0.5 0.1 205)', 'oklch(0.55 0.15 250)', 'oklch(0.75 0.12 170)'] },
  forest: { blurb: 'Earthy greens, sage', colors: ['oklch(0.5 0.12 150)', 'oklch(0.72 0.14 110)', 'oklch(0.62 0.09 190)'] },
  orchid: { blurb: 'Playful magenta-violet', colors: ['oklch(0.53 0.21 318)', 'oklch(0.6 0.2 280)', 'oklch(0.68 0.19 355)'] },
  citrus: { blurb: 'Bright, energetic amber', colors: ['oklch(0.83 0.17 85)', 'oklch(0.68 0.19 45)', 'oklch(0.75 0.18 130)'] },
  graphite: { blurb: 'Monochrome, high contrast', colors: ['oklch(0.24 0.005 260)', 'oklch(0.55 0.01 260)', 'oklch(0.62 0.19 255)'] },
  neon: { blurb: 'Synthwave pink + cyan', colors: ['oklch(0.55 0.25 335)', 'oklch(0.72 0.15 205)', 'oklch(0.8 0.2 135)'] },
  sky: { blurb: 'Airy light blue', colors: ['oklch(0.53 0.15 240)', 'oklch(0.75 0.12 205)', 'oklch(0.82 0.1 180)'] },
  navy: { blurb: 'Deep corporate navy', colors: ['oklch(0.36 0.11 262)', 'oklch(0.62 0.13 240)', 'oklch(0.78 0.14 80)'] },
  indigo: { blurb: 'Electric blue-violet', colors: ['oklch(0.5 0.22 275)', 'oklch(0.68 0.15 235)', 'oklch(0.62 0.2 305)'] },
  denim: { blurb: 'Muted, washed blue', colors: ['oklch(0.47 0.08 250)', 'oklch(0.7 0.07 230)', 'oklch(0.78 0.1 75)'] },
  midnight: { blurb: 'Blue-tinted surfaces, navy dark', colors: ['oklch(0.53 0.2 258)', 'oklch(0.78 0.13 210)', 'oklch(0.72 0.17 290)'] },
};

const sales = [
  { month: 'Jan', online: 186, retail: 80, partners: 45 },
  { month: 'Feb', online: 305, retail: 200, partners: 90 },
  { month: 'Mar', online: 237, retail: 120, partners: 130 },
  { month: 'Apr', online: 173, retail: 190, partners: 110 },
  { month: 'May', online: 209, retail: 130, partners: 160 },
  { month: 'Jun', online: 264, retail: 140, partners: 175 },
];

ui.page('/examples/themes', () => {
  let current = ui.theme.getPalette() ?? 'kiln';

  exampleFrame(() => {
    ui.column(() => {
      exampleHeader(
        undefined,
        'Thirteen palettes, each with light + dark. ui.run({ palette }) sets the app default; ui.theme.palette(name) switches live.',
      );

      exampleSection('Palette', 'Click to switch this session — your choice is remembered across reloads.');
      const picker = ui.refreshable(() => {
        ui.grid({ minColWidth: '13rem', gap: 3 }, () => {
          for (const name of ui.theme.palettes) {
            const swatch = SWATCHES[name]!;
            ui.column(() => {
              ui.button(name, {
                variant: name === current ? 'default' : 'outline',
                className: 'w-full capitalize',
                onClick: () => {
                  current = name;
                  ui.theme.palette(name);
                  picker.refresh();
                },
              });
              ui.row(() => {
                for (const color of swatch.colors) {
                  ui.label('')
                    .classes('inline-block size-3 rounded-full ring-1 ring-black/10')
                    .style({ background: color });
                }
                ui.label(swatch.blurb).classes('text-xs text-muted-foreground');
              }, { gap: 1, wrap: false });
            }, { gap: 2 });
          }
        });
      });

      exampleSection('Appearance');
      ui.row(() => {
        for (const mode of ['light', 'dark', 'system'] as const) {
          ui.button(mode, {
            variant: 'outline',
            size: 'sm',
            className: 'capitalize',
            onClick: () => ui.theme.set(mode),
          });
        }
      }, { gap: 2 });

      exampleSection('Preview', 'Same components, recoloured by the palette tokens.');
      ui.grid({ minColWidth: '18rem', gap: 4 }, () => {
        ui.card({ title: 'Buttons', description: 'Variants follow --primary / --secondary.', gap: 3 }, () => {
          ui.row(() => {
            ui.button('Primary');
            ui.button('Secondary', { variant: 'secondary' });
            ui.button('Outline', { variant: 'outline' });
            ui.button('Ghost', { variant: 'ghost' });
            ui.button('Delete', { variant: 'destructive' });
          }, { gap: 2 });
          ui.row(() => {
            ui.badge('Default');
            ui.badge('Secondary', { variant: 'secondary' });
            ui.badge('Outline', { variant: 'outline' });
            ui.badge('Shipped', { color: 'green' });
            ui.badge('Late', { color: 'red' });
          }, { gap: 2 });
        });

        ui.card({ title: 'Form', description: 'Inputs, focus ring, and toggles.', gap: 3 }, () => {
          ui.input({ label: 'Workspace', placeholder: 'acme-inc' });
          ui.switch({ label: 'Email notifications', checked: true });
          ui.slider({ min: 0, max: 100, value: 64 });
        });

        ui.card({ title: 'Status', description: 'Progress and alerts.', gap: 3 }, () => {
          ui.progress({ value: 72 });
          ui.alert('Deploy finished in 42s.', { icon: 'circle-check' });
          ui.label('Brand gradient').classes('clay-brand-text text-2xl font-extrabold tracking-tight');
        });
      });

      ui.chart
        .categories(sales)
        .x('month')
        .series(['online', 'retail', 'partners'])
        .bar({ title: 'Sales by channel', description: 'Chart colours come from --chart-1…5.', height: 240 });
    }, { gap: 6 });
  });
});
