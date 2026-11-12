import type {
  LngLat,
  MapArcGroup,
  MapClusterGroup,
  MapGeoJSONLayer,
  MapHeatmapLayer,
  MapMarkerDatum,
  MapRouteDatum,
} from '@close-by/clay';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Deterministic PRNG so the generated data is identical on every render. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample (Box-Muller). */
function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* -------------------------------------------------------------------------- */
/* Heatmap: synthetic seismic activity along major fault lines                */
/* -------------------------------------------------------------------------- */

/** Rough polylines along the Pacific Ring of Fire and the Alpide belt. */
const FAULTS: LngLat[][] = [
  [[-75, -45], [-72, -30], [-71, -18], [-77, -8], [-80, 0], [-86, 12], [-98, 17], [-106, 23], [-116, 32], [-123, 40], [-130, 52], [-150, 60], [-170, 52], [178, 51]],
  [[160, 54], [150, 46], [142, 40], [140, 35], [132, 31], [125, 24], [122, 15], [126, 7], [128, 0], [118, -9], [105, -7], [96, 3]],
  [[150, -6], [160, -10], [168, -17], [177, -22], [-176, -30], [178, -38], [172, -43]],
  [[-28, 38], [-10, 37], [12, 40], [22, 38], [30, 39], [44, 38], [52, 32], [60, 30], [70, 34], [80, 30], [90, 28], [98, 25]],
];

export function buildSeismicHeatmap(): MapHeatmapLayer {
  const rand = mulberry32(7);
  const points: MapHeatmapLayer['points'] = [];
  for (const line of FAULTS) {
    for (let i = 1; i < line.length; i++) {
      const [a, b] = [line[i - 1]!, line[i]!];
      let span = b[0] - a[0];
      if (span > 180) span -= 360;
      if (span < -180) span += 360;
      for (let k = 0; k < 60; k++) {
        const t = rand();
        let lng = a[0] + span * t + gaussian(rand) * 1.4;
        if (lng > 180) lng -= 360;
        if (lng < -180) lng += 360;
        const lat = Math.max(-80, Math.min(80, a[1] + (b[1] - a[1]) * t + gaussian(rand) * 1.4));
        // Gutenberg-Richter-ish: many small quakes, few big ones.
        const magnitude = 2.5 + Math.min(6, -Math.log(Math.max(rand(), 1e-6)) * 0.9);
        points.push({ lngLat: [lng, lat], weight: Number(magnitude.toFixed(1)) });
      }
    }
  }
  return { id: 'quakes', points, radius: 16, intensity: 0.9, maxWeight: 6, showPointsAtZoom: 6 };
}

/* -------------------------------------------------------------------------- */
/* 1. Markers & popups: Lisbon points of interest                             */
/* -------------------------------------------------------------------------- */

