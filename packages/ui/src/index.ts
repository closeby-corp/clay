import * as uiMethods from './ui';
import { page } from './page';
import { run } from './run';
import { getCurrentContainer } from './stack';

export { page } from './page';
export { run } from './run';
export { getCurrentContainer, getPageRoot, withContainer, runPageBuilder } from './stack';

export const ui = {
  ...uiMethods,
  page,
  run,
  getCurrentContainer,
};

export default ui;
