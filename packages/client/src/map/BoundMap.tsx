import { Fragment, useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import type * as GeoJSON from 'geojson';
import {
  Map,
  useMap,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerTooltip,
  MarkerLabel,
  MapPopup,
  MapRoute,
  RouteProgress,
  RouteMarker,
  MapArc,
  MapGeoJSON,
  MapClusterLayer,
  type MapArcProps,
  type MapGeoJSONProps,
} from '../components/ui/map';
import { cn } from '@/lib/utils';
import { resolveIcon } from '../icons';
import { ClayBasemapTint, resolveTone, useClayMapPalette, type ClayMapPalette } from './map-theme';
import { MapHeatmap, type MapHeatmapLayerWire } from './MapHeatmap';

type Emit = (id: string, type: string, value?: unknown) => void;
type LngLat = [number, number];

// ---------- wire types (see map-contract.md) ----------

type InfoData = { title?: string; description?: string; meta?: { label: string; value: string }[] };

type MarkerDatum = {
  id: string;
  lngLat: LngLat;
  tone?: string;
  label?: string;
  tooltip?: string;
  popup?: InfoData;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  draggable?: boolean;
};

type RouteDatum = {
  id: string;
  coordinates: LngLat[];
  tone?: string;
  width?: number;
  opacity?: number;
  dashed?: boolean;
  progress?: number;
  progressIcon?: string;
  progressMarker?: boolean;
  progressTone?: string;
  active?: boolean;
  showEndpoints?: boolean;
};

type ArcGroup = {
  id: string;
  tone?: string;
  width?: number;
  curvature?: number;
  data: { id: string; from: LngLat; to: LngLat; label?: string }[];
};

type GeoLayer = {
  id: string;
  data: unknown;
  fillTone?: string;
  lineTone?: string;
  fillOpacity?: number;
  choropleth?: { property: string; stops: [number, string][] };
  interactive?: boolean;
  promoteId?: string;
};

type ClusterGroup = {
  id: string;
  points: { id: string; lngLat: LngLat; properties?: Record<string, unknown> }[];
  tone?: string;
  clusterRadius?: number;
  clusterMaxZoom?: number;
};

type CameraCommand = {
  nonce: number;
  action: 'flyTo' | 'fitBounds' | 'jumpTo';
  center?: LngLat;
  zoom?: number;
  bounds?: [LngLat, LngLat];
  padding?: number;
  duration?: number;
};

type MapWireProps = {
  center?: LngLat;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  projection?: 'mercator' | 'globe';
  height?: string;
  fill?: boolean;
  interactive?: boolean;
  basemap?: 'auto' | 'light' | 'dark';
  styles?: { light?: string; dark?: string };
  tint?: boolean;
  controls?: {
    zoom?: boolean;
    compass?: boolean;
    locate?: boolean;
    fullscreen?: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  } | false;
  markers?: MarkerDatum[];
  routes?: RouteDatum[];
  arcs?: ArcGroup[];
  geojson?: GeoLayer[];
  heatmaps?: MapHeatmapLayerWire[];
  clusters?: ClusterGroup[];
  popup?: ({ lngLat: LngLat } & InfoData) | null;
  camera?: CameraCommand | null;
  events?: string[];
};

type FillPaint = NonNullable<Exclude<MapGeoJSONProps['fillPaint'], false | undefined>>;
type LinePaint = NonNullable<Exclude<MapGeoJSONProps['linePaint'], false | undefined>>;
type ArcPaint = NonNullable<MapArcProps['paint']>;

const GLOBE = { type: 'globe' } as const;
const MERCATOR = { type: 'mercator' } as const;
const DEFAULT_CENTER: LngLat = [0, 20];
const MARKER_SIZE = { sm: 10, md: 14, lg: 20 } as const;
const ICON_MARKER_SIZE = 28;
const ROUTE_DASH: [number, number] = [2, 2];

// ---------- small presentational pieces ----------

function MarkerPin({
  color,
  diameter,
  icon,
  pulse,
  ring,
}: {
  color: string;
  diameter: number;
  icon?: string;
  pulse?: boolean;
  ring: string;
}) {
  const Icon = icon ? resolveIcon(icon) : null;
  return (
    <div className="relative flex items-center justify-center" style={{ width: diameter, height: diameter }}>
      {pulse && (
        <span className="absolute inset-0 opacity-40">
          <span className="block size-full animate-ping rounded-full" style={{ background: color }} />
        </span>
      )}
      <span
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: diameter,
          height: diameter,
          background: color,
          boxShadow: `0 0 0 2px ${ring}, 0 1px 4px rgb(0 0 0 / 0.35)`,
        }}
      >
        {Icon && <Icon className="size-3.5 text-white" strokeWidth={2.25} />}
      </span>
    </div>
  );
}

