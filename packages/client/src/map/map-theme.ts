import { useEffect, useState } from "react";
import { useMap } from "../components/ui/map";

export type ClayMapPalette = {
  primary: string;
  destructive: string;
  chart: [string, string, string, string, string];
  foreground: string;
  mutedForeground: string;
  background: string;
  card: string;
  border: string;
  isDark: boolean;
};

export type Rgba = [number, number, number, number];

// ---------- pure helpers ----------

export function rgbaToCss([r, g, b, a]: Rgba): string {
  const c = (n: number) => Math.round(Math.min(255, Math.max(0, n)));
  const al = Math.min(1, Math.max(0, a));
  return al >= 1
    ? `rgb(${c(r)}, ${c(g)}, ${c(b)})`
    : `rgba(${c(r)}, ${c(g)}, ${c(b)}, ${Math.round(al * 1000) / 1000})`;
}

/** Parse rgb()/rgba()/#hex into a tuple; null when unsupported. */
export function parseColor(input: string): Rgba | null {
  const s = input.trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1]!;
    if (h.length === 3 || h.length === 4) h = [...h].map((x) => x + x).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const parts = m[1]!.split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const nums = parts.map((p) =>
      p.endsWith("%") ? (parseFloat(p) / 100) * 255 : parseFloat(p),
    );
    if (nums.some((x) => Number.isNaN(x))) return null;
    let a = 1;
    if (parts[3] !== undefined) a = parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    return [nums[0]!, nums[1]!, nums[2]!, a];
  }
  return null;
}

/** Linear mix in sRGB: t=0 -> a, t=1 -> b. Returns input `a` if either is unparseable. */
export function mix(colorA: string, colorB: string, t: number): string {
  const a = parseColor(colorA);
  const b = parseColor(colorB);
  if (!a || !b) return colorA;
  return rgbaToCss([
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
    a[3] + (b[3] - a[3]) * t,
  ]);
}

// ---------- CSS colour resolution ----------

let ctx: CanvasRenderingContext2D | null | undefined;

export function resolveCssColor(value: string): string {
  if (typeof document === "undefined") return value;
  const v = value.trim();
  if (!v) return value;
  try {
    if (ctx === undefined) {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      ctx = canvas.getContext("2d", { willReadFrequently: true });
    }
    if (!ctx) return value;
    // Reset to a sentinel so an unparseable value is detectable.
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000000";
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    // Canvas data is premultiplied-free for 1px fill; alpha 0..255.
    return rgbaToCss([r!, g!, b!, a! / 255]);
  } catch {
    return value;
  }
}

// ---------- palette ----------

const FALLBACK = {
  primary: "rgb(37, 99, 235)",
  destructive: "rgb(220, 38, 38)",
  chart: ["rgb(37, 99, 235)", "rgb(22, 163, 74)", "rgb(234, 179, 8)", "rgb(147, 51, 234)", "rgb(249, 115, 22)"] as ClayMapPalette["chart"],
  foreground: "rgb(10, 10, 10)",
  mutedForeground: "rgb(115, 115, 115)",
  background: "rgb(255, 255, 255)",
  card: "rgb(255, 255, 255)",
  border: "rgb(229, 229, 229)",
};

export function readClayMapPalette(): ClayMapPalette {
  if (typeof document === "undefined") return { ...FALLBACK, isDark: false };
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const get = (name: string, fb: string) => {
    const raw = cs.getPropertyValue(name).trim();
    return raw ? resolveCssColor(raw) : fb;
  };
  return {
    primary: get("--primary", FALLBACK.primary),
    destructive: get("--destructive", FALLBACK.destructive),
    chart: [1, 2, 3, 4, 5].map((i) => get(`--chart-${i}`, FALLBACK.chart[i - 1]!)) as ClayMapPalette["chart"],
    foreground: get("--foreground", FALLBACK.foreground),
    mutedForeground: get("--muted-foreground", FALLBACK.mutedForeground),
    background: get("--background", FALLBACK.background),
    card: get("--card", FALLBACK.card),
    border: get("--border", FALLBACK.border),
    isDark: root.classList.contains("dark"),
  };
}

export function useClayMapPalette(): ClayMapPalette {
  const [palette, setPalette] = useState<ClayMapPalette>(readClayMapPalette);

  useEffect(() => {
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      const next = readClayMapPalette();
      setPalette((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
      clearTimeout(timer);
      timer = setTimeout(update, 350); // catch view-transition timing
    };
    const mo = new MutationObserver(schedule);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-palette", "style"],
    });
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    mql?.addEventListener("change", schedule);
    update();
    return () => {
      mo.disconnect();
      mql?.removeEventListener("change", schedule);
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  return palette;
}

export function resolveTone(
  tone: string | undefined,
  palette: ClayMapPalette,
  fallback: string = palette.primary,
): string {
  if (tone === undefined || tone === "") return fallback;
  switch (tone) {
    case "primary":
      return palette.primary;
    case "destructive":
      return palette.destructive;
    case "muted":
      return palette.mutedForeground;
    case "foreground":
      return palette.foreground;
  }
  const m = tone.match(/^chart-([1-5])$/);
  if (m) return palette.chart[Number(m[1]) - 1]!;
  return resolveCssColor(tone);
}

// ---------- basemap tint ----------

type Kind = "background" | "water" | "green";
type Target = { id: string; prop: string; kind: Kind };

function targetsFor(layer: { id: string; type: string }): Target | null {
  const id = layer.id.toLowerCase();
  if (layer.type === "background" || /background/.test(id)) {
    if (layer.type === "background") return { id: layer.id, prop: "background-color", kind: "background" };
    return null;
  }
  if (layer.type !== "fill") return null;
  if (/water/.test(id)) return { id: layer.id, prop: "fill-color", kind: "water" };
  if (/landuse|park|green|wood/.test(id)) return { id: layer.id, prop: "fill-color", kind: "green" };
  return null;
}

export function ClayBasemapTint({ enabled = true }: { enabled?: boolean }): null {
  const { map, isLoaded } = useMap();
  const palette = useClayMapPalette();
  const paletteKey = JSON.stringify(palette);

  useEffect(() => {
    if (!map || !isLoaded) return;
    // layer id + prop -> original colour of the currently loaded style
    const originals = new Map<string, string>();

    const apply = () => {
      try {
        const style = map.getStyle();
        if (!style?.layers) return;
        for (const layer of style.layers) {
          const t = targetsFor(layer);
          if (!t) continue;
          const key = `${t.id}|${t.prop}`;
          try {
            let orig = originals.get(key);
            if (orig === undefined) {
              const cur = map.getPaintProperty(t.id, t.prop as never);
              if (typeof cur !== "string" || !parseColor(cur)) continue; // skip expressions
              orig = cur;
              originals.set(key, orig);
            }
            let next = orig;
            if (enabled) {
              if (t.kind === "background") next = mix(orig, palette.background, 0.55);
              else if (t.kind === "water")
                next = mix(orig, palette.background, 0.25);
              else next = mix(orig, palette.chart[2], 0.15);
            }
            map.setPaintProperty(t.id, t.prop as never, next as never);
          } catch {
            /* style mid-swap */
          }
        }
      } catch {
        /* style not ready */
      }
    };

    const onStyle = () => {
      originals.clear(); // new style: capture fresh originals
      apply();
    };
    map.on("style.load", onStyle);
    apply();
    return () => {
      map.off("style.load", onStyle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded, enabled, paletteKey]);

  return null;
}
