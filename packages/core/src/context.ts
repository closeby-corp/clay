import type { Element } from './element';
import type { ClientSession } from './session';

const parentStack: Element[] = [];
let currentSession: ClientSession | null = null;

export function getCurrentSession(): ClientSession | null {
  return currentSession;
}

export function setCurrentSession(session: ClientSession | null): void {
  currentSession = session;
}

export function runWithSession<T>(session: ClientSession, fn: () => T): T {
  const prev = currentSession;
  currentSession = session;
  try {
    return fn();
  } finally {
    currentSession = prev;
  }
}

export function getCurrentParent(): Element | null {
  return parentStack[parentStack.length - 1] ?? null;
}

export function pushParent(el: Element): void {
  parentStack.push(el);
}

export function popParent(): void {
  parentStack.pop();
}

export function withParent<T>(parent: Element, fn: () => T): T {
  pushParent(parent);
  try {
    return fn();
  } finally {
    popParent();
  }
}

/**
 * Run `fn` with no current parent so created Elements are not attached to the tree.
 * Session registration still applies; callers should destroy ephemeral elements after use.
 */
export function withDetached<T>(fn: () => T): T {
  const saved = parentStack.splice(0, parentStack.length);
  try {
    return fn();
  } finally {
    parentStack.push(...saved);
  }
}

export function clearParentStack(): void {
  parentStack.length = 0;
}
