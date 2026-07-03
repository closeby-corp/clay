import { page } from '@badui/core';

page('/test', () => {
  let count = 0;
  count += 1;
  count++;
  ++count;
  count--;
});
