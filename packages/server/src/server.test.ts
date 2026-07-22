import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { BadUIServer } from "./server";
import { page, Component } from "@badui/core";
import { button, label, column } from "@badui/components";

describe("BadUIServer", () => {
  let server: BadUIServer;
  const port = 3002;

  beforeAll(() => {
    server = new BadUIServer({ port });
    server.start();
  });

  afterAll(() => {
    server.stop();
  });

  test("should return 200 OK for root", async () => {
    const response = await fetch(`http://localhost:${port}/`);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("BadUI");
    expect(text).toContain("datastar");
  });

  test("should return 404 for unknown paths", async () => {
    const response = await fetch(`http://localhost:${port}/unknown`);
    expect(response.status).toBe(404);
  });

  test("should return page with pre-rendered content and initial signals", async () => {
    @page("/hello")
    class HelloPage extends Component {
      render() {
        return "<h1>Hello World</h1>";
      }
    }

    const response = await fetch(`http://localhost:${port}/hello`);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("<h1>Hello World</h1>");
    expect(text).toContain("ctxId");
    expect(text).toContain("badui-stream");
    expect(text).toContain('data-signals');
  });

  test("should respond to POST /badui/events with SSE patch", async () => {
    let clickCount = 0;

    @page("/test-events")
    class TestEventsPage extends Component {
      render() {
        const btn = button("Click", {
          on_click: () => { clickCount++; },
        });
        return column(label("Test"), btn).render();
      }
    }

    const pageRes = await fetch(`http://localhost:${port}/test-events`);
    const pageHtml = await pageRes.text();
    const signalsMatch = pageHtml.match(/id="app"[^>]*data-signals='([^']+)'/);
    expect(signalsMatch).toBeTruthy();
    const signals = JSON.parse(signalsMatch![1]!.replace(/&#39;/g, "'"));
    const ctxId = signals.ctxId;

    // compId is now in the initial HTML (not just SSE), since we include
    // pre-rendered content in the GET response
    const compIdMatch = pageHtml.match(/\$compId='([^']+)'/);
    expect(compIdMatch).toBeTruthy();
    const compId = compIdMatch![1];

    const response = await fetch(`http://localhost:${port}/badui/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compId: compId,
        evtType: "click",
        ctxId: ctxId,
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(clickCount).toBe(1);
  });

  test("template should include Datastar script", async () => {
    const response = await fetch(`http://localhost:${port}/`);
    const text = await response.text();
    expect(text).toContain("datastar");
    expect(text).not.toContain("htmx");
  });
});