function InfoBody({ title, description, meta }: InfoData) {
  return (
    <div className="min-w-48 space-y-1.5 text-sm">
      {title && <div className="leading-snug font-medium text-foreground">{title}</div>}
      {description && <div className="text-muted-foreground">{description}</div>}
      {meta && meta.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pt-1 text-xs">
          {meta.map((m, i) => (
            <Fragment key={`${i}-${m.label}`}>
              <dt className="text-muted-foreground">{m.label}</dt>
              <dd className="text-right font-medium text-foreground tabular-nums">{m.value}</dd>
            </Fragment>
          ))}
        </dl>
      )}
    </div>
  );
}

// ---------- map-internal helpers (must render inside <Map>) ----------

type ViewportPayload = { center: LngLat; zoom: number; bearing: number; pitch: number };

/** Emits moveend viewport and click events; listeners are rebound only when the map instance changes. */
function MapEvents({
  onViewport,
  onClick,
}: {
  onViewport?: (v: ViewportPayload) => void;
  onClick?: (lngLat: LngLat) => void;
}) {
  const { map } = useMap();
  const handlers = useRef({ onViewport, onClick });
  handlers.current = { onViewport, onClick };

  useEffect(() => {
    if (!map) return;
    const onMoveEnd = () => {
      const c = map.getCenter();
      handlers.current.onViewport?.({
        center: [c.lng, c.lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    };
    const onClick = (e: { lngLat: { lng: number; lat: number } }) => {
      handlers.current.onClick?.([e.lngLat.lng, e.lngLat.lat]);
    };
    map.on('moveend', onMoveEnd);
    map.on('click', onClick);
    return () => {
      map.off('moveend', onMoveEnd);
      map.off('click', onClick);
    };
  }, [map]);

  return null;
}

/** Runs each camera command once, keyed by its nonce. */
function CameraSync({ camera }: { camera?: CameraCommand | null }) {
  const { map, isLoaded } = useMap();
  const lastNonce = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!map || !isLoaded || !camera) return;
    if (lastNonce.current === camera.nonce) return;
    lastNonce.current = camera.nonce;

    if (camera.action === 'fitBounds' && camera.bounds) {
      map.fitBounds(camera.bounds, { padding: camera.padding, duration: camera.duration });
      return;
    }
    const target: { center?: LngLat; zoom?: number } = {};
    if (camera.center) target.center = camera.center;
    if (camera.zoom !== undefined) target.zoom = camera.zoom;
    if (camera.action === 'jumpTo') {
      map.jumpTo(target);
    } else if (target.center) {
      map.flyTo({ ...target, center: target.center, duration: camera.duration });
    } else if (target.zoom !== undefined) {
      map.zoomTo(target.zoom, { duration: camera.duration });
    }
  }, [map, isLoaded, camera]);

  return null;
}

/** Applies `projection` changes to an already-mounted map (setProjection). */
function ProjectionSync({ projection }: { projection?: 'mercator' | 'globe' }) {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded) return;
    try {
      map.setProjection({ type: projection === 'globe' ? 'globe' : 'mercator' });
    } catch {
      // style mid-swap; mapcn re-applies its initial projection on load
    }
  }, [map, isLoaded, projection]);
  return null;
}

// ---------- layer components (own their memoised paint objects) ----------

function ArcLayer({
  group,
  palette,
  interactive,
  onArcClick,
}: {
  group: ArcGroup;
  palette: ClayMapPalette;
  interactive: boolean;
  onArcClick: (groupId: string, id: string | number) => void;
}) {
  const paint = useMemo<ArcPaint>(
    () => ({
      'line-color': resolveTone(group.tone, palette),
      'line-width': group.width ?? 2,
      'line-opacity': 0.85,
    }),
    [group.tone, group.width, palette],
  );
  return (
    <MapArc
      id={group.id}
      data={group.data}
      curvature={group.curvature}
      paint={paint}
      interactive={interactive}
      onClick={(e) => onArcClick(group.id, e.arc.id)}
    />
  );
}