export const LISBON_POIS: MapMarkerDatum[] = [
  {
    id: 'belem-pasteis',
    lngLat: [-9.2033, 38.6975],
    tone: 'chart-4',
    icon: 'coffee',
    label: 'Belém',
    tooltip: 'Pastéis de Belém',
    popup: {
      title: 'Pastéis de Belém',
      description: 'Custard tarts since 1837, still baked from the original recipe.',
      meta: [
        { label: 'Rating', value: '4.8 ★' },
        { label: 'Hours', value: '08:00 – 20:00' },
      ],
    },
  },
  {
    id: 'torre-belem',
    lngLat: [-9.2159, 38.6916],
    tone: 'chart-2',
    icon: 'landmark',
    tooltip: 'Torre de Belém',
    popup: {
      title: 'Torre de Belém',
      description: 'Fortified tower on the Tagus, a UNESCO World Heritage site.',
      meta: [
        { label: 'Rating', value: '4.7 ★' },
        { label: 'Hours', value: '10:00 – 18:30' },
      ],
    },
  },
  {
    id: 'castelo',
    lngLat: [-9.1334, 38.7139],
    tone: 'destructive',
    icon: 'landmark',
    size: 'lg',
    label: 'Castle',
    tooltip: 'Castelo de São Jorge',
    popup: {
      title: 'Castelo de São Jorge',
      description: 'Hilltop castle with the best view over the old town.',
      meta: [
        { label: 'Rating', value: '4.6 ★' },
        { label: 'Hours', value: '09:00 – 21:00' },
      ],
    },
  },
  {
    id: 'ribeira',
    lngLat: [-9.145, 38.707],
    tone: 'chart-1',
    icon: 'utensils',
    tooltip: 'Time Out Market',
    popup: {
      title: 'Time Out Market',
      description: 'Food hall in the old Ribeira market building.',
      meta: [
        { label: 'Rating', value: '4.5 ★' },
        { label: 'Hours', value: '10:00 – 00:00' },
      ],
    },
  },
  {
    id: 'santa-apolonia',
    lngLat: [-9.1245, 38.7106],
    tone: 'chart-5',
    icon: 'train-front',
    tooltip: 'Estação Santa Apolónia',
    popup: {
      title: 'Santa Apolónia',
      description: 'Main station for regional and international trains.',
      meta: [
        { label: 'Rating', value: '4.1 ★' },
        { label: 'Hours', value: '24 h' },
      ],
    },
  },
  {
    id: 'lx-factory',
    lngLat: [-9.1775, 38.7036],
    tone: 'chart-3',
    icon: 'palette',
    tooltip: 'LX Factory',
    popup: {
      title: 'LX Factory',
      description: 'Former textile factory turned studios, bars and shops.',
      meta: [
        { label: 'Rating', value: '4.4 ★' },
        { label: 'Hours', value: '10:00 – 20:00' },
      ],
    },
  },
  {
    id: 'senhora-monte',
    lngLat: [-9.1309, 38.7196],
    tone: 'primary',
    icon: 'camera',
    tooltip: 'Miradouro da Senhora do Monte',
    popup: {
      title: 'Senhora do Monte',
      description: 'Sunset viewpoint over the rooftops and the river.',
      meta: [
        { label: 'Rating', value: '4.9 ★' },
        { label: 'Hours', value: 'Always open' },
      ],
    },
  },
  {
    id: 'parque-nacoes',
    lngLat: [-9.0945, 38.7637],
    tone: 'muted',
    icon: 'waves',
    tooltip: 'Parque das Nações',
    popup: {
      title: 'Parque das Nações',
      description: 'Waterfront park built for Expo 98.',
      meta: [
        { label: 'Rating', value: '4.6 ★' },
        { label: 'Hours', value: 'Always open' },
      ],
    },
  },
];

/* -------------------------------------------------------------------------- */
/* 2. Routes: Porto to Lisbon, three options                                  */
/* -------------------------------------------------------------------------- */

export type RouteKey = 'fastest' | 'scenic' | 'tolls';

const PORTO: LngLat = [-8.611, 41.149];
const LISBON: LngLat = [-9.1393, 38.7223];

export const ROUTE_OPTIONS: {
  key: RouteKey;
  label: string;
  summary: string;
  tone: string;
  dashed: boolean;
  coordinates: LngLat[];
}[] = [
  {
    key: 'fastest',
    label: 'Fastest',
    summary: '3h 05m · 312 km · 2 tolls',
    tone: 'primary',
    dashed: false,
    coordinates: [
      PORTO,
      [-8.6455, 40.6405], // Aveiro
      [-8.4292, 40.2033], // Coimbra
      [-8.8028, 39.7436], // Leiria
      [-8.685, 39.2369], // Santarém
      LISBON,
    ],
  },
  {
    key: 'scenic',
    label: 'Scenic',
    summary: '4h 40m · 348 km · coastal',
    tone: 'chart-3',
    dashed: true,
    coordinates: [
      PORTO,
      [-8.64, 41.007], // Espinho
      [-8.861, 40.15], // Figueira da Foz
      [-9.07, 39.601], // Nazaré
      [-9.416, 38.9634], // Ericeira
      [-9.3838, 38.798], // Sintra
      LISBON,
    ],
  },
  {
    key: 'tolls',
    label: 'Avoid tolls',
    summary: '3h 52m · 326 km · no tolls',
    tone: 'chart-5',
    dashed: true,
    coordinates: [
      PORTO,
      [-8.5378, 40.9283], // Santa Maria da Feira
      [-8.4151, 39.6016], // Tomar
      [-8.5389, 39.4786], // Torres Novas
      [-8.685, 39.2369], // Santarém
      LISBON,
    ],
  },
];

