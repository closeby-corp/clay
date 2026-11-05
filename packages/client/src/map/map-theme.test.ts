import { describe, expect, test } from "bun:test";
import { mix, parseColor, resolveCssColor, resolveTone, rgbaToCss, type ClayMapPalette } from "./map-theme";

const p: ClayMapPalette = {
  primary: "rgb(1, 1, 1)",
  destructive: "rgb(2, 2, 2)",
  chart: ["rgb(11, 0, 0)", "rgb(12, 0, 0)", "rgb(13, 0, 0)", "rgb(14, 0, 0)", "rgb(15, 0, 0)"],
  foreground: "rgb(3, 3, 3)",
  mutedForeground: "rgb(4, 4, 4)",
  background: "rgb(5, 5, 5)",
  card: "rgb(6, 6, 6)",
  border: "rgb(7, 7, 7)",
  isDark: false,
};

describe("colour helpers", () => {
  test("rgbaToCss", () => {
    expect(rgbaToCss([1, 2, 3, 1])).toBe("rgb(1, 2, 3)");
    expect(rgbaToCss([1.4, 2, 300, 0.5])).toBe("rgba(1, 2, 255, 0.5)");
  });
  test("parseColor", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255, 1]);
    expect(parseColor("#ff000080")![3]).toBeCloseTo(0.502, 2);
    expect(parseColor("rgb(10, 20, 30)")).toEqual([10, 20, 30, 1]);
    expect(parseColor("rgba(10,20,30,0.5)")).toEqual([10, 20, 30, 0.5]);
    expect(parseColor("oklch(0.5 0.1 20)")).toBeNull();
  });
  test("mix", () => {
    expect(mix("#000000", "#ffffff", 0)).toBe("rgb(0, 0, 0)");
    expect(mix("#000000", "#ffffff", 1)).toBe("rgb(255, 255, 255)");
    expect(mix("rgb(0,0,0)", "rgb(100,200,50)", 0.5)).toBe("rgb(50, 100, 25)");
    expect(mix("nope", "#fff", 0.5)).toBe("nope");
  });
});

describe("resolveTone", () => {
  test("named tones", () => {
    expect(resolveTone("primary", p)).toBe(p.primary);
    expect(resolveTone("destructive", p)).toBe(p.destructive);
    expect(resolveTone("muted", p)).toBe(p.mutedForeground);
    expect(resolveTone("foreground", p)).toBe(p.foreground);
    for (let i = 1; i <= 5; i++) expect(resolveTone(`chart-${i}`, p)).toBe(p.chart[i - 1]!);
  });
  test("fallback and literal", () => {
    expect(resolveTone(undefined, p)).toBe(p.primary);
    expect(resolveTone(undefined, p, "red")).toBe("red");
    expect(resolveTone("#ff0000", p)).toBe("#ff0000");
  });
  test("resolveCssColor without document", () => {
    expect(resolveCssColor("oklch(0.5 0.1 20)")).toBe("oklch(0.5 0.1 20)");
  });
});
