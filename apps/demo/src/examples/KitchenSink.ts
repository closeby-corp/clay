import { Element } from '@badui/core';
import { ui } from '@badui/ui';

export const pageMeta = {
  label: 'Kitchen Sink',
  icon: 'boxes',
  order: 100,
};

ui.page('/examples/kitchen-sink', () => {
    new Element('kitchensink', {});
});
