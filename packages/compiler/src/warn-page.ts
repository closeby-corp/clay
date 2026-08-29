import { checkClayPageModule } from './page-globals.ts';

/** Log dev warnings for Clay page modules (DOM globals). No-op when `CLAY_NO_PAGE_CHECKS=1`. */
export function warnClayPageIssues(source: string, fileName: string): void {
  if (process.env.CLAY_NO_PAGE_CHECKS === '1') return;
  const { warnings } = checkClayPageModule(source, fileName);
  for (const w of warnings) {
    console.warn(`[clay-page] ${fileName}: ${w}`);
  }
}
