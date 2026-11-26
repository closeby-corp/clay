/**
 * Decides whether a map click belongs to a map object (marker, popup, clickable layer) or to the
 * map itself. Only map-itself clicks emit `mapClick`.
 */

type Identified = { id: string };
type LayerWire = {
  routes?: Identified[];
  arcs?: Identified[];
  geojson?: (Identified & { interactive?: boolean })[];
  clusters?: Identified[];
};

/** DOM ancestors that own their clicks: markers (a click toggles their popup) and popups. */
export const OBJECT_CLICK_SELECTOR = '.maplibregl-marker, .maplibregl-popup';

/**
 * MapLibre layer ids whose clicks are handled by a map object. Ids follow mapcn's naming for the
 * `id` BoundMap passes to each layer component.
 */
export function interactiveLayerIds(p: LayerWire, events: readonly string[]): string[] {
  const ids: string[] = [];
  if (events.includes('routeClick')) for (const r of p.routes ?? []) ids.push(`route-layer-${r.id}`);
  if (events.includes('arcClick')) for (const g of p.arcs ?? []) ids.push(`arc-hit-layer-${g.id}`);
  for (const layer of p.geojson ?? []) if (layer.interactive) ids.push(`geojson-fill-${layer.id}`);
  // Cluster bubbles zoom in on click and points have their own handler, so both always count.
  for (const g of p.clusters ?? []) ids.push(`clusters-${g.id}`, `unclustered-point-${g.id}`);
  return ids;
}

/** True when the click hit a marker / popup element or a rendered feature of an interactive layer. */
export function isObjectClick({
  target,
  hitLayerIds,
}: {
  target: unknown;
  hitLayerIds: readonly string[];
}): boolean {
  const closest = (target as { closest?: (selector: string) => unknown } | null)?.closest;
  if (typeof closest === 'function' && closest.call(target, OBJECT_CLICK_SELECTOR)) return true;
  return hitLayerIds.length > 0;
}
