import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { BoundGantt } from './BoundGantt';

test('items in a shared row get separate lanes and dependency endpoints follow them', () => {
  const html = renderToStaticMarkup(
    <BoundGantt id="timeline" style={undefined} emit={() => {}} props={{
      range: { start: '2026-08-01', end: '2026-08-10' },
      rows: [{ id: 'build', title: 'Build', items: [
        { id: 'a', title: 'First', start: '2026-08-01', end: '2026-08-05' },
        { id: 'b', title: 'Second', start: '2026-08-03', end: '2026-08-10' },
      ] }],
      dependencies: [{ id: 'ab', from: 'a', to: 'b' }],
    }} />,
  );
  expect(html).toContain('height:96px');
  expect(html).toContain('top:10px');
  expect(html).toContain('top:58px');
  expect(html).toContain('M 160 24');
  expect(html).toContain('L 64 72');
  expect(html).toContain('width:256px'); // Inclusive end fills the last day.
  expect(html).toContain('sm:w-44');
  expect(html).toContain('Swipe horizontally');
});
