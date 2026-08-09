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
  rating,
  colorPicker,
  tags,
  codeBlock,
  tree,
  editor,
  kanban,
  relativeTime,
  qrCode,
  imageZoom,
  dialogStack,
  list,
  imageCrop,
  gantt,
  flow,
  FlowElement,
  DialogStackElement,
  areaChart,
  barChart,
  lineChart,
  pieChart,
  radarChart,
  radialChart,
  combobox,
  input,
  textArea,
  checkbox,
  select,
  slider,
  label,
} from './index';
import { reactive } from '@badui/core';

describe('facade feedback / layout elements', () => {
  test('label accepts compute fn via bindText', async () => {
    const s = reactive({ n: 3 });
    const el = label(() => `n=${s.n}`);
    expect(el.props.text).toBe('n=3');
    s.n = 4;
    await Promise.resolve();
    await Promise.resolve();
    expect(el.props.text).toBe('n=4');
  });

  test('input error prop wires through', () => {
    const el = input({ label: 'Name', error: 'Required' });
    expect(el.type).toBe('input');
    expect(el.props.error).toBe('Required');
  });

  test('textArea / checkbox / select / slider accept error', () => {
    expect(textArea({ error: 'Too short' }).props.error).toBe('Too short');
    expect(checkbox({ error: 'Required' }).props.error).toBe('Required');
    expect(
      select({
        options: [{ value: 'a', label: 'A' }],
        error: 'Pick one',
      }).props.error,
    ).toBe('Pick one');
    expect(slider({ error: 'Out of range' }).props.error).toBe('Out of range');
  });

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
    expect(el.props.variant).toBe('button');
    expect(el.props.events).toEqual(expect.arrayContaining(['upload']));
  });

  test('dropzone variant', () => {
    const el = upload({ variant: 'dropzone', label: 'Drop' });
    expect(el.props.variant).toBe('dropzone');
    expect(el.props.label).toBe('Drop');
  });
});

