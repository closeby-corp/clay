import { ui } from '@clay/ui';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Controls Extra',
  icon: 'layers',
  order: 87,
};

ui.page('/examples/controls-extra', () => {
  const treeState = ui.state({
    selected: 'src',
    expanded: ['root', 'src'],
  });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'Rating, color picker, tags (Form Demo), code block, tree — plus upload dropzone on File Upload.',
        );

        exampleSection('Code block', 'ui.codeBlock — Shiki highlight + optional copy.');
        ui.codeBlock({
          language: 'typescript',
          code: `import { ui } from '@clay/ui';

ui.page('/hello', () => {
  ui.label('Hello').classes('text-lg font-semibold');
  ui.button('Ping', { onClick: () => ui.notify('pong') });
});`,
        });

        ui.separator();

        exampleSection('Tree', 'ui.tree — nested nodes with select + expand.');
        const treePanel = ui.refreshable(() => {
          ui.tree({
            selected: treeState.selected,
            expanded: treeState.expanded,
            nodes: [
              {
                id: 'root',
                label: 'project',
                children: [
                  {
                    id: 'src',
                    label: 'src',
                    children: [
                      { id: 'main', label: 'main.ts' },
                      { id: 'chrome', label: 'chrome.ts' },
                    ],
                  },
                  {
                    id: 'docs',
                    label: 'docs',
                    children: [
                      { id: 'api', label: 'api.md' },
                      { id: 'elements', label: 'elements.md' },
                    ],
                  },
                ],
              },
            ],
            onSelect: (id) => {
              treeState.selected = id;
              ui.notify(`Selected: ${id}`, 'info');
              treePanel.refresh();
            },
            onExpand: (expanded) => {
              treeState.expanded = expanded;
              treePanel.refresh();
            },
          });
          ui.label(`Selected: ${treeState.selected || '—'}`).classes(
            'text-sm text-muted-foreground',
          );
        });

        ui.separator();

        exampleSection(
          'Also on Form Demo',
          'ui.rating, ui.colorPicker, and ui.tags with bindValue + draft.',
        );
        ui.button('Open Form Demo', {
          variant: 'outline',
          onClick: () => ui.navigate('/examples/form-demo'),
        });
        ui.button('Open File Upload (dropzone)', {
          variant: 'outline',
          onClick: () => ui.navigate('/examples/upload'),
        });
      },
      { gap: 6 },
    );
  });
});
