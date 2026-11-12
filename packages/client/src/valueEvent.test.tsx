import { expect, test } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ElementRenderer } from './ElementRenderer';
import { echoValueEvent } from './echoValueEvent';
import type { ElementNode } from './protocol';
import { useClaySession } from './useSession';

const input: ElementNode = {
  id: 'field', type: 'input', props: { value: '', events: ['input'] }, children: [],
};

test('typing through emit is cleared by a server patch to the initial value', async () => {
  const window = new Window({ url: 'http://localhost/' });
  let socket: FakeSocket;
  class FakeSocket {
    static OPEN = 1;
    readyState = 1;
    onmessage: ((event: { data: string }) => void) | null = null;
    sent: string[] = [];
    constructor() { socket = this; }
    send(message: string) { this.sent.push(message); }
    close() {}
  }
  const globals = { window, document: window.document, WebSocket: FakeSocket, requestAnimationFrame: window.requestAnimationFrame.bind(window), IS_REACT_ACT_ENVIRONMENT: true };
  const previous = new Map(Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  let session: ReturnType<typeof useClaySession>;
  function App() {
    session = useClaySession('/');
    return session.tree ? <ElementRenderer node={session.tree} emit={session.emit} /> : null;
  }
  const container = window.document.createElement('div');
  const mounted = createRoot(container as unknown as HTMLElement);
  try {
    await act(async () => { mounted.render(<App />); });
    await act(async () => { socket!.onmessage!({ data: JSON.stringify({ op: 'mount', tree: input }) }); });
    const field = container.querySelector('input')!;
    expect(field.value).toBe('');
    const propsKey = Object.keys(field).find((key) => key.startsWith('__reactProps$'))!;
    const type = async (value: string) => {
      await act(async () => {
        field.value = value;
        (field as any)[propsKey].onChange({ target: field });
      });
    };
    await type('abc');
    expect(field.value).toBe('abc');
    await type('abcd');
    expect(field.value).toBe('abcd');
    expect(socket!.sent.map((message) => JSON.parse(message))).toEqual([
      { op: 'event', id: 'field', type: 'input', value: 'abc' },
      { op: 'event', id: 'field', type: 'input', value: 'abcd' },
    ]);
    await act(async () => { socket!.onmessage!({ data: JSON.stringify({ op: 'patch', patches: [{ op: 'updateProps', id: 'field', props: { value: '' } }] }) }); });
    expect(field.value).toBe('');
  } finally {
    await act(async () => { mounted.unmount(); });
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
    await window.happyDOM.close();
  }
});

test('only primitive value events update value props and preserve unrelated nodes', () => {
  const tree: ElementNode = { id: 'root', type: 'column', props: {}, children: [input] };
  for (const [type, value] of [['click', 'abc'], ['input', { value: 'abc' }], ['input', ['abc']], ['input', undefined], ['input', null]] as const) {
    expect(echoValueEvent(tree, 'field', type, value)).toBe(tree);
  }
  expect(echoValueEvent(tree, 'root', 'input', 'abc')).toBe(tree);
  expect(echoValueEvent(tree, 'field', 'input', '')).toBe(tree);
  for (const value of ['abc', 12, false]) {
    const next = echoValueEvent(tree, 'field', 'change', value);
    expect(next.children[0]!.props.value).toBe(value);
    expect(input.props.value).toBe('');
  }
});
