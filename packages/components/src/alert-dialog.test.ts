import { describe, expect, test } from 'bun:test';
import { alertDialog, AlertDialogElement } from './alert-dialog';

describe('AlertDialogElement', () => {
  test('open/close/setOpen flip props.open', () => {
    const dlg = new AlertDialogElement({ title: 'Sure?', open: false });
    expect(dlg.props.open).toBe(false);
    dlg.open();
    expect(dlg.props.open).toBe(true);
    dlg.close();
    expect(dlg.props.open).toBe(false);
  });

  test('factory defaults and events', () => {
    const dlg = alertDialog({
      title: 'Delete?',
      description: 'Gone forever',
      confirmVariant: 'destructive',
      onConfirm: () => {},
      onClose: () => {},
    });
    expect(dlg.type).toBe('alertdialog');
    expect(dlg.props.confirmLabel).toBe('OK');
    expect(dlg.props.cancelLabel).toBe('Cancel');
    expect(dlg.props.events).toEqual(expect.arrayContaining(['confirm', 'close']));
  });

  test('confirm and close handlers run then close', async () => {
    let confirmed = false;
    let closed = false;
    const dlg = new AlertDialogElement({
      open: true,
      onConfirm: () => {
        confirmed = true;
      },
      onClose: () => {
        closed = true;
      },
    });
    await dlg.handleEvent('confirm');
    expect(confirmed).toBe(true);
    expect(dlg.props.open).toBe(false);

    dlg.setOpen(true);
    await dlg.handleEvent('close');
    expect(closed).toBe(true);
    expect(dlg.props.open).toBe(false);
  });
});
