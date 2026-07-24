import { describe, expect, test } from 'bun:test';
import { DialogElement, dialog } from './dialog';

describe('DialogElement', () => {
  test('open/close/setOpen flip props.open', () => {
    const dlg = new DialogElement({ title: 'Confirm', open: false });
    expect(dlg.props.open).toBe(false);

    dlg.open();
    expect(dlg.props.open).toBe(true);

    dlg.close();
    expect(dlg.props.open).toBe(false);

    dlg.setOpen(true);
    expect(dlg.props.open).toBe(true);
  });

  test('handleEvent close sets open false', async () => {
    const dlg = new DialogElement({ open: true });
    expect(dlg.props.open).toBe(true);
    await dlg.handleEvent('close');
    expect(dlg.props.open).toBe(false);
  });

  test('factory builds children and exposes close event', () => {
    const dlg = dialog({ title: 'Hi', open: false }, (d) => {
      // children attached via withParent in real pages; empty body is fine
      void d;
    });
    expect(dlg.type).toBe('dialog');
    expect(dlg.props.title).toBe('Hi');
    expect(dlg.props.events).toEqual(expect.arrayContaining(['close']));
  });

  test('onClose runs then closes', async () => {
    let closed = false;
    const dlg = new DialogElement({
      open: true,
      onClose: () => {
        closed = true;
      },
    });
    await dlg.handleEvent('close');
    expect(closed).toBe(true);
    expect(dlg.props.open).toBe(false);
  });
});
