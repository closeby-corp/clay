import { describe, expect, test } from "bun:test";
import { htmx, htmxString } from "./attributes";

describe("HTMX Attribute Generator", () => {
  test("generates basic attributes", () => {
    const result = htmx({
      get: "/api/data",
      target: "#result",
      swap: "innerHTML",
    });

    expect(result).toEqual({
      "hx-get": "/api/data",
      "hx-target": "#result",
      "hx-swap": "innerHTML",
    });
  });

  test("handles boolean attributes", () => {
    const result = htmx({
      get: "/api/data",
      disable: true,
    });

    expect(result["hx-disable"]).toBe("");
    expect(result["hx-get"]).toBe("/api/data");
  });

  test("serializes object attributes (vals, headers)", () => {
    const result = htmx({
      post: "/api/save",
      vals: { id: 123, active: true },
      headers: { "X-Custom": "value" },
    });

    expect(result["hx-vals"]).toBe('{"id":123,"active":true}');
    expect(result["hx-headers"]).toBe('{"X-Custom":"value"}');
  });

  test("generates string output", () => {
    const result = htmxString({
      click: "true", // Should be ignored by specific handlers but caught by generic
      get: "/api/test",
      target: "#output"
    });
    
    // Note: order isn't guaranteed in object iteration, but usually consistent
    expect(result).toContain("hx-get='/api/test'");
    expect(result).toContain("hx-target='#output'");
  });
  
  test("passes through arbitrary hx- attributes", () => {
      const result = htmx({
          "hx-custom-attr": "some-value",
          get: "/foo"
      });
      
      expect(result["hx-custom-attr"]).toBe("some-value");
      expect(result["hx-get"]).toBe("/foo");
  });
});
