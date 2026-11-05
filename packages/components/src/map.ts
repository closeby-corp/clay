import { Element } from '@close-by/clay-core';

/** Clay theme tone. The client resolves it to a concrete colour from the active palette. */
export type MapTone =
  | 'primary'
  | 'chart-1'
  | 'chart-2'
  | 'chart-3'
  | 'chart-4'
  | 'chart-5'
  | 'destructive'
  | 'muted'
  | 'foreground';

/** A theme tone name, or a literal CSS colour such as `#2563eb` or `rgb(37 99 235)`. */
export type MapToneOrColor = MapTone | string;

/** `[longitude, latitude]`. */
export type LngLat = [number, number];

export type MapBasemap = 'auto' | 'light' | 'dark';
export type MapProjection = 'mercator' | 'globe';
export type MapControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type MapControls = {
  zoom?: boolean;
  compass?: boolean;
  locate?: boolean;
  fullscreen?: boolean;
  position?: MapControlPosition;
};

export type MapPopupMeta = { label: string; value: string };

export type MapMarkerDatum = {
  /** Required and unique within `markers`. Markers move in place when `lngLat` changes. */
  id: string;
  lngLat: LngLat;
  tone?: MapToneOrColor;
  /** Always-visible label. */
  label?: string;
  /** Shown on hover. */
  tooltip?: string;
  /** Shown on click. */
  popup?: { title?: string; description?: string; meta?: MapPopupMeta[] };
  /** Lucide kebab-case icon name rendered inside the pin. */
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Animated ring, e.g. for live vehicles. */
  pulse?: boolean;
  draggable?: boolean;
};

export type MapRouteDatum = {
  /** Required and unique within `routes`. */
  id: string;
  coordinates: LngLat[];
  tone?: MapToneOrColor;
  width?: number;
  opacity?: number;
  dashed?: boolean;
  /** 0..1. Draws a progress overlay and a marker at that point. */
  progress?: number;
  /** Lucide icon for the moving marker, e.g. `truck`. */
  progressIcon?: string;
  /**
   * Draw the built-in marker at `progress` (default true). Set false when you
   * track the vehicle with your own marker (e.g. `upsertMarker` with pulse/tooltip).
   */
  progressMarker?: boolean;
  /** Colour of the travelled part of the route (default `primary`). */
  progressTone?: MapToneOrColor;
  active?: boolean;
  showEndpoints?: boolean;
};

export type MapArcDatum = { id: string; from: LngLat; to: LngLat; label?: string };

export type MapArcGroup = {
  /** Required and unique within `arcs`. */
  id: string;
  tone?: MapToneOrColor;
  width?: number;
  curvature?: number;
  /** Arc ids must be unique within the group. */
  data: MapArcDatum[];
};

export type MapGeoJSONLayer = {
  id: string;
  /** FeatureCollection, Feature, or a URL string. */
  data: unknown;
  fillTone?: MapToneOrColor;
  lineTone?: MapToneOrColor;
  fillOpacity?: number;
  /** Interpolate fill colour by a numeric property. */
  choropleth?: { property: string; stops: [number, MapToneOrColor][] };
  interactive?: boolean;
  promoteId?: string;
};

export type MapClusterPoint = {
  /** Unique within its group. */
  id: string;
  lngLat: LngLat;
  properties?: Record<string, unknown>;
};

export type MapClusterGroup = {
  /** Required and unique within `clusters`. */
  id: string;
  points: MapClusterPoint[];
  tone?: MapToneOrColor;
  clusterRadius?: number;
  clusterMaxZoom?: number;
};

/** Weighted points drawn as a density heatmap. */
export type MapHeatmapLayer = {
  /** Required and unique within `heatmaps`. */
  id: string;
  points: {
    lngLat: LngLat;
    /** Default `1`. Must be finite and `>= 0`. */
    weight?: number;
  }[];
  /** Colour ramp from low to high density. Default `['chart-3', 'chart-4', 'primary', 'destructive']`. */
  ramp?: MapToneOrColor[];
  /** Radius in px at zoom ~9, scaled by zoom. Default `20`. */
  radius?: number;
  /** Default `1`. */
  intensity?: number;
  /** Default `0.85`. */
  opacity?: number;
  /** Weight that maps to full intensity. Default: the largest point weight, or `1`. */
  maxWeight?: number;
  /** Above this zoom the heatmap fades out and the points show as circles. Default: never. */
  showPointsAtZoom?: number;
};

