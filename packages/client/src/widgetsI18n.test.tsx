import { afterEach, describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ElementRenderer } from './ElementRenderer';
import { Calendar } from '@/components/ui/calendar';
import { __setI18nBootForTests } from './i18n';

const emit = () => {};

afterEach(() => {
  __setI18nBootForTests();
});

function weekdayHeaders(html: string): string[] {
  return [...html.matchAll(/<th[^>]*aria-label="([^"]+)"[^>]*>/g)].map((m) => m[1]!);
}

describe('widgets i18n (pt-PT)', () => {
  test('date picker placeholder and date range presets placeholder are Portuguese', () => {
    __setI18nBootForTests({ locale: 'pt-PT' });
    const date = renderToStaticMarkup(
      <ElementRenderer emit={emit} node={{ id: 'd1', type: 'date', props: {}, children: [] }} />,
    );
    expect(date).toContain('Escolha uma data');
    expect(date).not.toContain('Pick a date');

    const range = renderToStaticMarkup(
      <ElementRenderer emit={emit} node={{ id: 'd2', type: 'dateRange', props: {}, children: [] }} />,
    );
    expect(range).toContain('Selecione um intervalo de datas');
  });

  test('date picker shows the selected date as a localized long date', () => {
    __setI18nBootForTests({ locale: 'pt-PT' });
    const html = renderToStaticMarkup(
      <ElementRenderer
        emit={emit}
        node={{ id: 'd3', type: 'date', props: { value: '2026-11-27' }, children: [] }}
      />,
    );
    expect(html).toContain('27 de novembro de 2026');
  });

  test('calendar uses Portuguese month names, Monday-first weekdays and nav labels', () => {
    __setI18nBootForTests({ locale: 'pt-PT' });
    const html = renderToStaticMarkup(<Calendar mode="single" defaultMonth={new Date(2026, 10, 1)} />);
    expect(html).toContain('novembro de 2026');
    expect(html).toContain('Ir para o mês anterior');
    expect(html).toContain('Ir para o mês seguinte');
    const headers = weekdayHeaders(html);
    expect(headers[0]).toBe('segunda-feira');
    expect(headers[6]).toBe('domingo');
    // Visible column headers are compact (pt-PT "short" weekday names are whole words).
    const visible = [...html.matchAll(/<th[^>]*aria-label="[^"]+"[^>]*>(?:<[^>]+>)*([^<]+)</g)].map((m) => m[1]);
    expect(visible).toEqual(['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']);
  });

  test('calendar stays English and Sunday-first by default', () => {
    const html = renderToStaticMarkup(<Calendar mode="single" defaultMonth={new Date(2026, 10, 1)} />);
    expect(html).toContain('November 2026');
    expect(html).toContain('Go to the Previous Month');
    expect(weekdayHeaders(html)[0]).toBe('Sunday');
  });

  test('timeline details toggle is Portuguese', () => {
    __setI18nBootForTests({ locale: 'pt-PT' });
    const html = renderToStaticMarkup(
      <ElementRenderer
        emit={emit}
        node={{
          id: 't1',
          type: 'timeline',
          props: { items: [{ title: 'Deploy', body: 'log output' }] },
          children: [],
        }}
      />,
    );
    expect(html).toContain('Mostrar detalhes');
    expect(html).toContain('aria-label="Cronologia"');
  });
});
