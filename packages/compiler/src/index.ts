import {
  mightNeedReactiveLet,
  transformReactiveLet,
  type TransformReactiveLetOptions,
  type TransformReactiveLetResult,
} from './transform.ts';

export {
  mightNeedReactiveLet,
  transformReactiveLet,
  type TransformReactiveLetOptions,
  type TransformReactiveLetResult,
};

export {
  registerReactiveLetPlugin,
  ensureReactiveLetPluginForPaths,
  isReactiveLetPluginRegistered,
  resetReactiveLetPluginForTests,
} from './plugin.ts';
export { FRAGILE_CJS_PACKAGES, collectFragileImportWarnings } from './fragile-imports.ts';
export {
  FORBIDDEN_PAGE_GLOBALS,
  looksLikeClayPage,
  checkClayPageModule,
  collectPageGlobalWarnings,
  type CheckClayPageResult,
} from './page-globals.ts';
export { warnClayPageIssues } from './warn-page.ts';
