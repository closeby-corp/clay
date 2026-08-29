export type CliArgs = {
  entry?: string;
  port: number;
  title?: string;
  app: boolean;
  open: boolean;
  reload: boolean;
  /** Register Bun loader for compile-time reactive `let` (default false — opt in with --reactive-let). */
  reactiveLet: boolean;
  /**
   * Auto-build + inject Tailwind for the entry (default true).
   * Scans the entry directory (or the file’s folder) for className strings.
   */
  tailwind: boolean;
  help: boolean;
};

const USAGE = `Usage: clay <file.ts|dir> [options]

  clay hello.ts              Run a single-file app
  clay ./pages               Load every page under a directory
  clay ./pages --app         Same + dashboard shell (nav from pages)

Options:
  -p, --port <n>     Port (default: 3000)
  -t, --title <str>  HTML / shell title
  --app              Wrap pages in the app shell with navFromPages()
  --open             Open the browser (default)
  --no-open          Do not open the browser
  --reload           Restart on file changes (Bun --watch); opens browser once;
                     prints ↻ on each reload and re-imports pages with a cache bust
  --tailwind         Auto-build Tailwind from the entry (default)
  --no-tailwind      Disable auto Tailwind injection
  --reactive-let     Enable compile-time reactive let Bun loader (off by default)
  --no-reactive-let  Disable reactive-let (default; explicit no-op)
  -h, --help         Show help

Directory entries may include optional _run.ts exporting configureRun(base)
to merge into ui.run (skipped by loadPages).

Tailwind: by default Clay scans your entry for className / .classes(...) and
injects generated utilities (no app Tailwind config required). Use --no-tailwind
to turn this off. Output lives under .clay/tailwind.css.
`;

export function printUsage(): void {
  console.log(USAGE);
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    port: 3000,
    app: false,
    open: true,
    reload: false,
    reactiveLet: false,
    tailwind: true,
    help: false,
  };

  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '-h' || a === '--help') {
      args.help = true;
    } else if (a === '--app') {
      args.app = true;
    } else if (a === '--open') {
      args.open = true;
    } else if (a === '--no-open') {
      args.open = false;
    } else if (a === '--reload') {
      args.reload = true;
    } else if (a === '--tailwind') {
      args.tailwind = true;
    } else if (a === '--no-tailwind') {
      args.tailwind = false;
    } else if (a === '--reactive-let') {
      args.reactiveLet = true;
    } else if (a === '--no-reactive-let') {
      args.reactiveLet = false;
    } else if (a === '-p' || a === '--port') {
      const next = argv[++i];
      if (!next || Number.isNaN(Number(next))) {
        throw new Error(`${a} requires a numeric port`);
      }
      args.port = Number(next);
    } else if (a === '-t' || a === '--title') {
      const next = argv[++i];
      if (!next) throw new Error(`${a} requires a title string`);
      args.title = next;
    } else if (a.startsWith('-')) {
      throw new Error(`Unknown option: ${a}`);
    } else {
      positional.push(a);
    }
  }

  if (positional.length > 1) {
    throw new Error(`Unexpected arguments: ${positional.slice(1).join(' ')}`);
  }
  args.entry = positional[0];
  return args;
}