export type MapPopupDatum = { lngLat: LngLat; title?: string; description?: string };

export type MapViewport = { center: LngLat; zoom: number; bearing: number; pitch: number };

export type MapFeatureClickPayload = {
  layerId: string;
  featureId?: string;
  properties: Record<string, unknown>;
};

/** Camera command. A new `nonce` tells the client to run it once. */
export type MapCameraCommand = {
  nonce: number;
  action: 'flyTo' | 'fitBounds' | 'jumpTo';
  center?: LngLat;
  zoom?: number;
  bounds?: [LngLat, LngLat];
  padding?: number;
  duration?: number;
};

export type MapProps = {
  center?: LngLat;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  projection?: MapProjection;
  /** CSS length. Default `'24rem'`, unless `fill` is set. */
  height?: string;
  /** Fill the parent (`flex-1 min-h-0 h-full`), like DataTable `fill`. */
  fill?: boolean;
  /** Default `true`. */
  interactive?: boolean;
  /** Default `'auto'`, which follows the Clay theme. */
  basemap?: MapBasemap;
  /** Custom MapLibre style URLs. */
  styles?: { light?: string; dark?: string };
  /** Subtle palette tint of the basemap. Default `true`. */
  tint?: boolean;
  /** Default `{ zoom: true, position: 'bottom-right' }`. Object values merge over that default. `false` hides all controls. */
  controls?: MapControls | false;
  markers?: MapMarkerDatum[];
  routes?: MapRouteDatum[];
  arcs?: MapArcGroup[];
  geojson?: MapGeoJSONLayer[];
  clusters?: MapClusterGroup[];
  heatmaps?: MapHeatmapLayer[];
  /** Standalone popup. `null` or omitted means closed. */
  popup?: MapPopupDatum | null;

  /** Resolved server-side: receives the current marker datum. */
  onMarkerClick?: (marker: MapMarkerDatum) => void | Promise<void>;
  /** Stored marker `lngLat` is updated before this runs. */
  onMarkerDragEnd?: (marker: MapMarkerDatum, lngLat: LngLat) => void | Promise<void>;
  onRouteClick?: (route: MapRouteDatum) => void | Promise<void>;
  onArcClick?: (arc: MapArcDatum, group: MapArcGroup) => void | Promise<void>;
  onFeatureClick?: (feature: MapFeatureClickPayload) => void | Promise<void>;
  onClusterPointClick?: (point: MapClusterPoint, group: MapClusterGroup) => void | Promise<void>;
  onMapClick?: (lngLat: LngLat) => void | Promise<void>;
  onViewportChange?: (viewport: MapViewport) => void | Promise<void>;
  onLocate?: (lngLat: LngLat) => void | Promise<void>;
};

const DEFAULT_HEIGHT = '24rem';
const DEFAULT_CONTROLS: MapControls = { zoom: true, position: 'bottom-right' };

function isLngLat(value: unknown): value is LngLat {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

function assertLngLat(value: unknown, where: string): asserts value is LngLat {
  if (!isLngLat(value)) {
    throw new Error(`${where}: expected [lng, lat] with finite numbers, got ${JSON.stringify(value)}`);
  }
}

function copyLngLat(p: LngLat): LngLat {
  return [p[0], p[1]];
}

function assertUniqueIds(items: readonly { id: string }[], where: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (typeof item?.id !== 'string' || item.id === '') {
      throw new Error(`${where}: every item needs a non-empty string id`);
    }
    if (seen.has(item.id)) {
      throw new Error(`${where}: duplicate id "${item.id}"`);
    }
    seen.add(item.id);
  }
}

function normalizeMarkers(markers: MapMarkerDatum[]): MapMarkerDatum[] {
  assertUniqueIds(markers, 'map markers');
  return markers.map((m) => {
    assertLngLat(m.lngLat, `map marker "${m.id}" lngLat`);
    return { ...m, lngLat: copyLngLat(m.lngLat) };
  });
}

function normalizeRoutes(routes: MapRouteDatum[]): MapRouteDatum[] {
  assertUniqueIds(routes, 'map routes');
  return routes.map((r) => {
    r.coordinates.forEach((c, i) => assertLngLat(c, `map route "${r.id}" coordinates[${i}]`));
    return { ...r, coordinates: r.coordinates.map(copyLngLat) };
  });
}

