import { useEffect, useMemo, useRef } from 'react';
import type * as GeoJSON from 'geojson';
import type * as MapLibreGL from 'maplibre-gl';
import { useMap } from '../components/ui/map';
import { resolveTone, type ClayMapPalette } from './map-theme';

type LngLat = [number, number];

/** Wire shape of one `heatmaps` item (see map-contract.md, "Heatmaps"). */
export type MapHeatmapLayerWire = {
  id: string;
  points: { lngLat: LngLat; weight?: number }[];
  ramp?: string[];
  radius?: number;
  intensity?: number;
  opacity?: number;
  maxWeight?: number;
  showPointsAtZoom?: number;
};

type PointProps = { weight: number };
type PointsFC = GeoJSON.FeatureCollection<GeoJSON.Point, PointProps>;
type Paint = Record<string, unknown>;
type AnyLayer = Parameters<MapLibreGL.Map['addLayer']>[0];

const DEFAULT_RAMP = ['chart-3', 'chart-4', 'primary', 'destructive'];

export function buildPointsCollection(points: MapHeatmapLayerWire['points']): PointsFC {
  const features: GeoJSON.Feature<GeoJSON.Point, PointProps>[] = [];
  for (const p of points) {
    const lng = p.lngLat[0];
    const lat = p.lngLat[1];
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    const w = p.weight;
    const weight = w !== undefined && Number.isFinite(w) && w >= 0 ? w : 1;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: { weight },
    });
  }
  return { type: 'FeatureCollection', features };
}

/** Explicit maxWeight when positive, else the largest point weight, else 1. */
export function resolveMaxWeight(explicit: number | undefined, fc: PointsFC): number {
  if (typeof explicit === 'number' && Number.isFinite(explicit) && explicit > 0) return explicit;
  let max = 0;
  for (const f of fc.features) max = Math.max(max, f.properties.weight);
  return max > 0 ? max : 1;
}

/** Paint objects for the heatmap layer and (optionally) the point circles. */
export function buildHeatPaints(
  opts: {
    ramp?: string[];
    radius?: number;
    intensity?: number;
    opacity?: number;
    showPointsAtZoom?: number;
    maxWeight: number;
  },
  palette: ClayMapPalette,
): { heat: Paint; points?: Paint } {
  const tones = opts.ramp && opts.ramp.length > 0 ? opts.ramp : DEFAULT_RAMP;
  const colors = tones.map((t) => resolveTone(t, palette));
  const n = colors.length;

  // Density 0 is transparent; the ramp colours are spread evenly over (0.15, 1].
  const colorExpr: unknown[] = ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0, 0, 0, 0)'];
  colors.forEach((c, i) => colorExpr.push(0.15 + (0.85 * (i + 1)) / n, c));

  const radius = opts.radius ?? 20;
  const intensity = opts.intensity ?? 1;
  const opacity = opts.opacity ?? 0.85;
  const s = opts.showPointsAtZoom;

  const heat: Paint = {
    'heatmap-color': colorExpr,
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, opts.maxWeight, 1],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, radius * 0.25, 9, radius, 15, radius * 3],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, intensity, 9, intensity * 3],
    'heatmap-opacity': s === undefined ? opacity : ['interpolate', ['linear'], ['zoom'], s - 1, opacity, s, 0],
  };
  if (s === undefined) return { heat };

  return {
    heat,
    points: {
      'circle-color': colors[n - 1],
      'circle-radius': 4,
      'circle-stroke-width': 1,
      'circle-stroke-color': palette.background,
      'circle-opacity': ['interpolate', ['linear'], ['zoom'], s - 1, 0, s, 0.9],
    },
  };
}

function firstSymbolLayerId(map: MapLibreGL.Map): string | undefined {
  try {
    return map.getStyle()?.layers?.find((l) => l.type === 'symbol')?.id;
  } catch {
    return undefined;
  }
}

function removeHeat(map: MapLibreGL.Map, ids: { heat: string; points: string; src: string }) {
  try {
    if (map.getLayer(ids.points)) map.removeLayer(ids.points);
  } catch {
    /* style mid-swap or map torn down */
  }
  try {
    if (map.getLayer(ids.heat)) map.removeLayer(ids.heat);
  } catch {
    /* style mid-swap or map torn down */
  }
  try {
    if (map.getSource(ids.src)) map.removeSource(ids.src);
  } catch {
    /* style mid-swap or map torn down */
  }
}

