import { describe, expect, test } from 'bun:test';
import {
  createReconnectController,
  reconnectDelayMs,
  WS_RECONNECT_MAX_MS,
} from './reconnect';

describe('reconnectDelayMs', () => {
  test('follows 500 → 1s → 2s → … capped at 10s', () => {
    expect(reconnectDelayMs(0)).toBe(500);
    expect(reconnectDelayMs(1)).toBe(1000);
    expect(reconnectDelayMs(2)).toBe(2000);
    expect(reconnectDelayMs(3)).toBe(4000);
    expect(reconnectDelayMs(4)).toBe(8000);
    expect(reconnectDelayMs(5)).toBe(WS_RECONNECT_MAX_MS);
    expect(reconnectDelayMs(6)).toBe(WS_RECONNECT_MAX_MS);
  });
});

describe('createReconnectController', () => {
  test('schedules reconnect on close when not disposed', () => {
    const scheduled: Array<{ fn: () => void; ms: number }> = [];
    const controller = createReconnectController({
      schedule: (fn, ms) => {
        scheduled.push({ fn, ms });
        return scheduled.length as unknown as ReturnType<typeof setTimeout>;
      },
      clear: () => {},
    });

    let connects = 0;
    const delay = controller.scheduleReconnect(() => {
      connects += 1;
    });
    expect(delay).toBe(500);
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0]!.ms).toBe(500);

    scheduled[0]!.fn();
    expect(connects).toBe(1);

    const delay2 = controller.scheduleReconnect(() => {
      connects += 1;
    });
    expect(delay2).toBe(1000);
  });

  test('does not reconnect after dispose', () => {
    const scheduled: Array<{ fn: () => void; ms: number }> = [];
    const controller = createReconnectController({
      schedule: (fn, ms) => {
        scheduled.push({ fn, ms });
        return scheduled.length as unknown as ReturnType<typeof setTimeout>;
      },
      clear: () => {},
    });

    controller.dispose();
    expect(controller.isDisposed()).toBe(true);
    expect(controller.scheduleReconnect(() => {})).toBeNull();
    expect(scheduled).toHaveLength(0);
  });

  test('resetAttempt restarts backoff', () => {
    const scheduled: number[] = [];
    const controller = createReconnectController({
      schedule: (_fn, ms) => {
        scheduled.push(ms);
        return scheduled.length as unknown as ReturnType<typeof setTimeout>;
      },
      clear: () => {},
    });

    controller.scheduleReconnect(() => {});
    controller.scheduleReconnect(() => {});
    controller.resetAttempt();
    controller.scheduleReconnect(() => {});
    expect(scheduled).toEqual([500, 1000, 500]);
  });
});
