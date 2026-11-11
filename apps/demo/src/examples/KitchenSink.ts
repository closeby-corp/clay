import { Element } from '@close-by/clay-core';
import { ui } from '@close-by/clay';

export const pageMeta = {
  label: 'Kitchen sink',
  icon: 'boxes',
  order: 14,
  group: 'Start here',
  groupIcon: 'sparkles',
};

ui.page('/examples/kitchen-sink', () => {
    new Element('kitchensink', {});
});
