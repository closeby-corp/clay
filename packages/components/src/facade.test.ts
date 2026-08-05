import { describe, expect, test, beforeEach } from 'bun:test';
import {
  ClientSession,
  clearPages,
  page,
  resetIdSequence,
  runWithSession,
  download,
  clipboard,
  navigate,
  type ServerMessage,
} from '@badui/core';
import {
  switchControl,
  spinner,
  progress,
  separator,
  icon,
  tabs,
  TabsElement,
  accordion,
  AccordionElement,
  collapsible,
  CollapsibleElement,
  radioGroup,
  date,
  tooltip,
  avatar,
  skeleton,
  markdown,
  html,
  image,
  upload,
  areaChart,
  barChart,
  lineChart,
  pieChart,
  radarChart,
  radialChart,
  combobox,
} from './index';

describe('facade feedback / layout elements', () => {
  test('switch stores boolean value like checkbox', () => {
    const el = switchControl({ checked: true, label: 'On', onChange: () => {} });
    expect(el.type).toBe('switch');
    expect(el.props.value).toBe(true);
    expect(el.props.label).toBe('On');
    expect(el.props.events).toEqual(expect.arrayContaining(['change']));
  });

  test('spinner / progress / separator / icon wire types', () => {
    expect(spinner().type).toBe('spinner');
    expect(progress({ value: 42 }).props.value).toBe(42);
    expect(separator({ orientation: 'vertical' }).props.orientation).toBe('vertical');
    const i = icon('home', { className: 'size-6' });
    expect(i.type).toBe('icon');
    expect(i.props.name).toBe('home');
    expect(i.props.className).toBe('size-6');
  });

  test('avatar / skeleton wire types', () => {
    const a = avatar({ src: '/a.png', fallback: 'AB', size: 'lg' });
    expect(a.type).toBe('avatar');
    expect(a.props).toMatchObject({ src: '/a.png', fallback: 'AB', size: 'lg' });
    expect(skeleton({ className: 'h-8 w-32' }).type).toBe('skeleton');
  });
});

describe('radioGroup / combobox / date / tooltip', () => {
  test('radioGroup stores options and value', () => {
    const el = radioGroup({
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
      value: 'b',
      orientation: 'horizontal',
      onChange: () => {},
    });
    expect(el.type).toBe('radiogroup');
    expect(el.props.value).toBe('b');
    expect(el.props.orientation).toBe('horizontal');
    expect(el.props.events).toEqual(expect.arrayContaining(['change']));
  });

  test('combobox stores options and value', () => {
    const el = combobox({
      options: [
        { value: 'next', label: 'Next.js' },
        { value: 'nuxt', label: 'Nuxt' },
      ],
      value: 'nuxt',
      placeholder: 'Search frameworks…',
      onChange: () => {},
    });
    expect(el.type).toBe('combobox');
    expect(el.props.value).toBe('nuxt');
    expect(el.props.placeholder).toBe('Search frameworks…');
    expect(el.props.options).toHaveLength(2);
    expect(el.props.events).toEqual(expect.arrayContaining(['change']));
  });

  test('date stores ISO value', () => {
    const el = date({ value: '2026-08-05', label: 'Due', onChange: () => {} });
    expect(el.type).toBe('date');
    expect(el.props.value).toBe('2026-08-05');
    expect(el.props.events).toEqual(expect.arrayContaining(['change']));
  });

  test('tooltip wraps children', () => {
    const el = tooltip({ text: 'Hint', side: 'bottom' }, () => {
      spinner();
    });
    expect(el.type).toBe('tooltip');
    expect(el.props.text).toBe('Hint');
    expect(el.props.side).toBe('bottom');
    expect(el.children).toHaveLength(1);
    expect(el.children[0]!.type).toBe('spinner');
  });
});

