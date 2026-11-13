import { expect, test } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { SidebarProvider, Sidebar, SidebarRail } from './components/ui/sidebar';

test('sidebar restores width before paint, clamps keyboard resizing, resets and toggles', async () => {
  const window = new Window({ url: 'http://localhost/' });
  window.localStorage.setItem('clay:sidebar-width', '320');
  // happy-dom does not lay out CSS lengths.
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    const width = parseFloat(this.style.width) * (this.style.width.endsWith('rem') ? 16 : 1);
    return { width: width || 0 } as ReturnType<typeof window.HTMLElement.prototype.getBoundingClientRect>;
  };
  const globals = { window, document: window.document, getComputedStyle: window.getComputedStyle.bind(window), requestAnimationFrame: window.requestAnimationFrame.bind(window), cancelAnimationFrame: window.cancelAnimationFrame.bind(window), IS_REACT_ACT_ENVIRONMENT: true };
  const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  const container = window.document.createElement('div');
  const root = createRoot(container as unknown as HTMLElement);
  try {
    await act(async () => root.render(<SidebarProvider resizable sidebarWidth={{ default: '18rem' }}><Sidebar collapsible="icon"><SidebarRail /></Sidebar></SidebarProvider>));
    const rail = container.querySelector('[role=separator]')!;
    const wrapper = container.querySelector('[data-slot=sidebar-wrapper]') as unknown as HTMLElement;
    const handlers = () => (rail as any)[Object.keys(rail).find(key => key.startsWith('__reactProps$'))!];
    const key = async (key: string) => act(async () => handlers().onKeyDown({ key, preventDefault() {}, currentTarget: rail }));
    expect(wrapper.style.getPropertyValue('--sidebar-width')).toBe('320px');
    await key('ArrowRight');
    expect(window.localStorage.getItem('clay:sidebar-width')).toBe('336');
    for (let i = 0; i < 20; i++) await key('ArrowRight');
    expect(rail.getAttribute('aria-valuenow')).toBe('416');
    for (let i = 0; i < 20; i++) await key('ArrowLeft');
    expect(rail.getAttribute('aria-valuenow')).toBe('208');
    await act(async () => handlers().onDoubleClick());
    expect(window.localStorage.getItem('clay:sidebar-width')).toBe('288');
    const pointer = (x: number) => ({ button: 0, pointerId: 1, clientX: x, currentTarget: { closest: rail.closest.bind(rail), setPointerCapture() {} } });
    await act(async () => {
      handlers().onPointerDown(pointer(288));
      handlers().onPointerMove(pointer(390));
    });
    expect(window.document.body.style.userSelect).toBe('none');
    await act(async () => handlers().onPointerUp());
    await act(async () => handlers().onClick());
    expect(window.localStorage.getItem('clay:sidebar-width')).toBe('390');
    expect(window.document.body.style.userSelect).toBe('');
    expect(container.querySelector('[data-slot=sidebar]')!.getAttribute('data-state')).toBe('expanded');
    await key('Enter');
    expect(container.querySelector('[data-slot=sidebar]')!.getAttribute('data-state')).toBe('collapsed');
    await act(async () => handlers().onClick());
    expect(container.querySelector('[data-slot=sidebar]')!.getAttribute('data-state')).toBe('expanded');
  } finally {
    await act(async () => root.unmount());
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
    await window.happyDOM.close();
  }
});