/** One GeoJSON source + heatmap layer (and optional point circles) for a `heatmaps` item. */
export function MapHeatmap({ layer, palette }: { layer: MapHeatmapLayerWire; palette: ClayMapPalette }) {
  const { map, isLoaded } = useMap();
  const { id, ramp, radius, intensity, opacity } = layer;
  const srcId = `clay-heat-${id}`;
  const heatId = `clay-heat-${id}`;
  const pointsId = `clay-heat-${id}-points`;
  const showPointsAt =
    typeof layer.showPointsAtZoom === 'number' && Number.isFinite(layer.showPointsAtZoom)
      ? layer.showPointsAtZoom
      : undefined;

  // Re-derive the collection only when the points' content changes, not their array identity.
  const pointsJson = useMemo(() => JSON.stringify(layer.points), [layer.points]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fc = useMemo(() => buildPointsCollection(layer.points), [pointsJson]);
  const maxWeight = useMemo(() => resolveMaxWeight(layer.maxWeight, fc), [layer.maxWeight, fc]);

  const rampKey = JSON.stringify(ramp ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const paints = useMemo(
    () => buildHeatPaints({ ramp, radius, intensity, opacity, showPointsAtZoom: showPointsAt, maxWeight }, palette),
    [rampKey, radius, intensity, opacity, showPointsAt, maxWeight, palette],
  );

  // Latest values for the style.load handler, which must not capture stale paint or data.
  const latest = useRef({ srcId, heatId, pointsId, fc, paints, showPointsAt });
  latest.current = { srcId, heatId, pointsId, fc, paints, showPointsAt };

  // Add source + layers once the map is ready; re-add after every style reload (light/dark swap).
  useEffect(() => {
    if (!map || !isLoaded) return;
    const ids = { heat: heatId, points: pointsId, src: srcId };

    const ensure = () => {
      try {
        const cur = latest.current;
        if (!map.getSource(cur.srcId)) {
          map.addSource(cur.srcId, { type: 'geojson', data: cur.fc });
        }
        const before = firstSymbolLayerId(map);
        if (!map.getLayer(cur.heatId)) {
          map.addLayer(
            { id: cur.heatId, type: 'heatmap', source: cur.srcId, paint: cur.paints.heat } as unknown as AnyLayer,
            before,
          );
        }
        if (cur.showPointsAt !== undefined && cur.paints.points && !map.getLayer(cur.pointsId)) {
          map.addLayer(
            {
              id: cur.pointsId,
              type: 'circle',
              source: cur.srcId,
              minzoom: Math.max(0, cur.showPointsAt - 1),
              paint: cur.paints.points,
            } as unknown as AnyLayer,
            before,
          );
        }
      } catch {
        /* style not ready; the next style.load retries */
      }
    };

    ensure();
    map.on('style.load', ensure);
    return () => {
      map.off('style.load', ensure);
      removeHeat(map, ids);
    };
  }, [map, isLoaded, heatId, pointsId, srcId, showPointsAt]);

  // Data changes go through setData; the layers are never re-added for new points.
  useEffect(() => {
    if (!map || !isLoaded) return;
    try {
      const src = map.getSource(srcId) as MapLibreGL.GeoJSONSource | undefined;
      src?.setData(fc);
    } catch {
      /* style mid-swap; style.load re-adds with the latest data */
    }
  }, [map, isLoaded, srcId, fc]);

  // Palette / ramp / radius / intensity / opacity / maxWeight changes update paint in place.
  useEffect(() => {
    if (!map || !isLoaded) return;
    const apply = (layerId: string, props: Paint) => {
      try {
        if (!map.getLayer(layerId)) return;
      } catch {
        return;
      }
      for (const [key, value] of Object.entries(props)) {
        try {
          map.setPaintProperty(layerId, key as never, value as never);
        } catch {
          /* style mid-swap */
        }
      }
    };
    apply(heatId, paints.heat);
    if (paints.points) apply(pointsId, paints.points);
  }, [map, isLoaded, heatId, pointsId, paints]);

  return null;
}
