import { describe, expect, test } from 'bun:test';
import { combobox, select } from './index';

const factories = [
  ['select', select],
  ['combobox', combobox],
] as const;

describe('select / combobox option media', () => {
  for (const [name, make] of factories) {
    test(`${name}: image URLs (http(s), relative, data:image) are accepted`, () => {
      const ok = ['https://cdn.example.com/logo.png', 'http://x.test/a.png', '/logos/a.svg', 'logos/a.png', '//cdn.x/a.png', 'data:image/svg+xml;utf8,%3Csvg%2F%3E'];
      for (const image of ok) {
        expect(() => make({ options: [{ value: 'a', label: 'A', image }] })).not.toThrow();
      }
    });

    test(`${name}: unsafe or malformed image URLs throw, naming the element and option index`, () => {
      const bad: unknown[] = ['javascript:alert(1)', 'vbscript:x', 'data:text/html,<b>x</b>', '', ' ', 'a b', 42, null];
      for (const image of bad) {
        expect(() =>
          make({ options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B', image: image as string }] }),
        ).toThrow(`${name} options[1] image`);
      }
      expect(() => make({ options: [{ value: 'a', label: 'A', image: 'javascript:alert(1)' }] })).toThrow(
        `${name} options[0] image: expected an http(s), relative or data:image URL, got "javascript:alert(1)"`,
      );
    });

    test(`${name}: icon must be a non-empty string`, () => {
      expect(() => make({ options: [{ value: 'a', label: 'A', icon: 'store' }] })).not.toThrow();
      for (const icon of ['', '  ', 42, null]) {
        expect(() => make({ options: [{ value: 'a', label: 'A', icon: icon as string }] })).toThrow(
          `${name} options[0] icon`,
        );
      }
    });

    test(`${name}: plain options still work and media passes through to the element JSON`, () => {
      expect(make({ options: [{ value: 'a', label: 'A' }] }).props.value).toBe('a');
      const options = [
        { value: 'a', label: 'Acme (84)', image: '/logos/acme.svg' },
        { value: 'b', label: 'Bolt', icon: 'zap' },
        { value: 'c', label: 'Plain' },
      ];
      const json = make({ options, value: 'b' }).toJSON();
      expect(json.type).toBe(name);
      expect(json.props.options).toEqual(options);
      expect(json.props.value).toBe('b');
    });
  }
});
