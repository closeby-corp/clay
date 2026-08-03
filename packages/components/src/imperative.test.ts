import { describe, expect, test, beforeEach } from 'bun:test';
import {
  ClientSession,
  clearPages,
  page,
  resetIdSequence,
  runWithSession,
  type ServerMessage,
} from '@badui/core';
import { confirm, prompt, choose } from './imperative';
import type { Element } from '@badui/core';

function findByType(root: Element, type: string): Element[] {
  const out: Element[] = [];
  const walk = (el: Element) => {
    if (el.type === type) out.push(el);
    for (const c of el.children) walk(c);
  };
  walk(root);
  return out;
}

function findButton(root: Element, text: string): Element | undefined {
  return findByType(root, 'button').find((b) => b.props.text === text);
}

describe('imperative helpers', () => {
  beforeEach(() => {
    clearPages();
    resetIdSequence();
    page('/imperative-test', () => {});
  });

  test('confirm resolves true on OK', async () => {
    const messages: ServerMessage[] = [];
    const session = new ClientSession('/imperative-test', (m) => messages.push(m));
    session.mount();

    const resultPromise = runWithSession(session, () => confirm('Sure?'));
    await Promise.resolve();

    const ok = findButton(session.root!, 'OK');
    expect(ok).toBeTruthy();
    await runWithSession(session, () => ok!.handleEvent('click'));
    expect(await resultPromise).toBe(true);
  });

  test('confirm resolves false on Cancel', async () => {
    const session = new ClientSession('/imperative-test', () => {});
    session.mount();

    const resultPromise = runWithSession(session, () => confirm('Sure?'));
    await Promise.resolve();

    const cancel = findButton(session.root!, 'Cancel');
    await runWithSession(session, () => cancel!.handleEvent('click'));
    expect(await resultPromise).toBe(false);
  });

  test('prompt returns input value', async () => {
    const session = new ClientSession('/imperative-test', () => {});
    session.mount();

    const resultPromise = runWithSession(session, () =>
      prompt('Name?', { defaultValue: 'Ada' }),
    );
    await Promise.resolve();

    const inputEl = findByType(session.root!, 'input')[0];
    expect(inputEl).toBeTruthy();
    await runWithSession(session, () => inputEl!.handleEvent('input', 'Lin'));
    const ok = findButton(session.root!, 'OK');
    await runWithSession(session, () => ok!.handleEvent('click'));
    expect(await resultPromise).toBe('Lin');
  });

  test('prompt cancel returns null', async () => {
    const session = new ClientSession('/imperative-test', () => {});
    session.mount();

    const resultPromise = runWithSession(session, () => prompt('Name?'));
    await Promise.resolve();
    const cancel = findButton(session.root!, 'Cancel');
    await runWithSession(session, () => cancel!.handleEvent('click'));
    expect(await resultPromise).toBeNull();
  });

  test('choose returns selected value', async () => {
    const session = new ClientSession('/imperative-test', () => {});
    session.mount();

    const resultPromise = runWithSession(session, () =>
      choose('Pick', ['Red', 'Green', 'Blue']),
    );
    await Promise.resolve();
    const green = findButton(session.root!, 'Green');
    await runWithSession(session, () => green!.handleEvent('click'));
    expect(await resultPromise).toBe('Green');
  });

  test('notify sends id, type, duration, position, description', () => {
    const messages: ServerMessage[] = [];
    const session = new ClientSession('/imperative-test', (m) => messages.push(m));
    session.mount();
    messages.length = 0;

    runWithSession(session, () => {
      session.notify('Hello', {
        type: 'success',
        duration: 1000,
        position: 'top-left',
        description: 'All good',
      });
    });

    const note = messages.find((m) => m.op === 'notify');
    expect(note?.op).toBe('notify');
    if (note?.op === 'notify') {
      expect(note.message).toBe('Hello');
      expect(note.type).toBe('success');
      expect(note.duration).toBe(1000);
      expect(note.position).toBe('top-left');
      expect(note.description).toBe('All good');
      expect(typeof note.id).toBe('string');
      expect(note.id.length).toBeGreaterThan(0);
    }
  });
});