function normalizeArcs(groups: MapArcGroup[]): MapArcGroup[] {
  assertUniqueIds(groups, 'map arc groups');
  return groups.map((g) => {
    assertUniqueIds(g.data, `map arcs in group "${g.id}"`);
    return {
      ...g,
      data: g.data.map((a) => {
        assertLngLat(a.from, `map arc "${a.id}" from`);
        assertLngLat(a.to, `map arc "${a.id}" to`);
        return { ...a, from: copyLngLat(a.from), to: copyLngLat(a.to) };
      }),
    };
  });
}

function normalizeClusters(groups: MapClusterGroup[]): MapClusterGroup[] {
  assertUniqueIds(groups, 'map cluster groups');
  return groups.map((g) => {
    assertUniqueIds(g.points, `map cluster points in group "${g.id}"`);
    return {
      ...g,
      points: g.points.map((p) => {
        assertLngLat(p.lngLat, `map cluster point "${p.id}" lngLat`);
        return { ...p, lngLat: copyLngLat(p.lngLat) };
      }),
    };
  });
}

function normalizeHeatmaps(layers: MapHeatmapLayer[]): MapHeatmapLayer[] {
  assertUniqueIds(layers, 'map heatmaps');
  return layers.map((layer) => ({
    ...layer,
    points: layer.points.map((p, i) => {
      assertLngLat(p.lngLat, `map heatmap "${layer.id}" point[${i}] lngLat`);
      if (p.weight !== undefined && (!Number.isFinite(p.weight) || p.weight < 0)) {
        throw new Error(
          `map heatmap "${layer.id}" point[${i}] weight: expected a finite number >= 0, got ${String(p.weight)}`,
        );
      }
      return { ...p, lngLat: copyLngLat(p.lngLat) };
    }),
  }));
}

function normalizeControls(controls: MapControls | false | undefined): MapControls | false {
  if (controls === false) return false;
  return { ...DEFAULT_CONTROLS, ...controls };
}

function normalizePopup(popup: MapPopupDatum | null | undefined): MapPopupDatum | undefined {
  if (!popup) return undefined;
  assertLngLat(popup.lngLat, 'map popup lngLat');
  return { lngLat: copyLngLat(popup.lngLat), title: popup.title, description: popup.description };
}

function toWireProps(props: MapProps): Record<string, unknown> {
  if (props.center !== undefined) assertLngLat(props.center, 'map center');
  return {
    center: props.center && copyLngLat(props.center),
    zoom: props.zoom,
    pitch: props.pitch,
    bearing: props.bearing,
    projection: props.projection,
    height: props.height ?? (props.fill ? undefined : DEFAULT_HEIGHT),
    fill: props.fill ?? false,
    interactive: props.interactive ?? true,
    basemap: props.basemap ?? 'auto',
    styles: props.styles,
    tint: props.tint ?? true,
    controls: normalizeControls(props.controls),
    markers: normalizeMarkers(props.markers ?? []),
    routes: normalizeRoutes(props.routes ?? []),
    arcs: normalizeArcs(props.arcs ?? []),
    geojson: props.geojson ?? [],
    clusters: normalizeClusters(props.clusters ?? []),
    heatmaps: normalizeHeatmaps(props.heatmaps ?? []),
    popup: normalizePopup(props.popup),
    events: [],
  };
}

function boundsOf(points: LngLat[]): [LngLat, LngLat] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of points) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/**
 * Live map (MapLibre, styled to the Clay theme) with markers, routes, arcs,
 * GeoJSON layers, clusters, heatmaps and a popup. Owns its marker / route / popup /
 * camera state: setters push only the prop they change, so the map updates in
 * place.
 *
 * Event handlers are registered only when provided, and they receive resolved
 * data: a `markerClick` with `{ id }` calls `onMarkerClick` with the current
 * marker datum.
 *
 * @example
 * const fleet = ui.map({
 *   center: [-46.63, -23.55],
 *   zoom: 11,
 *   markers: vehicles(),
 *   onMarkerClick: (marker) => ui.notify(`Selected ${marker.id}`),
 * });
 * ui.timer(5, async () => fleet.setMarkers(await loadVehicles()));
 */
export class MapElement extends Element {
  private cameraNonce = 0;