function geoPaints(layer: GeoLayer, palette: ClayMapPalette) {
  const stops = layer.choropleth?.stops ?? [];
  const useChoropleth = !!layer.choropleth && stops.length >= 2;
  const fillColor: unknown = useChoropleth
    ? [
        'interpolate',
        ['linear'],
        ['get', layer.choropleth!.property],
        ...stops.flatMap(([v, t]) => [v, resolveTone(t, palette)]),
      ]
    : resolveTone(layer.fillTone, palette, palette.primary);
  const fill = {
    'fill-color': fillColor,
    'fill-opacity': layer.fillOpacity ?? (useChoropleth ? 0.6 : 0.25),
  } as unknown as FillPaint;
  const line: LinePaint = {
    'line-color': resolveTone(layer.lineTone ?? layer.fillTone, palette),
    'line-width': 1,
  };
  const hover = layer.interactive && layer.promoteId ? ({ 'fill-opacity': 0.8 } as FillPaint) : undefined;
  return { fill, line, hover };
}

function GeoLayerView({
  layer,
  palette,
  onFeatureClick,
}: {
  layer: GeoLayer;
  palette: ClayMapPalette;
  onFeatureClick: (layerId: string, feature: { id?: string | number; properties: unknown }) => void;
}) {
  const paints = useMemo(() => geoPaints(layer, palette), [layer, palette]);
  return (
    <MapGeoJSON
      id={layer.id}
      data={layer.data as MapGeoJSONProps['data']}
      promoteId={layer.promoteId}
      interactive={!!layer.interactive}
      fillPaint={paints.fill}
      linePaint={paints.line}
      fillHoverPaint={paints.hover}
      onClick={(e) => onFeatureClick(layer.id, e.feature)}
    />
  );
}

function ClusterLayerView({
  group,
  palette,
  onPointClick,
}: {
  group: ClusterGroup;
  palette: ClayMapPalette;
  onPointClick: (groupId: string, id: string) => void;
}) {
  const tone = resolveTone(group.tone, palette);
  const colors = useMemo<[string, string, string]>(
    () => [tone, palette.chart[1], palette.chart[2]],
    [tone, palette],
  );
  const data = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, Record<string, unknown>>>(
    () => ({
      type: 'FeatureCollection',
      features: group.points.map((pt) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: pt.lngLat },
        properties: { ...pt.properties, clayId: pt.id },
      })),
    }),
    [group.points],
  );
  return (
    <MapClusterLayer
      data={data}
      clusterRadius={group.clusterRadius}
      clusterMaxZoom={group.clusterMaxZoom}
      clusterColors={colors}
      pointColor={tone}
      onPointClick={(feature) => onPointClick(group.id, String(feature.properties?.clayId ?? ''))}
    />
  );
}

// ---------- component ----------

