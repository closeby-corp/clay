import { page } from '@badui/core';
import { label } from '@badui/components';

page('/examples/already', ({ state }) => {
  state.defaults({ count: 0 });
  return label(() => `Count: ${state.count}`);
});