  constructor(props: MapProps = {}) {
    super('map', toWireProps(props));

    const {
      onMarkerClick,
      onMarkerDragEnd,
      onRouteClick,
      onArcClick,
      onFeatureClick,
      onClusterPointClick,
      onMapClick,
      onViewportChange,
      onLocate,
    } = props;

    if (onMarkerClick) {
      this.on('markerClick', async (value) => {
        const marker = this.findById(this.markerList, (value as { id?: unknown } | undefined)?.id);
        if (marker) await onMarkerClick(marker);
      });
    }
    // Always listen for drag ends so server state stays truthful for draggable markers
    // (otherwise a later setMarkers/fitBounds('markers') would use stale positions).
    this.on('markerDragEnd', async (value) => {
      const payload = value as { id?: unknown; lngLat?: unknown } | undefined;
      if (!isLngLat(payload?.lngLat)) return;
      const marker = this.findById(this.markerList, payload?.id);
      if (!marker) return;
      const lngLat = copyLngLat(payload.lngLat);
      const updated = { ...marker, lngLat };
      // Store without queuing a patch: the client already moved the marker.
      this.props.markers = this.markerList.map((m) => (m.id === marker.id ? updated : m));
      if (onMarkerDragEnd) await onMarkerDragEnd(updated, lngLat);
    });
    if (onRouteClick) {
      this.on('routeClick', async (value) => {
        const route = this.findById(this.routeList, (value as { id?: unknown } | undefined)?.id);
        if (route) await onRouteClick(route);
      });
    }
    if (onArcClick) {
      this.on('arcClick', async (value) => {
        const { groupId, id } = (value ?? {}) as { groupId?: unknown; id?: unknown };
        const group = this.findById(this.arcGroups, groupId);
        const arc = group && this.findById(group.data, id);
        if (group && arc) await onArcClick(arc, group);
      });
    }
    if (onFeatureClick) {
      this.on('featureClick', async (value) => {
        await onFeatureClick(value as MapFeatureClickPayload);
      });
    }
    if (onClusterPointClick) {
      this.on('clusterPointClick', async (value) => {
        const { groupId, id } = (value ?? {}) as { groupId?: unknown; id?: unknown };
        const group = this.findById(this.clusterGroups, groupId);
        const point = group && this.findById(group.points, id);
        if (group && point) await onClusterPointClick(point, group);
      });
    }
    if (onMapClick) {
      this.on('mapClick', async (value) => {
        const lngLat = (value as { lngLat?: unknown } | undefined)?.lngLat;
        if (isLngLat(lngLat)) await onMapClick(copyLngLat(lngLat));
      });
    }
    if (onViewportChange) {
      this.on('viewportChange', async (value) => {
        await onViewportChange(value as MapViewport);
      });
    }
    if (onLocate) {
      this.on('locate', async (value) => {
        const lngLat = (value as { lngLat?: unknown } | undefined)?.lngLat;
        if (isLngLat(lngLat)) await onLocate(copyLngLat(lngLat));
      });
    }
  }

  private get markerList(): MapMarkerDatum[] {
    return (this.props.markers as MapMarkerDatum[] | undefined) ?? [];
  }

  private get routeList(): MapRouteDatum[] {
    return (this.props.routes as MapRouteDatum[] | undefined) ?? [];
  }

  private get arcGroups(): MapArcGroup[] {
    return (this.props.arcs as MapArcGroup[] | undefined) ?? [];
  }

  private get clusterGroups(): MapClusterGroup[] {
    return (this.props.clusters as MapClusterGroup[] | undefined) ?? [];
  }

  private findById<T extends { id: string }>(list: T[], id: unknown): T | undefined {
    return typeof id === 'string' ? list.find((item) => item.id === id) : undefined;
  }

  /** Replace all markers. Ids must be unique. */
  setMarkers(markers: MapMarkerDatum[]): this {
    this.update({ markers: normalizeMarkers(markers) });
    return this;
  }

  /** Insert a marker, or replace the one with the same id in place. */
  upsertMarker(marker: MapMarkerDatum): this {
    const clean = normalizeMarkers([marker])[0]!;
    const next = [...this.markerList];
    const index = next.findIndex((m) => m.id === clean.id);
    if (index >= 0) next[index] = clean;
    else next.push(clean);
    return this.setMarkers(next);
  }

