import type { Component } from '@badui/core';
import { Container } from '@badui/components';

let stack: Component[] = [];
let pageRoot: Container | null = null;

export function getCurrentContainer(): Component {
  if (stack.length === 0) {
    throw new Error('No active UI container. Use ui.page() or a layout callback first.');
  }
  return stack[stack.length - 1]!;
}

export function getPageRoot(): Container | null {
  return pageRoot;
}

export function pushContainer(container: Component): void {
  if (stack.length > 0) {
    getCurrentContainer().add(container);
  }
  stack.push(container);
  if (!pageRoot && container instanceof Container) {
    pageRoot = container;
  }
}

export function popContainer(): Component {
  const container = stack.pop();
  if (!container) {
    throw new Error('Container stack underflow.');
  }
  return container;
}

export function withContainer<T extends Component>(container: T, fn: () => void): T {
  pushContainer(container);
  try {
    fn();
  } finally {
    popContainer();
  }
  return container;
}

export function runPageBuilder(fn: () => void): Container {
  stack = [];
  pageRoot = null;
  const root = new Container({ centered: true, width: '7xl' });
  pushContainer(root);
  try {
    fn();
  } finally {
    stack = [];
  }
  return root;
}

export function resetStackForTests(): void {
  stack = [];
  pageRoot = null;
}
