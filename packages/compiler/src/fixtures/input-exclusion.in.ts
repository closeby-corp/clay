import { page } from '@badui/core';
import { input, label } from '@badui/components';

page('/examples/form', () => {
  let count = 0;
  let name = input('name', { placeholder: 'Name' });

  return label(() => `${count} ${name}`);
});
