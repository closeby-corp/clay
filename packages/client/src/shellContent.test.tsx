import { afterEach, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { SiteHeader } from './shell/site-header';
import { MenuItems } from './shell/menu-items';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import { DropdownMenu } from '@/components/ui/dropdown-menu';

const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
afterEach(() => {
  if (previous) Object.defineProperty(globalThis, 'window', previous);
  else Reflect.deleteProperty(globalThis, 'window');
});
function phone(matches: boolean) {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    matchMedia: () => ({ matches, addEventListener() {}, removeEventListener() {} }),
  } });
}
test('phone header shows two actions and an accessible overflow trigger', () => {
  phone(true);
  const html = renderToStaticMarkup(<SiteHeader title="Page" hideTrigger actions={[
    <button key="a">First</button>, <button key="b">Second</button>, <button key="c">Third</button>,
  ]} />);
  expect(html).toContain('First');
  expect(html).toContain('Second');
  expect(html).not.toContain('Third');
  expect(html).toContain('More header actions');
  phone(false);
  expect(renderToStaticMarkup(<SiteHeader title="Page" hideTrigger actions={[<button key="c">Third</button>]} />)).toContain('Third');
});
test('account menu renders Clay menu items, labels and separators', () => {
  // Radix portals do not render during SSR; render the shared items inside its menu root.
  const html = renderToStaticMarkup(<DropdownMenu open><DropdownPrimitive.Content><MenuItems emit={() => {}} items={[
    { id: 'label', type: 'dropdownlabel', props: { text: 'My account' }, children: [] },
    { id: 'profile', type: 'dropdownitem', props: { label: 'Profile', href: '/account', icon: 'user' }, children: [] },
    { id: 'separator', type: 'dropdownseparator', props: {}, children: [] },
    { id: 'logout', type: 'dropdownitem', props: { label: 'Sign out', variant: 'destructive' }, children: [] },
  ]} /></DropdownPrimitive.Content></DropdownMenu>);
  expect(html).toContain('My account');
  expect(html).toContain('Profile');
  expect(html).toContain('Sign out');
  expect(html).toContain('data-variant="destructive"');
  expect(html).toContain('dropdown-menu-separator');
});
