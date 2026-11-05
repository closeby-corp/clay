# Maps

`ui.map(props)` is a live map with markers, routes, arcs, GeoJSON layers, clusters, heatmaps and a popup. It renders with [MapLibre GL](https://maplibre.org/) through a vendored copy of [mapcn](https://mapcn.vercel.app) (MIT). You create the map on the server, change it with setters, and handle clicks on the server.

- **Lazy.** The client loads the map code only when a page renders a map (`React.lazy` in the element renderer). Other pages do not download MapLibre.
- **Worker bundled.** The MapLibre worker ships with the client build. No CDN script is loaded.

## Quick start

```typescript
import { ui } from '@close-by/clay';

ui.page('/fleet', () => {
  const fleet = ui.map({
    center: [-9.14, 38.72],
    zoom: 11,
    height: '28rem',
    markers: [
      { id: 'hq', lngLat: [-9.142, 38.7108], label: 'HQ', popup: { title: 'Head office' } },
      { id: 'truck-1', lngLat: [-9.1393, 38.7097], tone: 'chart-2', icon: 'truck', pulse: true },
    ],
    onMarkerClick: (marker) => ui.notify(`Selected ${marker.id}`),
  });

  fleet.fitBounds('markers', { padding: 48 });
});
```

Coordinates are always `[longitude, latitude]`.

## Theming

- **Light and dark.** The basemap follows the page theme. Markers, routes, arcs and fills take their colours from the active palette.
- **Tones.** Colour props accept a tone name or a CSS colour such as `#2563eb`:

  | Tone | Palette token |
  |------|---------------|
  | `primary` | `--primary` (default for markers, routes and fills) |
  | `chart-1` … `chart-5` | `--chart-1` … `--chart-5` |
  | `destructive` | `--destructive` |
  | `muted` | `--muted-foreground` |
  | `foreground` | `--foreground` |

- **Live palette changes.** The map watches the root element's `class`, `data-palette` and `style`, and the system colour scheme. A palette change re-resolves the colours in place. The map is not remounted, so the camera and open popups stay put.
- **`tint`** (default `true`) lightly tints the basemap toward the palette: background, water, and parks or green areas.
- **`basemap`** (default `'auto'`) pins the basemap to `'light'` or `'dark'`, whatever the page theme.
- **`styles`** replaces the basemap style URLs: `{ light?: string; dark?: string }`. See [Tiles](#tiles).

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `center` | `LngLat` | `[0, 20]` | Initial centre, read at mount. See [Camera](#camera) |
| `zoom` | `number` | `1.5` | Initial zoom |
| `pitch` / `bearing` | `number` | `0` | Initial pitch and bearing |
| `projection` | `'mercator' \| 'globe'` | `'mercator'` | |
| `height` | `string` | `'24rem'` | CSS length. Ignored with `fill` |
| `fill` | `boolean` | `false` | Fill the parent. See [Layout](#layout) |
| `interactive` | `boolean` | `true` | `false` disables pan, zoom and click |
| `basemap` | `'auto' \| 'light' \| 'dark'` | `'auto'` | |
| `styles` | `{ light?, dark? }` | CARTO styles | Custom MapLibre style URLs |
| `tint` | `boolean` | `true` | Palette tint on the basemap |
| `controls` | `MapControls \| false` | `{ zoom: true, position: 'bottom-right' }` | Object values merge over the default. `false` hides all controls |
| `markers` | `MapMarkerDatum[]` | `[]` | |
| `routes` | `MapRouteDatum[]` | `[]` | |
| `arcs` | `MapArcGroup[]` | `[]` | |
| `geojson` | `MapGeoJSONLayer[]` | `[]` | |
| `clusters` | `MapClusterGroup[]` | `[]` | |
| `heatmaps` | `MapHeatmapLayer[]` | `[]` | |
| `popup` | `{ lngLat, title?, description? } \| null` | closed | Standalone popup |

`MapControls` is `{ zoom?, compass?, locate?, fullscreen?, position? }`. `compass`, `locate` and `fullscreen` are off by default. `position` is `top-left`, `top-right`, `bottom-left` or `bottom-right`.

## Data layers

**Markers.** `id` (required, unique) and `lngLat` are required. Optional: `tone`, `label` (always visible), `tooltip` (on hover), `popup` (on click: `title`, `description`, `meta: [{ label, value }]`), `icon` (Lucide kebab-case name, drawn in a 28 px pin), `size` (`sm` / `md` / `lg` dots of 10 / 14 / 20 px, used when there is no icon), `pulse` (animated ring), `draggable`.

**Routes.** `id` and `coordinates: [lng, lat][]` are required. Optional: `tone`, `width` (px), `opacity`, `dashed`, `progress` (0..1: draws a progress overlay and a marker there), `progressIcon` (default `navigation`), `progressMarker` (default `true`; set `false` when you track the vehicle with your own marker), `progressTone` (colour of the travelled part, default `primary`), `active` (emphasise the selected route), `showEndpoints` (start ring and end dot). Change one route with `updateRoute` (see [Live data](#live-data--in-place-updates)).

**Arcs.** Grouped. A group has `id`, `tone`, `width`, `curvature` and `data: { id, from, to, label? }[]`. Arc ids are unique within their group.

```typescript
ui.map({
  projection: 'globe',
  arcs: [{ id: 'lanes', tone: 'chart-1', data: [{ id: 'lis-mad', from: [-9.14, 38.72], to: [-3.7, 40.42], label: 'Lisbon to Madrid' }] }],
  onArcClick: (arc, group) => ui.notify(`${arc.label ?? arc.id} (${group.id})`),
});
```

**GeoJSON.** `{ id, data, fillTone?, lineTone?, fillOpacity?, choropleth?, interactive?, promoteId? }`. `data` is a FeatureCollection, a Feature, or a URL string. A choropleth is `{ property, stops: [value, tone][] }`, with at least two stops. Without a choropleth the layer uses `fillTone`. The default fill opacity is `0.6` for a choropleth and `0.25` otherwise. The server does not validate GeoJSON.

**Clusters.** Grouped points: `{ id, points: [{ id, lngLat, properties? }], tone?, clusterRadius?, clusterMaxZoom? }`. Cluster bubbles use the group tone, `chart-2` and `chart-3`.

**Heatmaps.** `{ id, points: [{ lngLat, weight? }], ramp?, radius?, intensity?, opacity?, maxWeight?, showPointsAtZoom? }`. Weights default to `1` and must be finite and at least `0`. `maxWeight` is the weight that reaches full intensity; it defaults to the largest weight. The `ramp` runs from low to high density and defaults to `['chart-3', 'chart-4', 'primary', 'destructive']`, so it follows the palette and light or dark mode. `radius` (default `20` px at zoom 9) scales with zoom. Set `showPointsAtZoom` to fade the heatmap into individual circles when zoomed in. Replace the data with `setHeatmaps(layers)`; the client updates the source in place.

```typescript
const heat = ui.map({ projection: 'globe', heatmaps: [{ id: 'quakes', points, maxWeight: 7, showPointsAtZoom: 6 }] });
heat.setHeatmaps([{ id: 'quakes', points: points.filter((p) => (p.weight ?? 0) >= 5) }]);
```

**Standalone popup.** `showPopup([lng, lat], { title?, description? })` opens one, and `closePopup()` closes it. The `popup` prop does the same declaratively. Only marker popups take `meta` rows.

## Camera

| Method | Behaviour |
|--------|-----------|
| `flyTo(center, zoom?, { duration? })` | Animates. Keeps the current zoom when `zoom` is omitted |
| `fitBounds([sw, ne], { padding? })` | Fits the given bounds |
| `fitBounds('markers', { padding? })` | Fits all current markers. Does nothing when there are none |
| `jumpTo(center, zoom?)` | Moves without animation |
| `setProjection('mercator' \| 'globe')` | Sends a new `projection` |

Each camera call runs once on the client. The server attaches a nonce, so repeating a call moves the map again.

The client reads `center`, `zoom`, `pitch`, `bearing` and `interactive` once, at mount. Changing those props later does not move an existing map. Use the camera methods instead.

## Events

Handlers are registered only when you pass them. Each handler runs on the server, and receives:

| Handler | Fires when | Argument |
|---------|------------|----------|
| `onMarkerClick(marker)` | A marker is clicked | The current marker datum |
| `onMarkerDragEnd(marker, lngLat)` | A draggable marker is dropped | The updated marker and its new `lngLat`. The stored position is updated first |
| `onRouteClick(route)` | A route is clicked | The current route datum |
| `onArcClick(arc, group)` | An arc is clicked | The arc and its group |
| `onFeatureClick(feature)` | A GeoJSON feature is clicked | `{ layerId, featureId?, properties }` |
| `onClusterPointClick(point, group)` | A clustered point is clicked | The point and its group |
| `onMapClick(lngLat)` | The map is clicked | `[lng, lat]` |
| `onViewportChange(viewport)` | The camera stops moving (`moveend`) | `{ center, zoom, bearing, pitch }` |
| `onLocate(lngLat)` | The locate control is used (needs `controls.locate`) | `[lng, lat]` |


`markerDragEnd` is always recorded on the server, even without `onMarkerDragEnd`, so a later `fitBounds('markers')` uses the dropped position.

## Live data & in-place updates

The map owns its marker, route, arc, cluster and popup state. Each setter sends only the prop it changes, so the client patches the map instead of rebuilding it. Markers are keyed by `id`: when a marker's `lngLat` changes, it moves, and its DOM node stays.

| Method | What it does |
|--------|--------------|
| `setMarkers(list)` | Replaces all markers |
| `upsertMarker(marker)` | Inserts, or replaces the marker with the same id |
| `removeMarker(id)` | Removes a marker. No-op if absent |
| `setRoutes(list)` / `updateRoute(id, patch)` | Replaces all routes, or merges `patch` into one. The id cannot change |
| `setArcs(groups)` / `setGeoJSON(layers)` / `setClusters(groups)` / `setHeatmaps(layers)` | Replace that layer type |

A courier moving along a route:

```typescript
ui.timer(0.25, () => {
  progress = Math.min(1, progress + 0.006);
  map.updateRoute('delivery-route', { progress });
  map.upsertMarker({ id: 'courier', lngLat: pointAt(progress), tone: 'chart-2', icon: 'truck' });
});
```

**Validation** runs when you create the map or call a setter, before anything is sent. It throws on:

- a missing or empty id, or a duplicate id within its list (markers, routes, arc groups, arcs in a group, cluster groups, points in a group). The message is `duplicate id "…"`.
- a coordinate that is not `[lng, lat]` with two finite numbers. This covers markers, cluster points, route coordinates, arc endpoints, popups, `flyTo` and `jumpTo` centres, and `fitBounds` corners.

## Layout

`height` gives a fixed-size map in normal flow:

```typescript
ui.card({ title: 'Stores', className: 'p-0 overflow-hidden' }, () => {
  ui.map({ height: '26rem', center: [-6, 40], zoom: 5 });
});
```

`fill: true` makes the map fill its parent (`h-full min-h-0 flex-1`), so the parent needs a definite height. On a page that fills the window, put `fillViewport` on the outer column and `grow` on the panel that holds the map:

```typescript
ui.column({ fillViewport: true, gap: 4 }, () => {
  ui.row({ grow: true, wrap: false, gap: 4 }, () => {
    ui.card({ title: 'Stores', scroll: true, className: 'w-80 shrink-0' }, () => { /* list */ });
    ui.column({ grow: true }, () => {
      ui.map({ fill: true, center: [-6, 40], zoom: 5 });
    });
  });
});
```

See [API reference: Filling the page](./api.md#filling-the-page).

## Tiles

By default the basemap uses CARTO's hosted styles: Positron for light and Dark Matter for dark, served from `basemaps.cartocdn.com`. Those styles are built on OpenStreetMap data. CARTO's free tier and terms apply, and OpenStreetMap data requires attribution.

Before production, check CARTO's current terms and attribution rules, or pass your own styles. Any MapLibre style URL works:

```typescript
ui.map({ styles: { light: 'https://your-host.example/light.json', dark: 'https://your-host.example/dark.json' } });
```

[OpenFreeMap](https://openfreemap.org) publishes free style URLs. Check its terms before you rely on it.

## Demos

All five are under the **Maps** group in the sidebar.

- [`/examples/maps`](../apps/demo/src/examples/MapsGallery.ts): markers and popups, routes, arcs, a choropleth, clusters, a seismic heatmap on a globe, and a compact analytics map.
- [`/examples/delivery-tracker`](../apps/demo/src/examples/DeliveryTracker.ts): a courier moving along a route, with `updateRoute` and `upsertMarker` on a timer.
- [`/examples/store-locator`](../apps/demo/src/examples/StoreLocator.ts): a filterable store list where list rows and markers select each other.
- [`/examples/globe`](../apps/demo/src/examples/CommunityGlobe.ts): a globe with arcs and markers that refresh every 30 seconds.
- [`/examples/uptime`](../apps/demo/src/examples/UptimeMonitor.ts): a status globe of edge locations, refreshed every 2 seconds.

## See also

- [Updating in place](./updating-in-place.md): the general rules for patching instead of rebuilding
- [API reference](./api.md#uimapprops): `ui.map` in the Layout section
- [Examples](./examples.md): the demo catalog