export default function BoundMap({
  id,
  props,
  className,
  style,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style?: CSSProperties;
  emit: Emit;
}) {
  const p = props as MapWireProps;
  const palette = useClayMapPalette();
  const events = p.events ?? [];
  const on = (name: string) => events.includes(name);
  const fire = (name: string, payload: unknown) => {
    if (on(name)) emit(id, name, payload);
  };

  // Initial camera and interaction options are read once by mapcn's Map; later prop changes
  // do not reset the user's camera. Camera changes arrive only through `camera`.
  const theme = p.basemap === 'light' || p.basemap === 'dark' ? p.basemap : undefined;
  const projection = p.projection === 'globe' ? GLOBE : MERCATOR;
  const ctrl = p.controls === false ? null : (p.controls ?? {});

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl border',
        p.fill && 'h-full min-h-0 flex-1',
        className,
      )}
      style={{ height: p.fill ? undefined : (p.height ?? '24rem'), ...style }}
    >
      <Map
        center={p.center ?? DEFAULT_CENTER}
        zoom={p.zoom ?? 1.5}
        pitch={p.pitch ?? 0}
        bearing={p.bearing ?? 0}
        interactive={p.interactive !== false}
        projection={projection}
        theme={theme}
        styles={p.styles}
      >
        <ClayBasemapTint enabled={p.tint !== false} />
        <MapEvents
          onViewport={on('viewportChange') ? (v) => emit(id, 'viewportChange', v) : undefined}
          onClick={on('mapClick') ? (lngLat) => emit(id, 'mapClick', { lngLat }) : undefined}
        />
        <CameraSync camera={p.camera} />
        <ProjectionSync projection={p.projection} />

        {ctrl !== null && (
          <MapControls
            position={ctrl.position ?? 'bottom-right'}
            showZoom={ctrl.zoom !== false}
            showCompass={!!ctrl.compass}
            showLocate={!!ctrl.locate}
            showFullscreen={!!ctrl.fullscreen}
            onLocate={on('locate') ? (c) => emit(id, 'locate', { lngLat: [c.longitude, c.latitude] }) : undefined}
          />
        )}

        {p.geojson?.map((layer) => (
          <GeoLayerView
            key={layer.id}
            layer={layer}
            palette={palette}
            onFeatureClick={(layerId, feature) =>
              fire('featureClick', { layerId, featureId: feature.id, properties: feature.properties })
            }
          />
        ))}

        {p.heatmaps?.map((h) => (
          <MapHeatmap key={h.id} layer={h} palette={palette} />
        ))}

        {p.arcs?.map((group) => (
          <ArcLayer
            key={group.id}
            group={group}
            palette={palette}
            interactive={on('arcClick')}
            onArcClick={(groupId, arcId) => fire('arcClick', { groupId, id: arcId })}
          />
        ))}

        {p.clusters?.map((group) => (
          <ClusterLayerView
            key={`${group.id}:${group.clusterRadius ?? ''}:${group.clusterMaxZoom ?? ''}`}
            group={group}
            palette={palette}
            onPointClick={(groupId, pointId) => fire('clusterPointClick', { groupId, id: pointId })}
          />
        ))}

        {p.routes?.map((r) => {
          const color = resolveTone(r.tone, palette);
          const clickable = on('routeClick');
          return (
            <MapRoute
              key={r.id}
              id={r.id}
              coordinates={r.coordinates}
              color={color}
              width={r.width}
              opacity={r.opacity}
              dashArray={r.dashed ? ROUTE_DASH : undefined}
              progress={r.progress}
              active={r.active}
              interactive={clickable}
              onClick={clickable ? () => fire('routeClick', { id: r.id }) : undefined}
            >
              {r.progress != null && (
                <RouteProgress color={resolveTone(r.progressTone ?? 'primary', palette)} />
              )}
              {r.progress != null && r.progressMarker !== false && (
                <RouteMarker at="progress">
                  <MarkerContent>
                    <MarkerPin
                      color={color}
                      diameter={24}
                      icon={r.progressIcon ?? 'navigation'}
                      ring={palette.background}
                    />
                  </MarkerContent>
                </RouteMarker>
              )}
              {r.showEndpoints && (
                <RouteMarker at="start">
                  <MarkerContent>
                    <span
                      className="block size-3 rounded-full border-2"
                      style={{ background: palette.background, borderColor: color }}
                    />
                  </MarkerContent>
                </RouteMarker>
              )}
              {r.showEndpoints && (
                <RouteMarker at="end">
                  <MarkerContent>
                    <MarkerPin color={color} diameter={12} ring={palette.background} />
                  </MarkerContent>
                </RouteMarker>
              )}
            </MapRoute>
          );
        })}

        {p.markers?.map((m) => {
          const color = resolveTone(m.tone, palette);
          const diameter = m.icon ? ICON_MARKER_SIZE : MARKER_SIZE[m.size ?? 'md'];
          return (
            <MapMarker
              key={m.id}
              longitude={m.lngLat[0]}
              latitude={m.lngLat[1]}
              draggable={!!m.draggable}
              onClick={() => fire('markerClick', { id: m.id })}
              onDragEnd={(ll) => fire('markerDragEnd', { id: m.id, lngLat: [ll.lng, ll.lat] })}
            >
              <MarkerContent>
                <MarkerPin
                  color={color}
                  diameter={diameter}
                  icon={m.icon}
                  pulse={m.pulse}
                  ring={palette.background}
                />
                {m.label && <MarkerLabel>{m.label}</MarkerLabel>}
              </MarkerContent>
              {m.tooltip && (
                <MarkerTooltip>
                  <div className="rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md">
                    {m.tooltip}
                  </div>
                </MarkerTooltip>
              )}
              {m.popup && (
                <MarkerPopup>
                  <InfoBody {...m.popup} />
                </MarkerPopup>
              )}
            </MapMarker>
          );
        })}

        {p.popup && (
          <MapPopup
            key={`${p.popup.lngLat[0]},${p.popup.lngLat[1]}`}
            longitude={p.popup.lngLat[0]}
            latitude={p.popup.lngLat[1]}
            closeButton
          >
            <InfoBody title={p.popup.title} description={p.popup.description} />
          </MapPopup>
        )}
      </Map>
    </div>
  );
}