describe('content elements', () => {
  test('markdown stores text', () => {
    const el = markdown('# Hello', { className: 'prose' });
    expect(el.type).toBe('markdown');
    expect(el.props.text).toBe('# Hello');
    expect(el.props.className).toBe('prose');
  });

  test('html stores trusted markup', () => {
    const el = html('<b>hi</b>');
    expect(el.type).toBe('html');
    expect(el.props.html).toBe('<b>hi</b>');
  });

  test('image stores src and alt', () => {
    const el = image('/logo.png', { alt: 'Logo', width: 120 });
    expect(el.type).toBe('image');
    expect(el.props).toMatchObject({ src: '/logo.png', alt: 'Logo', width: 120 });
  });
});

describe('tabs', () => {
  test('builds panels and defaults value to first tab', () => {
    const el = tabs((t) => {
      t.tab('one', () => {});
      t.tab('two', 'Two', () => {});
    });
    expect(el).toBeInstanceOf(TabsElement);
    expect(el.type).toBe('tabs');
    expect(el.props.value).toBe('one');
    expect(el.children).toHaveLength(2);
    expect(el.children[0]!.type).toBe('tab');
    expect(el.children[0]!.props).toMatchObject({ value: 'one', label: 'one' });
    expect(el.children[1]!.props).toMatchObject({ value: 'two', label: 'Two' });
  });

  test('respects explicit value and onChange event', () => {
    const el = tabs(
      { value: 'two', onChange: () => {} },
      (t) => {
        t.tab('one', () => {});
        t.tab('two', () => {});
      },
    );
    expect(el.props.value).toBe('two');
    expect(el.props.events).toEqual(expect.arrayContaining(['change']));
  });

  test('setValue / change event updates active tab', async () => {
    const el = tabs({ value: 'one' }, (t) => {
      t.tab('one', () => {});
      t.tab('two', () => {});
    });
    el.setValue('two');
    expect(el.props.value).toBe('two');
    await el.handleEvent('change', 'one');
    expect(el.props.value).toBe('one');
  });

  test('tab panels nest children under each tab', () => {
    const el = tabs((t) => {
      t.tab('a', 'A', () => {
        spinner();
      });
    });
    expect(el.children[0]!.children).toHaveLength(1);
    expect(el.children[0]!.children[0]!.type).toBe('spinner');
  });
});

describe('accordion', () => {
  test('builds items and defaults value to first', () => {
    const el = accordion((a) => {
      a.item('one', () => {});
      a.item('two', 'Two', () => {});
    });
    expect(el).toBeInstanceOf(AccordionElement);
    expect(el.type).toBe('accordion');
    expect(el.props.value).toBe('one');
    expect(el.children).toHaveLength(2);
    expect(el.children[0]!.type).toBe('accordionitem');
    expect(el.children[1]!.props).toMatchObject({ value: 'two', title: 'Two' });
  });

  test('multiple type uses array value', () => {
    const el = accordion({ type: 'multiple', value: ['one'], onChange: () => {} }, (a) => {
      a.item('one', () => {});
      a.item('two', () => {});
    });
    expect(el.props.type).toBe('multiple');
    expect(el.props.value).toEqual(['one']);
    expect(el.props.events).toEqual(expect.arrayContaining(['change']));
  });
});

describe('collapsible', () => {
  test('stores open as value', () => {
    const el = collapsible({ title: 'More', open: true, onChange: () => {} }, () => {
      spinner();
    });
    expect(el).toBeInstanceOf(CollapsibleElement);
    expect(el.type).toBe('collapsible');
    expect(el.props.value).toBe(true);
    expect(el.props.title).toBe('More');
    expect(el.children[0]!.type).toBe('spinner');
  });
});

