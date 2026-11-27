import { afterEach, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { AnimatedValue } from './AnimatedValue';
import { BoundGantt } from './BoundGantt';
import { ChartChrome, formatAxisTick } from './chart-shared';
import { __setI18nBootForTests } from './i18n';

afterEach(() => __setI18nBootForTests());

/** Intl uses (narrow) no-break spaces as pt-PT group separators. */
const plain = (html: string) => html.replace(/[  ]/g, ' ');

test('chart period presets, subtitle and axis dates follow pt-PT', () => {
  __setI18nBootForTests({ locale: 'pt-PT' });
  const html = renderToStaticMarkup(
    <ChartChrome title="Visitas" description="" interactive period="90d" setPeriod={() => {}} style={undefined}>
      <div />
    </ChartChrome>,
  );
  expect(html).toContain('Total dos últimos 3 meses');
  expect(html).toContain('Últimos 30 dias');
  expect(html).toContain('Últimos 7 dias');
  expect(html).toContain('aria-label="Selecione um período"');
  expect(formatAxisTick('2024-04-15T12:00:00', 'pt-PT')).toBe('15/04');
  expect(formatAxisTick('2024-04-15T12:00:00', 'en')).toBe('Apr 15');
});

test('stat values and gantt chrome render in pt-PT', () => {
  __setI18nBootForTests({ locale: 'pt-PT' });
  expect(plain(renderToStaticMarkup(<AnimatedValue value={12345.5} />))).toContain('aria-label="12 345,5"');
  expect(plain(renderToStaticMarkup(<AnimatedValue value="$1,234.5" />))).toContain('aria-label="$1 234,5"');

  const gantt = renderToStaticMarkup(
    <BoundGantt id="g" style={undefined} emit={() => {}} props={{
      range: { start: '2026-08-01', end: '2026-08-10' },
      rows: [{ id: 'r', title: 'Obra', items: [{ id: 'a', title: 'A', start: '2026-08-01', end: '2026-08-05' }] }],
    }} />,
  );
  expect(gantt).toContain('Deslize na horizontal');
  expect(gantt).toContain('>Linhas<');
  expect(gantt).toContain('>ago.<');
});
