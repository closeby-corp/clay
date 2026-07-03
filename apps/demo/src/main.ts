import { Component, State } from '@badui/core';
import * as Server from '@badui/server';
import * as Components from '@badui/components';

// Import all examples
import './examples';

console.log('BadUI Demo Application');
console.log('Components available:', Object.keys(Components));

const port = Bun.env.PORT ? parseInt(Bun.env.PORT) : 4000;
// Create and start server
const server = new Server.BadUIServer({
  port,
  title: 'BadUI Demo',
  theme: 'cmyk'
});

server.start();

console.log(`Demo server running at http://localhost:${port}`);
console.log('Available examples:');
console.log('  - /examples/counter');
console.log('  - /examples/todo');
console.log('  - /examples/chat');
console.log('  - /examples/upload');
console.log('  - /examples/dashboard');
console.log('  - /examples/form-demo');