describe('download / clipboard / navigate helpers', () => {
  beforeEach(() => {
    clearPages();
    resetIdSequence();
    page('/helpers-test', () => {});
  });

  test('download and clipboard send protocol ops', () => {
    const messages: ServerMessage[] = [];
    const session = new ClientSession('/helpers-test', (m) => messages.push(m));
    session.mount();

    runWithSession(session, () => {
      download('notes.txt', 'text/plain', 'hello');
      clipboard('copied');
      navigate('/elsewhere');
    });

    expect(messages).toEqual(
      expect.arrayContaining([
        { op: 'download', filename: 'notes.txt', mime: 'text/plain', content: 'hello' },
        { op: 'clipboard', content: 'copied' },
        { op: 'navigate', path: '/elsewhere' },
      ]),
    );
  });
});

describe('upload', () => {
  test('wires accept/multiple and onUpload event', () => {
    const el = upload({
      accept: '.pdf,image/*',
      multiple: true,
      label: 'Pick',
      onUpload: () => {},
    });
    expect(el.type).toBe('upload');
    expect(el.props.accept).toBe('.pdf,image/*');
    expect(el.props.multiple).toBe(true);
    expect(el.props.label).toBe('Pick');
    expect(el.props.events).toEqual(expect.arrayContaining(['upload']));
  });
});

describe('charts', () => {
  const series = [
    { key: 'mobile', label: 'Mobile' },
    { key: 'desktop', label: 'Desktop' },
  ];
  const data = [{ month: 'Jan', mobile: 10, desktop: 20 }];

  test('areaChart wires type and stacked default', () => {
    const el = areaChart({ data, xKey: 'month', series });
    expect(el.type).toBe('areachart');
    expect(el.props).toMatchObject({
      xKey: 'month',
      series,
      stacked: true,
      interactive: false,
    });
  });

  test('barChart wires stacked and layout', () => {
    const el = barChart({
      data,
      xKey: 'month',
      series,
      stacked: true,
      layout: 'horizontal',
      title: 'Bars',
    });
    expect(el.type).toBe('barchart');
    expect(el.props).toMatchObject({
      stacked: true,
      layout: 'horizontal',
      title: 'Bars',
    });
  });

  test('lineChart wires type and interactive', () => {
    const el = lineChart({ data, xKey: 'month', series, interactive: true });
    expect(el.type).toBe('linechart');
    expect(el.props.interactive).toBe(true);
  });

  test('pieChart wires nameKey/valueKey and series/donut', () => {
    const byRows = pieChart({
      data: [{ name: 'A', value: 1 }],
      nameKey: 'name',
      valueKey: 'value',
    });
    expect(byRows.type).toBe('piechart');
    expect(byRows.props).toMatchObject({ nameKey: 'name', valueKey: 'value' });

    const donut = pieChart({
      data: [{ mobile: 1, desktop: 2 }],
      series,
      innerRadius: 60,
    });
    expect(donut.type).toBe('piechart');
    expect(donut.props.innerRadius).toBe(60);
    expect(donut.props.series).toEqual(series);
  });

  test('radarChart wires angleKey and series', () => {
    const el = radarChart({
      data,
      angleKey: 'month',
      series,
      title: 'Skills',
      fillOpacity: 0.5,
    });
    expect(el.type).toBe('radarchart');
    expect(el.props).toMatchObject({
      angleKey: 'month',
      series,
      title: 'Skills',
      fillOpacity: 0.5,
    });
  });

  test('radialChart wires nameKey/valueKey and series/center text', () => {
    const byRows = radialChart({
      data: [{ browser: 'Chrome', visitors: 275 }],
      nameKey: 'browser',
      valueKey: 'visitors',
    });
    expect(byRows.type).toBe('radialchart');
    expect(byRows.props).toMatchObject({ nameKey: 'browser', valueKey: 'visitors' });

    const stacked = radialChart({
      data: [{ mobile: 320, desktop: 480 }],
      series,
      endAngle: 180,
      centerValue: 800,
      centerLabel: 'Visitors',
    });
    expect(stacked.type).toBe('radialchart');
    expect(stacked.props).toMatchObject({
      series,
      endAngle: 180,
      centerValue: 800,
      centerLabel: 'Visitors',
    });
  });
});
