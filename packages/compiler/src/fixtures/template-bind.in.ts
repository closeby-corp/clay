import { page } from '@badui/core';
import { label } from '@badui/components';

page('/test', () => {
  let count = 0;
  label(`Count: ${count}`);
  label(() => `Already bound`);
});
