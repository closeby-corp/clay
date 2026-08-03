import { Element } from '@badui/core';
import { ui } from '@badui/ui';
import { APP_SHELL } from '../nav';

ui.page('/examples/dashboard', () => {
  ui.app({ ...APP_SHELL }, () => {
    new Element('dashboard01', {});
  });
});