describe('rating / colorPicker / tags / codeBlock / tree / editor / kanban', () => {
  test('rating wires value/max and change', () => {
    const el = rating({ value: 3, max: 5, label: 'Stars', onChange: () => {} });
    expect(el.type).toBe('rating');
    expect(el.props).toMatchObject({ value: 3, max: 5, label: 'Stars' });
    expect(el.props.events).toEqual(expect.arrayContaining(['change']));
  });

  test('colorPicker wires hex value', () => {
    const el = colorPicker({ value: '#ff0000', onChange: () => {} });
    expect(el.type).toBe('colorPicker');
    expect(el.props.value).toBe('#ff0000');
    expect(el.props.events).toEqual(expect.arrayContaining(['change']));
  });

  test('tags wires array value and options', () => {
    const el = tags({
      value: ['a'],
      options: [{ value: 'a', label: 'A' }],
      creatable: false,
      onChange: () => {},
    });
    expect(el.type).toBe('tags');
    expect(el.props.value).toEqual(['a']);
    expect(el.props.creatable).toBe(false);
    expect(el.props.events).toEqual(expect.arrayContaining(['change']));
  });

  test('codeBlock is display-only', () => {
    const el = codeBlock({ code: 'const x = 1', language: 'ts', showCopy: false });
    expect(el.type).toBe('codeBlock');
    expect(el.props).toMatchObject({ code: 'const x = 1', language: 'ts', showCopy: false });
    expect(el.props.events ?? []).toEqual([]);
  });

  test('tree wires nodes and select/expand', () => {
    const el = tree({
      nodes: [{ id: 'root', label: 'Root', children: [{ id: 'child', label: 'Child' }] }],
      selected: 'root',
      expanded: ['root'],
      onSelect: () => {},
      onExpand: () => {},
    });
    expect(el.type).toBe('tree');
    expect(el.props.selected).toBe('root');
    expect(el.props.expanded).toEqual(['root']);
    expect(el.props.events).toEqual(expect.arrayContaining(['select', 'expand']));
  });

  test('editor wires value/format and change', () => {
    const el = editor({
      value: '<p>Hi</p>',
      format: 'html',
      placeholder: 'Write…',
      onChange: () => {},
    });
    expect(el.type).toBe('editor');
    expect(el.props).toMatchObject({
      value: '<p>Hi</p>',
      format: 'html',
      placeholder: 'Write…',
    });
    expect(el.props.events).toEqual(expect.arrayContaining(['change']));
  });

  test('editor defaults format to html', () => {
    const el = editor({ value: '# md', format: 'markdown', onChange: () => {} });
    expect(el.props.format).toBe('markdown');
    const el2 = editor({ value: '<p>x</p>' });
    expect(el2.props.format).toBe('html');
    expect(el2.props.value).toBe('<p>x</p>');
  });

  test('kanban wires columns and always registers cardMove/cardSelect settle', () => {
    const columns = [
      {
        id: 'todo',
        title: 'Todo',
        cards: [{ id: 'c1', title: 'One', description: 'desc', laneId: 'eng' }],
      },
      { id: 'done', title: 'Done', cards: [] },
    ];
    const el = kanban({
      columns,
      lanes: [{ id: 'eng', title: 'Engineering' }],
      onCardMove: () => {},
      onCardClick: () => {},
      onCardSelect: () => {},
    });
    expect(el.type).toBe('kanban');
    expect(el.props.columns).toEqual(columns);
    expect(el.props.lanes).toEqual([{ id: 'eng', title: 'Engineering' }]);
    expect(el.props.events).toEqual(
      expect.arrayContaining(['cardMove', 'cardClick', 'cardSelect']),
    );

    const bare = kanban({ columns });
    expect(bare.props.events).toEqual(expect.arrayContaining(['cardMove', 'cardSelect']));
  });

  test('relativeTime is display-only and defaults styles', () => {
    const el = relativeTime({
      timezones: ['America/New_York', { zone: 'Europe/London', label: 'GMT' }],
      dateStyle: 'short',
    });
    expect(el.type).toBe('relativeTime');
    expect(el.props).toMatchObject({
      timezones: ['America/New_York', { zone: 'Europe/London', label: 'GMT' }],
      dateStyle: 'short',
      timeStyle: 'medium',
    });
    expect(el.props.date).toBeUndefined();
    expect(el.props.events ?? []).toEqual([]);
  });

  test('qrCode is display-only with defaults', () => {
    const el = qrCode({ value: 'https://example.com', size: 200, level: 'H' });
    expect(el.type).toBe('qrCode');
    expect(el.props).toMatchObject({
      value: 'https://example.com',
      size: 200,
      level: 'H',
    });
    expect(el.props.events ?? []).toEqual([]);
    const el2 = qrCode({ value: 'x' });
    expect(el2.props).toMatchObject({ size: 160, level: 'M' });
  });

  test('imageZoom is display-only', () => {
    const el = imageZoom({ src: '/photo.jpg', alt: 'Photo' });
    expect(el.type).toBe('imageZoom');
    expect(el.props).toMatchObject({ src: '/photo.jpg', alt: 'Photo' });
    expect(el.props.events ?? []).toEqual([]);
  });

  test('list wires groups and always registers itemMove settle', () => {
    const groups = [
      {
        id: 'inbox',
        title: 'Inbox',
        items: [{ id: 'i1', title: 'One', description: 'desc' }],
      },
      { id: 'done', title: 'Done', items: [] },
    ];
    const el = list({
      groups,
      onItemMove: () => {},
      onItemClick: () => {},
    });
    expect(el.type).toBe('list');
    expect(el.props.groups).toEqual(groups);
    expect(el.props.events).toEqual(expect.arrayContaining(['itemMove', 'itemClick']));

    const bare = list({ groups });
    expect(bare.props.events).toEqual(expect.arrayContaining(['itemMove']));
  });

  test('imageCrop wires src/aspect and crop event', () => {
    const el = imageCrop({
      src: '/photo.jpg',
      aspect: 16 / 9,
      onCrop: () => {},
    });
    expect(el.type).toBe('imageCrop');
    expect(el.props).toMatchObject({ src: '/photo.jpg', aspect: 16 / 9 });
    expect(el.props.events).toEqual(expect.arrayContaining(['crop']));
  });

  test('gantt wires rows/markers/deps/range and always registers settle events', () => {
    const rows = [
      {
        id: 'r1',
        title: 'Design',
        items: [
          { id: 'i1', title: 'Wireframes', start: '2026-08-01', end: '2026-08-10' },
          { id: 'i2', title: 'UI kit', start: '2026-08-11', end: '2026-08-20' },
        ],
      },
    ];
    const el = gantt({
      rows,
      markers: [{ id: 'm1', date: '2026-08-15', label: 'Beta' }],
      dependencies: [{ id: 'd1', from: 'i1', to: 'i2' }],
      range: { start: '2026-07-01', end: '2026-09-01' },
      readonly: false,
      onItemMove: () => {},
      onItemClick: () => {},
      onMarkerAdd: () => {},
    });
    expect(el.type).toBe('gantt');
    expect(el.props.rows).toEqual(rows);
    expect(el.props.markers).toEqual([{ id: 'm1', date: '2026-08-15', label: 'Beta' }]);
    expect(el.props.dependencies).toEqual([{ id: 'd1', from: 'i1', to: 'i2' }]);
    expect(el.props.range).toEqual({ start: '2026-07-01', end: '2026-09-01' });
    expect(el.props.readonly).toBe(false);
    expect(el.props.events).toEqual(
      expect.arrayContaining(['itemMove', 'itemClick', 'markerAdd']),
    );

    const bare = gantt({ rows });
    expect(bare.props.events).toEqual(
      expect.arrayContaining(['itemMove', 'markerAdd']),
    );
  });

  test('flow builds flowNode children with edges and settle events', () => {
    const edges = [{ id: 'e1', source: 'a', target: 'b', sourceHandle: 'out', targetHandle: 'in' }];
    const el = flow(
      {
        edges,
        fitView: false,
        showMiniMap: false,
        showControls: true,
        onConnect: () => {},
        onNodeMove: () => {},
        onNodesDelete: () => {},
        onEdgesDelete: () => {},
        onSelectionChange: () => {},
      },
      (f) => {
        f.node(
          {
            id: 'a',
            position: { x: 0, y: 0 },
            handles: [{ id: 'out', type: 'source', position: 'right' }],
          },
          () => {},
        );
        f.node({ id: 'b', position: { x: 200, y: 0 } }, () => {});
      },
    );
    expect(el).toBeInstanceOf(FlowElement);
    expect(el.type).toBe('flow');
    expect(el.props).toMatchObject({
      edges,
      fitView: false,
      showMiniMap: false,
      showControls: true,
    });
    expect(el.children).toHaveLength(2);
    expect(el.children[0]!.type).toBe('flowNode');
    expect(el.children[0]!.props).toMatchObject({
      id: 'a',
      position: { x: 0, y: 0 },
      handles: [{ id: 'out', type: 'source', position: 'right' }],
    });
    expect(el.children[1]!.props.id).toBe('b');
    expect(el.getPositions()).toEqual({
      a: { x: 0, y: 0 },
      b: { x: 200, y: 0 },
    });
    expect(el.props.events).toEqual(
      expect.arrayContaining([
        'connect',
        'nodeMove',
        'nodesDelete',
        'edgesDelete',
        'selectionChange',
      ]),
    );
  });

  test('dialogStack builds steps with open/index events', () => {
    const el = dialogStack({ title: 'Wizard', open: false, index: 0 }, (stack) => {
      stack.step({ title: 'One' }, () => {});
      stack.step({ title: 'Two' }, () => {});
    });
    expect(el).toBeInstanceOf(DialogStackElement);
    expect(el.type).toBe('dialogStack');
    expect(el.props).toMatchObject({ title: 'Wizard', open: false, index: 0 });
    expect(el.children).toHaveLength(2);
    expect(el.children[0]!.type).toBe('dialogStackStep');
    expect(el.props.events).toEqual(expect.arrayContaining(['close', 'indexChange']));
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
