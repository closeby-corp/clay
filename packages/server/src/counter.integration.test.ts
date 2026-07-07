import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { BadUIServer } from "./server";
import { page } from "@badui/core";
import { button, label, column, container } from "@badui/components";

describe("counter integration", () => {
  let server: BadUIServer;
  const port = 3003;

  beforeAll(() => {
    page("/examples/counter-itest", ({ state }) => {
      state.defaults({ count: 0 });
      return container(
        column(
          label({ textExpr: "'Count: ' + $count" }),
          button("+", {
            on_click: () => { state.count = state.count + 1; },
          }),
        ),
      );
    });
    server = new BadUIServer({ port });
    server.start();
  });

  afterAll(() => {
    server.stop();
  });

  test("increments count via SSE signal patch", async () => {
    const pageRes = await fetch(`http://localhost:${port}/examples/counter-itest`);
    const html = await pageRes.text();

    const signalsMatch = html.match(/id="app"[^>]*data-signals='([^']+)'/);
    expect(signalsMatch).toBeTruthy();
    const signals = JSON.parse(signalsMatch![1]!.replace(/&#39;/g, "'"));
    expect(signals.count).toBe(0);

    const compIdMatch = html.match(/\$compId='([^']+)'/);
    expect(compIdMatch).toBeTruthy();

    const res = await fetch(`http://localhost:${port}/badui/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compId: compIdMatch![1],
        evtType: "click",
        ctxId: signals.ctxId,
        count: 0,
      }),
    });

    expect(res.status).toBe(200);
    const sse = await res.text();
    expect(sse).toContain("datastar-patch-signals");
    expect(sse).toContain('"count":1');
  });
});
