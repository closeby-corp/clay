import { Element } from '@close-by/clay-core';
import { ui } from '@close-by/clay';

export const pageMeta = {
  label: 'Kitchen Sink',
  icon: 'boxes',
  order: 100,
};

ui.page('/examples/kitchen-sink', () => {
    new Element('kitchensink', {});
});
