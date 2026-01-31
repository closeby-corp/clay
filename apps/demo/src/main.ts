import { Component, State } from '@ralph/core';
import * as Server from '@ralph/server';
import * as Components from '@ralph/components';

// Import all examples
import './examples';

console.log('Ralph UI Demo Application');
console.log('Components available:', Object.keys(Components));

// Create and start server
const server = new Server.RalphServer({
  port: 4000,
  title: 'Ralph UI Demo',
  theme: 'light'
});

server.start();

console.log('Demo server running at http://localhost:3000');
console.log('Available examples:');
console.log('  - /examples/counter');
console.log('  - /examples/counter-advanced');
console.log('  - /examples/todo');
console.log('  - /examples/chat');
console.log('  - /examples/upload');
console.log('  - /examples/dashboard');
