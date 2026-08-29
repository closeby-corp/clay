/**
 * Full Lucide icon set keyed by kebab-case (and Lucide alias names).
 *
 * Icon names are strings on the wire (`ui.icon('copy')`, `pageMeta.icon`,
 * `button({ icon })`), so the client must resolve any name at runtime —
 * tree-shaking individual icons from app code is impossible. We therefore
 * bundle the whole `lucide-react` surface into the Vite client.
 */
import * as Lucide from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Boxes } from 'lucide-react';

const SKIP = new Set(['icons', 'createLucideIcon', 'default', 'Icon']);

/** PascalCase / PascalCaseIcon → lucide kebab-case (`RefreshCw` → `refresh-cw`). */
export function lucideNameToKebab(name: string): string {
  const base = name.endsWith('Icon') ? name.slice(0, -4) : name;
  return base
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

function isIconExport(value: unknown): value is LucideIcon {
  return typeof value === 'object' || typeof value === 'function';
}

function buildIconMap(): Record<string, LucideIcon> {
  const map: Record<string, LucideIcon> = {};
  for (const [name, value] of Object.entries(Lucide)) {
    if (SKIP.has(name) || !isIconExport(value)) continue;
    if (!/^[A-Z]/.test(name)) continue;
    map[lucideNameToKebab(name)] = value;
  }

  // Clay keys that never matched Lucide’s own kebab (kept for existing apps).
  const clayAliases: Record<string, string> = {
    'chart-radar': 'radar',
    'chart-radial': 'circle-gauge',
  };
  for (const [alias, target] of Object.entries(clayAliases)) {
    const icon = map[target];
    if (icon) map[alias] = icon;
  }

  return map;
}

const iconMap = buildIconMap();

/** Default when name is missing or unknown. */
export const fallbackIcon: LucideIcon = iconMap.boxes ?? Boxes;

/** Resolve a Lucide kebab-case (or Clay alias) name to a component. */
export function resolveIcon(name?: string): LucideIcon {
  if (!name) return fallbackIcon;
  return iconMap[name] ?? fallbackIcon;
}

/** @deprecated Prefer {@link resolveIcon}. */
export const resolveNavIcon = resolveIcon;

/** All registered kebab keys (includes Lucide aliases like `home` → House). */
export function listIconNames(): string[] {
  return Object.keys(iconMap).sort();
}

export function hasIcon(name: string): boolean {
  return name in iconMap;
}
