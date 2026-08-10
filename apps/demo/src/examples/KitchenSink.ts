import { Element } from '@clay/core';
import { ui } from '@clay/ui';

export const pageMeta = {
  label: 'Kitchen Sink',
  icon: 'boxes',
  order: 100,
};

ui.page('/examples/kitchen-sink', () => {
    new Element('kitchensink', {});
});
