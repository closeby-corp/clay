import { BadUIServer, type BadUIServerConfig } from '@badui/server';

export function run(config: BadUIServerConfig = {}): BadUIServer {
  const server = new BadUIServer(config);
  server.start();
  return server;
}
