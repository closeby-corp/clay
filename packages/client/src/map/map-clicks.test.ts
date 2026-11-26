import { describe, expect, test } from 'bun:test';
import { interactiveLayerIds, isObjectClick, OBJECT_CLICK_SELECTOR } from './map-clicks';

/** Fake DOM target: `closest` matches when the element sits inside one of `inside` classes. */
function target(...inside: string[]) {
  return {
    closest(selector: string) {
      const hit = selector.split(',').map((s) => s.trim().replace(/^\./, '')).some((c) => inside.includes(c));
      return hit ? {} : null;
    },
  };
}

const wire = {
  routes: [{ id: 'r1' }],
  arcs: [{ id: 'lanes' }],
  geojson: [{ id: 'zones', interactive: true }, { id: 'outline' }],
  clusters: [{ id: 'shops' }],
};

describe('interactiveLayerIds', () => {
  test('routes and arcs count only with their click handler; GeoJSON only when interactive; clusters always', () => {
    expect(interactiveLayerIds(wire, [])).toEqual([
      'geojson-fill-zones',
      'clusters-shops',
      'unclustered-point-shops',
    ]);
    expect(interactiveLayerIds(wire, ['routeClick', 'arcClick', 'mapClick'])).toEqual([
      'route-layer-r1',
      'arc-hit-layer-lanes',
      'geojson-fill-zones',
      'clusters-shops',
      'unclustered-point-shops',
    ]);
  });

  test('empty wire props give no ids', () => {
    expect(interactiveLayerIds({}, ['routeClick', 'arcClick'])).toEqual([]);
  });
});

describe('isObjectClick', () => {
  test('clicks inside a marker or popup element are object clicks', () => {
    expect(OBJECT_CLICK_SELECTOR).toContain('.maplibregl-marker');
    expect(isObjectClick({ target: target('maplibregl-marker'), hitLayerIds: [] })).toBe(true);
    expect(isObjectClick({ target: target('maplibregl-popup'), hitLayerIds: [] })).toBe(true);
  });

  test('a hit on an interactive layer is an object click', () => {
    expect(isObjectClick({ target: target('maplibregl-canvas'), hitLayerIds: ['route-layer-r1'] })).toBe(true);
  });

  test('empty map (canvas, no hits) is a map click', () => {
    expect(isObjectClick({ target: target('maplibregl-canvas'), hitLayerIds: [] })).toBe(false);
  });

  test('targets without closest (null, text-like) fall back to the layer hit test', () => {
    expect(isObjectClick({ target: null, hitLayerIds: [] })).toBe(false);
    expect(isObjectClick({ target: {}, hitLayerIds: [] })).toBe(false);
    expect(isObjectClick({ target: undefined, hitLayerIds: ['clusters-shops'] })).toBe(true);
  });
});