export function routesFor(active: RouteKey): MapRouteDatum[] {
  return ROUTE_OPTIONS.map((r) => {
    const on = r.key === active;
    return {
      id: r.key,
      coordinates: r.coordinates,
      tone: r.tone,
      dashed: r.dashed,
      active: on,
      width: on ? 5 : 3,
      opacity: on ? 1 : 0.45,
      showEndpoints: true,
      progress: on ? 0.6 : undefined,
      progressIcon: on ? 'truck' : undefined,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* 3. Logistics network: arcs from a Madrid hub                               */
/* -------------------------------------------------------------------------- */

const MADRID: LngLat = [-3.7038, 40.4168];

const DESTINATIONS: { code: string; name: string; at: LngLat; express: boolean }[] = [
  { code: 'PAR', name: 'Paris', at: [2.3522, 48.8566], express: true },
  { code: 'LON', name: 'London', at: [-0.1276, 51.5072], express: true },
  { code: 'LIS', name: 'Lisbon', at: [-9.1393, 38.7223], express: true },
  { code: 'BER', name: 'Berlin', at: [13.405, 52.52], express: true },
  { code: 'ROM', name: 'Rome', at: [12.4964, 41.9028], express: false },
  { code: 'AMS', name: 'Amsterdam', at: [4.9041, 52.3676], express: false },
  { code: 'VIE', name: 'Vienna', at: [16.3738, 48.2082], express: false },
  { code: 'WAW', name: 'Warsaw', at: [21.0122, 52.2297], express: false },
  { code: 'ATH', name: 'Athens', at: [23.7275, 37.9838], express: false },
  { code: 'STO', name: 'Stockholm', at: [18.0686, 59.3293], express: false },
];

export const LANE_GROUPS: MapArcGroup[] = [
  {
    id: 'express',
    tone: 'primary',
    width: 2.5,
    curvature: 0.35,
    data: DESTINATIONS.filter((d) => d.express).map((d) => ({
      id: `MAD-${d.code}`,
      from: MADRID,
      to: d.at,
      label: `MAD → ${d.code} · express`,
    })),
  },
  {
    id: 'standard',
    tone: 'chart-2',
    width: 1.5,
    curvature: 0.25,
    data: DESTINATIONS.filter((d) => !d.express).map((d) => ({
      id: `MAD-${d.code}`,
      from: MADRID,
      to: d.at,
      label: `MAD → ${d.code} · standard`,
    })),
  },
];

export const HUB_MARKERS: MapMarkerDatum[] = [
  {
    id: 'hub-madrid',
    lngLat: MADRID,
    tone: 'foreground',
    icon: 'warehouse',
    size: 'lg',
    label: 'Madrid hub',
    tooltip: 'Madrid distribution hub',
  },
  ...DESTINATIONS.map<MapMarkerDatum>((d) => ({
    id: `dest-${d.code}`,
    lngLat: d.at,
    tone: d.express ? 'primary' : 'chart-2',
    size: 'sm',
    tooltip: d.name,
  })),
];

/* -------------------------------------------------------------------------- */
/* 4. Choropleth: a 12 x 8 grid over Lisbon with a smooth value field         */
/* -------------------------------------------------------------------------- */

const GRID_BOUNDS = { west: -9.26, east: -9.07, south: 38.67, north: 38.8 };
const GRID_COLS = 12;
const GRID_ROWS = 8;

function buildChoroplethGrid(): unknown {
  const dx = (GRID_BOUNDS.east - GRID_BOUNDS.west) / GRID_COLS;
  const dy = (GRID_BOUNDS.north - GRID_BOUNDS.south) / GRID_ROWS;
  const features: unknown[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const x0 = GRID_BOUNDS.west + c * dx;
      const y0 = GRID_BOUNDS.south + r * dy;
      const x1 = x0 + dx;
      const y1 = y0 + dy;
      // Smooth pseudo-random field in 0..100.
      const raw =
        50 +
        32 * Math.sin(c * 0.7 + r * 0.45) * Math.cos(r * 0.9 - c * 0.25) +
        12 * Math.sin((c + r) * 1.3);
      const value = Math.round(Math.min(100, Math.max(0, raw)));
      const id = `cell-${r}-${c}`;
      features.push({
        type: 'Feature',
        id,
        properties: { id, value, name: `Zone ${String.fromCharCode(65 + r)}${c + 1}` },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [x0, y0],
              [x1, y0],
              [x1, y1],
              [x0, y1],
              [x0, y0],
            ],
          ],
        },
      });
    }
  }
  return { type: 'FeatureCollection', features };
}

