import { resolve } from 'node:path';
import { createUploadsApp, defaultWorkflowPaths } from './service';

function options(args: string[]) {
  const defaults = defaultWorkflowPaths();
  const result = { host: '127.0.0.1', port: 4175, dataDir: defaults.dataDir, assetsDir: defaults.assetsDir };
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    const value = args[++i];
    if (!value) throw new Error(`Missing value for ${key}`);
    switch (key) {
      case '--host': result.host = value; break;
      case '--port': {
        const port = Number(value);
        if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid --port');
        result.port = port;
        break;
      }
      case '--data-dir': result.dataDir = resolve(value); break;
      case '--assets': result.assetsDir = resolve(value); break;
      default: throw new Error(`Unknown option: ${key}`);
    }
  }
  return result;
}

if (import.meta.main) {
  const config = options(Bun.argv.slice(2));
  const app = createUploadsApp(config);
  const server = Bun.serve({
    hostname: config.host,
    port: config.port,
    fetch: (request, server) => app.fetch(request, server.requestIP(request)?.address),
  });
  console.log(`Clay uploads backend listening on http://${config.host}:${server.port}`);
}
