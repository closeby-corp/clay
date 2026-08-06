import { describe, expect, test, beforeEach } from 'bun:test';
import {
  ClientSession,
  clearPages,
  page,
  resetIdSequence,
  runWithSession,
  runJavaScript,
  scroll,
  type ServerMessage,
} from './index';

describe('runJavaScript / scroll', () => {
  beforeEach(() => {
    clearPages();
    resetIdSequence();
    page('/js-test', () => {});
  });

  test('runJavaScript sends protocol op', () => {
    const messages: ServerMessage[] = [];
    const session = new ClientSession('/js-test', (m) => messages.push(m));
    session.mount();
    messages.length = 0;

    runWithSession(session, () => {
      runJavaScript('console.log("hi")');
    });

    expect(messages).toEqual([{ op: 'runJavaScript', code: 'console.log("hi")' }]);
  });

  test('scroll.to and scroll.intoView send scroll ops', () => {
    const messages: ServerMessage[] = [];
    const session = new ClientSession('/js-test', (m) => messages.push(m));
    session.mount();
    messages.length = 0;

    runWithSession(session, () => {
      scroll.to({ top: 'bottom', behavior: 'smooth' });
      scroll.intoView('#footer', { block: 'start' });
      scroll.to({ top: 0 });
    });

    expect(messages).toEqual([
      { op: 'scroll', target: 'window', top: 'bottom', behavior: 'smooth' },
      {
        op: 'scroll',
        target: 'selector',
        selector: '#footer',
        block: 'start',
      },
      { op: 'scroll', target: 'window', top: 0 },
    ]);
  });
});
