import { describe, expect, test } from 'bun:test';
import { label } from '@badui/components';
import { Column, Row } from '@badui/components';
import { getCurrentContainer, resetStackForTests, runPageBuilder, withContainer } from './stack';

describe('container stack', () => {
  test('runPageBuilder collects top-level children', () => {
    resetStackForTests();
    const root = runPageBuilder(() => {
      getCurrentContainer().add(label('Hello'));
      getCurrentContainer().add(label('World'));
    });

    expect(root.render()).toContain('Hello');
    expect(root.render()).toContain('World');
  });

  test('withContainer nests children', () => {
    resetStackForTests();
    const root = runPageBuilder(() => {
      withContainer(new Row(), () => {
        getCurrentContainer().add(label('Inside row'));
      });
    });

    const html = root.render();
    expect(html).toContain('flex-row');
    expect(html).toContain('Inside row');
  });

  test('column stack adds to parent', () => {
    resetStackForTests();
    const root = runPageBuilder(() => {
      withContainer(new Column(), () => {
        getCurrentContainer().add(label('A'));
        withContainer(new Row(), () => {
          getCurrentContainer().add(label('B'));
        });
      });
    });

    const html = root.render();
    expect(html).toContain('A');
    expect(html).toContain('B');
  });
});
