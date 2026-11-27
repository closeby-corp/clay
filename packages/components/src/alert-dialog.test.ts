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
    // Unset labels are left to the client's translated defaults (OK / Cancel).
    expect(dlg.props.confirmLabel).toBeUndefined();
    expect(dlg.props.cancelLabel).toBeUndefined();
    expect(alertDialog({ confirmLabel: 'Yes', cancelLabel: 'No' }).props).toMatchObject({
      confirmLabel: 'Yes',
      cancelLabel: 'No',
    });
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
