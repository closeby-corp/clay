import { describe, expect, test } from 'bun:test';
import type { ClientSession } from '@close-by/clay-core';
import { map, MapElement, type MapHeatmapLayer, type MapMarkerDatum, type MapRouteDatum } from './map';

const MARKERS: MapMarkerDatum[] = [
  { id: 'a', lngLat: [-46.6, -23.5], label: 'A' },
  { id: 'b', lngLat: [-46.7, -23.6] },
];

/** Minimal session that records enqueued patches synchronously. */
function fakeSession() {
  const patches: Array<{ op: string; id?: string; props?: Record<string, unknown> }> = [];
  const session = {
    isMounted: true,
    register: () => {},
    unregister: () => {},
    enqueuePatch: (p: (typeof patches)[number]) => {
      patches.push(p);
    },
  } as unknown as ClientSession;
  return { session, patches };
}

describe('MapElement server state', () => {
  test('defaults', () => {
    const el = map();
    expect(el).toBeInstanceOf(MapElement);
    expect(el.type).toBe('map');
    expect(el.props).toMatchObject({
      height: '24rem',
      basemap: 'auto',
      tint: true,
      interactive: true,
      controls: { zoom: true, position: 'bottom-right' },
      markers: [],
      routes: [],
      arcs: [],
      geojson: [],
      clusters: [],
      heatmaps: [],
      events: ['markerDragEnd'],
    });

    expect(map({ fill: true }).props.height).toBeUndefined();
    expect(map({ fill: true, height: '10rem' }).props.height).toBe('10rem');
    expect(map({ controls: false }).props.controls).toBe(false);
    expect(map({ controls: { compass: true } }).props.controls).toEqual({
      zoom: true,
      position: 'bottom-right',
      compass: true,
    });
  });

  test('events list: markerDragEnd always (keeps dragged positions in sync), others only with a handler', () => {
    expect(map().props.events).toEqual(['markerDragEnd']);
    expect([...(map({ onMarkerClick: () => {} }).props.events as string[])].sort()).toEqual(['markerClick', 'markerDragEnd']);
    expect(
      [...(map({ onMapClick: () => {}, onLocate: () => {}, onViewportChange: () => {} }).props.events as string[])].sort(),
    ).toEqual(['locate', 'mapClick', 'markerDragEnd', 'viewportChange']);
    expect(map({ onMarkerDragEnd: () => {} }).props.events).toEqual(['markerDragEnd']);
  });

  test('drag end without a handler still updates stored marker position', async () => {
    const m = map({ markers: [{ id: 'a', lngLat: [0, 0], draggable: true }] });
    await m.handleEvent('markerDragEnd', { id: 'a', lngLat: [5, 6] });
    expect((m.props.markers as { lngLat: number[] }[])[0]!.lngLat).toEqual([5, 6]);
  });

  test('setMarkers pushes only markers and keeps the element id', () => {
    const el = map({ center: [0, 0] });
    const id = el.id;
    const { session, patches } = fakeSession();
    el.setSession(session);

    el.setMarkers(MARKERS);
    expect(el.id).toBe(id);
    expect(el.props.markers).toEqual(MARKERS);
    expect(patches).toHaveLength(1);
    expect(patches[0]).toMatchObject({ op: 'updateProps', id, props: { markers: MARKERS } });
    expect(patches[0]!.props).not.toHaveProperty('center');
    expect(patches[0]!.props).not.toHaveProperty('routes');
  });

  test('upsertMarker replaces by id or appends; removeMarker drops by id', () => {
    const el = map({ markers: MARKERS });
    el.upsertMarker({ id: 'a', lngLat: [1, 2], label: 'A2' });
    expect(el.props.markers).toEqual([
      { id: 'a', lngLat: [1, 2], label: 'A2' },
      { id: 'b', lngLat: [-46.7, -23.6] },
    ]);
    el.upsertMarker({ id: 'c', lngLat: [3, 4] });
    expect((el.props.markers as MapMarkerDatum[]).map((m) => m.id)).toEqual(['a', 'b', 'c']);

    el.removeMarker('b');
    expect((el.props.markers as MapMarkerDatum[]).map((m) => m.id)).toEqual(['a', 'c']);
    el.removeMarker('missing');
    expect(el.props.markers).toHaveLength(2);
  });

  test('updateRoute merges progress into one route and pushes routes', () => {
    const el = map({
      routes: [
        { id: 'r1', coordinates: [[0, 0], [1, 1]], progress: 0 },
        { id: 'r2', coordinates: [[2, 2], [3, 3]] },
      ],
    });
    const { session, patches } = fakeSession();
    el.setSession(session);

    el.updateRoute('r1', { progress: 0.5, active: true });
    const routes = el.props.routes as MapRouteDatum[];
    expect(routes[0]).toMatchObject({ id: 'r1', progress: 0.5, active: true });
    expect(routes[1]).toEqual({ id: 'r2', coordinates: [[2, 2], [3, 3]] });
    expect(patches).toHaveLength(1);
    expect(patches[0]!.props).toHaveProperty('routes');

    el.updateRoute('nope', { progress: 1 });
    expect(patches).toHaveLength(1);
  });

  test('camera nonce increments and fitBounds(markers) computes bounds', () => {
    const el = map({ markers: MARKERS });
    const { session, patches } = fakeSession();
    el.setSession(session);

    el.flyTo([10, 20], 5, { duration: 800 });
    el.jumpTo([1, 2]);
    el.fitBounds('markers', { padding: 40 });

    const cameras = patches.map((p) => p.props!.camera as { nonce: number; action: string });
    expect(cameras.map((c) => c.nonce)).toEqual([1, 2, 3]);
    expect(cameras.map((c) => c.action)).toEqual(['flyTo', 'jumpTo', 'fitBounds']);
    expect(el.props.camera).toMatchObject({
      nonce: 3,
      action: 'fitBounds',
      bounds: [
        [-46.7, -23.6],
        [-46.6, -23.5],
      ],
      padding: 40,
    });
    expect(patches[0]!.props!.camera).toMatchObject({
      center: [10, 20],
      zoom: 5,
      duration: 800,
    });
  });

  test('fitBounds(markers) is a no-op without markers', () => {
    const el = map();
    const { session, patches } = fakeSession();
    el.setSession(session);
    el.fitBounds('markers');
    expect(patches).toHaveLength(0);
    expect(el.props.camera).toBeUndefined();
  });

  test('showPopup / closePopup / setProjection push only their prop', () => {
    const el = map();
    const { session, patches } = fakeSession();
    el.setSession(session);

    el.showPopup([1, 2], { title: 'Depot' });
    expect(el.props.popup).toMatchObject({ lngLat: [1, 2], title: 'Depot' });
    el.closePopup();
    expect(el.props.popup).toBeNull();
    el.setProjection('globe');
    expect(el.props.projection).toBe('globe');

    // Core update() also echoes `events`; the data key is the one that changed.
    expect(patches.map((p) => Object.keys(p.props!).filter((k) => k !== 'events'))).toEqual([
      ['popup'],
      ['popup'],
      ['projection'],
    ]);
  });

  test('setHeatmaps pushes only heatmaps', () => {
    const el = map({ center: [0, 0] });
    const id = el.id;
    const { session, patches } = fakeSession();
    el.setSession(session);

    const layers: MapHeatmapLayer[] = [
      { id: 'h1', points: [{ lngLat: [1, 2], weight: 3 }, { lngLat: [3, 4] }] },
    ];
    el.setHeatmaps(layers);
    expect(el.id).toBe(id);
    expect(el.props.heatmaps).toEqual(layers);
    expect(patches).toHaveLength(1);
    expect(patches[0]).toMatchObject({ op: 'updateProps', id, props: { heatmaps: layers } });
    expect(Object.keys(patches[0]!.props!).filter((k) => k !== 'events')).toEqual(['heatmaps']);
  });

  test('heatmap duplicate ids throw a clear error', () => {
    const layer: MapHeatmapLayer = { id: 'h', points: [] };
    expect(() => map({ heatmaps: [layer, layer] })).toThrow('duplicate id "h"');
    expect(() => map().setHeatmaps([layer, layer])).toThrow('duplicate id "h"');
  });

  test('heatmap negative or non-finite weight throws, naming the layer and point', () => {
    expect(() =>
      map({ heatmaps: [{ id: 'h', points: [{ lngLat: [0, 0] }, { lngLat: [1, 1], weight: -1 }] }] }),
    ).toThrow('map heatmap "h" point[1] weight');
    expect(() =>
      map({ heatmaps: [{ id: 'h', points: [{ lngLat: [0, 0], weight: Number.NaN }] }] }),
    ).toThrow('map heatmap "h" point[0] weight');
    expect(() => map({ heatmaps: [{ id: 'h', points: [{ lngLat: [0, 0], weight: 0 }] }] })).not.toThrow();
  });

  test('heatmap non-finite lngLat throws', () => {
    expect(() =>
      map({ heatmaps: [{ id: 'h', points: [{ lngLat: [0, 0] }, { lngLat: [Number.POSITIVE_INFINITY, 0] }] }] }),
    ).toThrow('map heatmap "h" point[1] lngLat');
  });

  test('markerClick resolves the current marker datum', async () => {
    const clicked: MapMarkerDatum[] = [];
    const el = map({
      markers: MARKERS,
      onMarkerClick: (m) => {
        clicked.push(m);
      },
    });
    await el.handleEvent('markerClick', { id: 'b' });
    await el.handleEvent('markerClick', { id: 'missing' });
    expect(clicked).toEqual([MARKERS[1]!]);
  });

  test('routeClick and arcClick resolve their datum and group', async () => {
    const seen: unknown[] = [];
    const el = map({
      routes: [{ id: 'r1', coordinates: [[0, 0], [1, 1]] }],
      arcs: [{ id: 'g1', data: [{ id: 'x', from: [0, 0], to: [1, 1] }] }],
      onRouteClick: (r) => {
        seen.push(r.id);
      },
      onArcClick: (arc, group) => {
        seen.push([arc.id, group.id]);
      },
    });
    await el.handleEvent('routeClick', { id: 'r1' });
    await el.handleEvent('arcClick', { groupId: 'g1', id: 'x' });
    expect(seen).toEqual(['r1', ['x', 'g1']]);
  });

  test('markerDragEnd updates the stored lngLat without pushing a patch', async () => {
    const dragged: Array<[string, unknown]> = [];
    const el = map({
      markers: MARKERS,
      onMarkerDragEnd: (m, lngLat) => {
        dragged.push([m.id, lngLat]);
      },
    });
    const { session, patches } = fakeSession();
    el.setSession(session);

    await el.handleEvent('markerDragEnd', { id: 'a', lngLat: [5, 6] });
    expect((el.props.markers as MapMarkerDatum[])[0]!.lngLat).toEqual([5, 6]);
    expect(dragged).toEqual([['a', [5, 6]]]);
    expect(patches).toHaveLength(0);
  });

  test('duplicate ids throw a clear error', () => {
    expect(() => map({ markers: [MARKERS[0]!, MARKERS[0]!] })).toThrow('duplicate id "a"');
    expect(() => map({ routes: [{ id: 'r', coordinates: [] }, { id: 'r', coordinates: [] }] })).toThrow(
      'duplicate id "r"',
    );
    expect(() =>
      map({
        arcs: [
          {
            id: 'g',
            data: [
              { id: 'x', from: [0, 0], to: [1, 1] },
              { id: 'x', from: [0, 0], to: [1, 1] },
            ],
          },
        ],
      }),
    ).toThrow('duplicate id "x"');
    expect(() =>
      map({
        clusters: [
          {
            id: 'c',
            points: [
              { id: 'p', lngLat: [0, 0] },
              { id: 'p', lngLat: [1, 1] },
            ],
          },
        ],
      }),
    ).toThrow('duplicate id "p"');
    expect(() => map().setMarkers([MARKERS[0]!, MARKERS[0]!])).toThrow('duplicate id "a"');
  });

  test('non-finite LngLat throws', () => {
    expect(() => map({ markers: [{ id: 'bad', lngLat: [Number.NaN, 0] }] })).toThrow(
      'map marker "bad" lngLat',
    );
    expect(() => map().flyTo([0, Infinity])).toThrow('map flyTo center');
  });

  test('onMapClick / onLocate receive a plain [lng, lat]', async () => {
    const clicks: unknown[] = [];
    const m = map({ onMapClick: (ll) => { clicks.push(ll); }, onLocate: (ll) => { clicks.push(ll); } });
    await m.handleEvent('mapClick', { lngLat: [1, 2] });
    await m.handleEvent('locate', { lngLat: [3, 4] });
    await m.handleEvent('mapClick', { lngLat: 'bad' });
    expect(clicks).toEqual([[1, 2], [3, 4]]);
  });
});