export const CHOROPLETH_LAYER: MapGeoJSONLayer = {
  id: 'zones',
  data: buildChoroplethGrid(),
  fillOpacity: 0.78,
  lineTone: 'muted',
  interactive: true,
  promoteId: 'id',
  choropleth: {
    property: 'value',
    stops: [
      [0, 'chart-3'],
      [50, 'chart-4'],
      [100, 'destructive'],
    ],
  },
};

/* -------------------------------------------------------------------------- */
/* 5. Clusters: 1,500 generated points around six European cities            */
/* -------------------------------------------------------------------------- */

const CLUSTER_CENTERS: { name: string; at: LngLat; count: number }[] = [
  { name: 'London', at: [-0.1276, 51.5072], count: 350 },
  { name: 'Paris', at: [2.3522, 48.8566], count: 320 },
  { name: 'Berlin', at: [13.405, 52.52], count: 260 },
  { name: 'Madrid', at: [-3.7038, 40.4168], count: 220 },
  { name: 'Rome', at: [12.4964, 41.9028], count: 190 },
  { name: 'Warsaw', at: [21.0122, 52.2297], count: 160 },
];

export function buildClusterGroup(): MapClusterGroup {
  const rand = mulberry32(7);
  const points: MapClusterGroup['points'] = [];
  let n = 0;
  for (const center of CLUSTER_CENTERS) {
    for (let i = 0; i < center.count; i++) {
      n += 1;
      const lng = center.at[0] + gaussian(rand) * 0.9;
      const lat = center.at[1] + gaussian(rand) * 0.6;
      points.push({
        id: `d-${n}`,
        lngLat: [Number(lng.toFixed(4)), Number(lat.toFixed(4))],
        properties: { city: center.name },
      });
    }
  }
  return { id: 'deliveries', points, tone: 'primary', clusterRadius: 52, clusterMaxZoom: 9 };
}

/* -------------------------------------------------------------------------- */
/* 6. Analytics card: world traffic pulses                                    */
/* -------------------------------------------------------------------------- */

const TRAFFIC: { name: string; at: LngLat; hits: number; tone: string }[] = [
  { name: 'New York', at: [-74.006, 40.7128], hits: 92, tone: 'chart-1' },
  { name: 'São Paulo', at: [-46.6333, -23.5505], hits: 74, tone: 'chart-2' },
  { name: 'London', at: [-0.1276, 51.5072], hits: 81, tone: 'chart-3' },
  { name: 'Lagos', at: [3.3792, 6.5244], hits: 38, tone: 'chart-4' },
  { name: 'Dubai', at: [55.2708, 25.2048], hits: 46, tone: 'chart-5' },
  { name: 'Mumbai', at: [72.8777, 19.076], hits: 67, tone: 'chart-1' },
  { name: 'Singapore', at: [103.8198, 1.3521], hits: 58, tone: 'chart-2' },
  { name: 'Tokyo', at: [139.6917, 35.6895], hits: 88, tone: 'chart-3' },
  { name: 'Sydney', at: [151.2093, -33.8688], hits: 29, tone: 'chart-4' },
  { name: 'Mexico City', at: [-99.1332, 19.4326], hits: 41, tone: 'chart-5' },
  { name: 'Paris', at: [2.3522, 48.8566], hits: 54, tone: 'chart-1' },
  { name: 'Toronto', at: [-79.3832, 43.6532], hits: 33, tone: 'chart-2' },
];

export function trafficMarkers(): MapMarkerDatum[] {
  return TRAFFIC.map((city) => ({
    id: `traffic-${city.name}`,
    lngLat: city.at,
    tone: city.tone,
    pulse: true,
    size: city.hits >= 70 ? 'lg' : city.hits >= 40 ? 'md' : 'sm',
    tooltip: `${city.name}: ${city.hits}k req/h`,
  }));
}

