/**
 * Document-wide listener that maps interactions to cues, so no component needs wiring.
 * Classification: `data-sound` override → disabled → toggles → list/menu items →
 * button variant → generic press. Dialog mount/unmount plays open/close; slider
 * value changes tick; OTP digits play `key`.
 */
import { isSoundEnabled, isSoundName, playSound, type SoundName } from './engine';

const PRESSABLE =
  'button, a[href], summary, label[for], [role="button"], [role="tab"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="switch"], [role="checkbox"], [role="radio"], [data-sound], input[type="checkbox"], input[type="radio"]';

const SELECT_ROLES = new Set(['tab', 'menuitem', 'menuitemradio', 'option', 'radio', 'treeitem']);
const TOGGLE_ROLES = new Set(['switch', 'checkbox', 'menuitemcheckbox']);

function isDisabled(el: Element): boolean {
  return (
    (el as HTMLButtonElement).disabled === true ||
    el.getAttribute('aria-disabled') === 'true' ||
    el.hasAttribute('data-disabled')
  );
}

function classify(el: Element): SoundName | null {
  const explicit = el.getAttribute('data-sound');
  if (explicit === 'none') return null;
  if (isSoundName(explicit)) return explicit;
  if (isDisabled(el)) return 'blocked';

  const role = el.getAttribute('role');
  const input = el instanceof HTMLInputElement ? el : null;
  if ((role && TOGGLE_ROLES.has(role)) || input?.type === 'checkbox') {
    const on = input ? input.checked : el.getAttribute('aria-checked') === 'true';
    // Fires before the state flips: currently on → turning off.
    return on ? 'toggleOff' : 'toggleOn';
  }
  if ((role && SELECT_ROLES.has(role)) || input?.type === 'radio') return 'select';

  const variant = el.getAttribute('data-variant');
  if (variant === 'destructive') return 'destructive';
  if (variant === 'ghost' || variant === 'link') return 'soft';
  return 'tap';
}

function selectPitch(el: Element): number {
  const parent = el.parentElement;
  if (!parent) return 1;
  const items = Array.from(parent.children).filter((c) => c.getAttribute('role') === el.getAttribute('role'));
  const i = items.indexOf(el);
  return i < 0 ? 1 : 1 + Math.min(i, 8) * 0.025;
}

function pressTarget(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  // Disabled buttons swallow pointer events in some browsers; closest() still finds them via the wrapper.
  return target.closest(PRESSABLE);
}

function play(el: Element) {
  const name = classify(el);
  if (!name) return;
  playSound(name, name === 'select' ? { pitch: selectPitch(el) } : undefined);
}

const DIALOG = '[role="dialog"], [role="alertdialog"]';

function containsDialog(node: Node): boolean {
  return node instanceof Element && (node.matches(DIALOG) || node.querySelector(DIALOG) != null);
}

let installed = false;

export function installSoundListener(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  document.addEventListener(
    'pointerdown',
    (e) => {
      if (e.button !== 0 || !isSoundEnabled()) return;
      const el = pressTarget(e.target);
      if (el) play(el);
    },
    true,
  );

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.repeat || !isSoundEnabled()) return;
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      if (target.closest('[data-input-otp]') && /^[0-9a-z]$/i.test(e.key)) {
        playSound('key');
        return;
      }
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (target.matches('input:not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]')) return;
      const el = pressTarget(target);
      if (el) play(el);
    },
    true,
  );

  new MutationObserver((records) => {
    if (!isSoundEnabled()) return;
    for (const r of records) {
      if (r.type === 'attributes') {
        if (r.attributeName === 'aria-valuenow' && (r.target as Element).getAttribute('role') === 'slider') {
          playSound('tick');
        }
        continue;
      }
      for (const n of r.addedNodes) if (containsDialog(n)) return playSound('open');
      for (const n of r.removedNodes) if (containsDialog(n)) return playSound('close');
    }
  }).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-valuenow'],
  });
}