  /** Remove a marker by id. No-op if it does not exist. */
  removeMarker(id: string): this {
    const current = this.markerList;
    const next = current.filter((m) => m.id !== id);
    if (next.length === current.length) return this;
    this.update({ markers: next });
    return this;
  }

  /** Replace all routes. Ids must be unique. */
  setRoutes(routes: MapRouteDatum[]): this {
    this.update({ routes: normalizeRoutes(routes) });
    return this;
  }

  /**
   * Merge `patch` into one route, e.g. `updateRoute('truck-1', { progress: 0.5 })`.
   * The id cannot change. No-op if the route does not exist.
   */
  updateRoute(id: string, patch: Partial<Omit<MapRouteDatum, 'id'>>): this {
    const current = this.routeList;
    if (!current.some((r) => r.id === id)) return this;
    return this.setRoutes(current.map((r) => (r.id === id ? { ...r, ...patch, id } : r)));
  }

  /** Replace all arc groups. Group ids are unique, and arc ids are unique within each group. */
  setArcs(groups: MapArcGroup[]): this {
    this.update({ arcs: normalizeArcs(groups) });
    return this;
  }

  /** Replace all GeoJSON layers. */
  setGeoJSON(layers: MapGeoJSONLayer[]): this {
    this.update({ geojson: [...layers] });
    return this;
  }

  /** Replace all cluster groups. Group ids are unique, and point ids are unique within each group. */
  setClusters(groups: MapClusterGroup[]): this {
    this.update({ clusters: normalizeClusters(groups) });
    return this;
  }

  /** Replace all heatmap layers. Layer ids are unique, lngLat values are finite, and weights are finite and `>= 0`. */
  setHeatmaps(layers: MapHeatmapLayer[]): this {
    this.update({ heatmaps: normalizeHeatmaps(layers) });
    return this;
  }

  /** Open a standalone popup at `lngLat`. */
  showPopup(lngLat: LngLat, content: { title?: string; description?: string } = {}): this {
    assertLngLat(lngLat, 'map popup lngLat');
    this.update({ popup: normalizePopup({ lngLat, ...content }) });
    return this;
  }

  /** Close the standalone popup. */
  closePopup(): this {
    this.update({ popup: null });
    return this;
  }

  /** Animate the camera to `center`. */
  flyTo(center: LngLat, zoom?: number, options: { duration?: number } = {}): this {
    assertLngLat(center, 'map flyTo center');
    return this.pushCamera({
      action: 'flyTo',
      center: copyLngLat(center),
      zoom,
      duration: options.duration,
    });
  }

  /**
   * Fit the camera to `bounds` (`[southwest, northeast]`), or to all current
   * markers when `'markers'` is passed. With `'markers'` and no markers, nothing happens.
   */
  fitBounds(bounds: [LngLat, LngLat] | 'markers', options: { padding?: number } = {}): this {
    let target: [LngLat, LngLat];
    if (bounds === 'markers') {
      const markers = this.markerList;
      if (markers.length === 0) return this;
      target = boundsOf(markers.map((m) => m.lngLat));
    } else {
      assertLngLat(bounds[0], 'map fitBounds southwest');
      assertLngLat(bounds[1], 'map fitBounds northeast');
      target = [copyLngLat(bounds[0]), copyLngLat(bounds[1])];
    }
    return this.pushCamera({ action: 'fitBounds', bounds: target, padding: options.padding });
  }

  /** Move the camera to `center` without animation. */
  jumpTo(center: LngLat, zoom?: number): this {
    assertLngLat(center, 'map jumpTo center');
    return this.pushCamera({ action: 'jumpTo', center: copyLngLat(center), zoom });
  }

  /** Switch between `'mercator'` and `'globe'`. */
  setProjection(projection: MapProjection): this {
    this.update({ projection });
    return this;
  }

  private pushCamera(command: Omit<MapCameraCommand, 'nonce'>): this {
    this.cameraNonce += 1;
    this.update({ camera: { nonce: this.cameraNonce, ...command } });
    return this;
  }
}

/**
 * Live map with markers, routes, arcs, GeoJSON layers, clusters, heatmaps and a popup.
 * Prefer `ui.map`. See {@link MapProps}.
 */
export function map(props: MapProps = {}): MapElement {
  return new MapElement(props);
}
