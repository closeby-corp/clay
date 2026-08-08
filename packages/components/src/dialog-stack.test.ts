import { describe, expect, test } from 'bun:test';
import { DialogStackElement, dialogStack } from './dialog-stack';

describe('DialogStackElement', () => {
  test('open/close/setOpen flip props.open', () => {
    const stack = new DialogStackElement({ title: 'Wizard', open: false });
    expect(stack.props.open).toBe(false);

    stack.open();
    expect(stack.props.open).toBe(true);

    stack.close();
    expect(stack.props.open).toBe(false);

    stack.setOpen(true);
    expect(stack.props.open).toBe(true);
  });

  test('setIndex updates props.index', () => {
    const stack = new DialogStackElement({ index: 0 });
    stack.setIndex(2);
    expect(stack.props.index).toBe(2);
  });

  test('handleEvent close sets open false', async () => {
    const stack = new DialogStackElement({ open: true });
    await stack.handleEvent('close');
    expect(stack.props.open).toBe(false);
  });

  test('handleEvent indexChange updates index', async () => {
    const stack = new DialogStackElement({ open: true, index: 0 });
    await stack.handleEvent('indexChange', 2);
    expect(stack.props.index).toBe(2);
  });

  test('factory builds steps and exposes events', () => {
    const stack = dialogStack({ title: 'Onboarding', open: false, index: 0 }, (s) => {
      s.step({ title: 'Account' }, () => {});
      s.step({ title: 'Confirm' }, () => {});
    });
    expect(stack.type).toBe('dialogStack');
    expect(stack.props.title).toBe('Onboarding');
    expect(stack.children).toHaveLength(2);
    expect(stack.children[0]!.type).toBe('dialogStackStep');
    expect(stack.children[0]!.props.title).toBe('Account');
    expect(stack.children[1]!.props.title).toBe('Confirm');
    expect(stack.props.events).toEqual(expect.arrayContaining(['close', 'indexChange']));
  });

  test('factory clamps index to step range', () => {
    const stack = dialogStack({ index: 99 }, (s) => {
      s.step({ title: 'A' }, () => {});
      s.step({ title: 'B' }, () => {});
    });
    expect(stack.props.index).toBe(1);
  });

  test('fn-first overload works', () => {
    const stack = dialogStack(
      (s) => {
        s.step({ title: 'Only' }, () => {});
      },
      { open: true, index: 0 },
    );
    expect(stack.props.open).toBe(true);
    expect(stack.children).toHaveLength(1);
  });

  test('onClose and onIndexChange run', async () => {
    let closed = false;
    let changed: number | undefined;
    const stack = new DialogStackElement({
      open: true,
      index: 0,
      onClose: () => {
        closed = true;
      },
      onIndexChange: (i) => {
        changed = i;
      },
    });
    await stack.handleEvent('indexChange', 1);
    expect(changed).toBe(1);
    expect(stack.props.index).toBe(1);
    await stack.handleEvent('close');
    expect(closed).toBe(true);
    expect(stack.props.open).toBe(false);
  });
});
