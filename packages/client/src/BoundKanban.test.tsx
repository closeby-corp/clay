import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { BoundKanban } from './BoundKanban';

test('swimlane columns retain a readable minimum and share the available width', () => {
  const html = renderToStaticMarkup(
    <BoundKanban id="board" style={undefined} emit={() => {}} props={{
      columns: [
        { id: 'todo', title: 'Todo', cards: [{ id: 'a', title: 'Task', laneId: 'eng' }] },
        { id: 'done', title: 'Done', cards: [] },
      ],
      lanes: [{ id: 'eng', title: 'Engineering' }],
    }} />,
  );
  expect(html).toContain('min-w-0 max-w-full');
  expect(html).toContain('overflow-x-auto');
  expect(html).toContain('5rem repeat(2, minmax(16rem, 1fr))');
  expect(html).toContain('Swipe horizontally');
  expect(html).toContain('Done');
});
