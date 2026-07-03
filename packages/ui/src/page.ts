import { page as corePage, type PageContext } from '@badui/core';
import { runPageBuilder } from './stack';

type PageBody = ((ctx: PageContext) => void) | (() => void);

export function page(path: string, fn: PageBody): void {
  corePage(path, (ctx) => {
    return runPageBuilder(() => {
      if (fn.length > 0) {
        (fn as (ctx: PageContext) => void)(ctx);
      } else {
        (fn as () => void)();
      }
    });
  });
}
