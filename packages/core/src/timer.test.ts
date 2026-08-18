import { describe, expect, test, beforeEach } from 'bun:test';
import {
  ClientSession,
  clearPages,
  page,
  resetIdSequence,
  runWithSession,
  timer,
  TimerHandle,
} from '@close-by/clay-core';

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe('ui.timer', () => {
  beforeEach(() => {
    clearPages();
    resetIdSequence();
    page('/timer-test', () => {});
  });

  test('repeating timer fires callback with session context', async () => {
    const session = new ClientSession('/timer-test', () => {});
    session.mount();

    let ticks = 0;
    let handle!: TimerHandle;
    runWithSession(session, () => {
      handle = timer(0.05, () => {
        ticks++;
      });
    });

    await wait(180);
    handle.cancel();
    expect(ticks).toBeGreaterThanOrEqual(2);
    expect(handle.cancelled).toBe(true);
  });

  test('once timer fires a single time then cancels', async () => {
    const session = new ClientSession('/timer-test', () => {});
    session.mount();

    let ticks = 0;
    let handle!: TimerHandle;
    runWithSession(session, () => {
      handle = timer(0.05, () => {
        ticks++;
      }, { once: true });
    });

    await wait(150);
    expect(ticks).toBe(1);
    expect(handle.cancelled).toBe(true);
  });

  test('deactivate pauses and activate resumes', async () => {
    const session = new ClientSession('/timer-test', () => {});
    session.mount();

    let ticks = 0;
    let handle!: TimerHandle;
    runWithSession(session, () => {
      handle = timer(0.05, () => {
        ticks++;
      });
    });

    await wait(80);
    handle.deactivate();
    const pausedAt = ticks;
    expect(pausedAt).toBeGreaterThanOrEqual(1);
    await wait(120);
    expect(ticks).toBe(pausedAt);

    handle.activate();
    await wait(100);
    handle.cancel();
    expect(ticks).toBeGreaterThan(pausedAt);
  });

  test('cancel prevents reactivation', async () => {
    const session = new ClientSession('/timer-test', () => {});
    session.mount();

    let ticks = 0;
    let handle!: TimerHandle;
    runWithSession(session, () => {
      handle = timer(0.05, () => {
        ticks++;
      });
    });

    handle.cancel();
    handle.activate();
    await wait(100);
    expect(ticks).toBe(0);
    expect(handle.active).toBe(false);
  });

  test('session destroy cancels timers', async () => {
    const session = new ClientSession('/timer-test', () => {});
    session.mount();

    let ticks = 0;
    runWithSession(session, () => {
      timer(0.05, () => {
        ticks++;
      });
    });

    await wait(80);
    expect(ticks).toBeGreaterThanOrEqual(1);
    const beforeDestroy = ticks;
    session.destroy();
    await wait(120);
    expect(ticks).toBe(beforeDestroy);
  });
});
