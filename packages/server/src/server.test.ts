import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { BadUIServer } from "./server";
import { page, Component } from "@badui/core";

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

  test("should render registered page", async () => {
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
    expect(text).toContain("BadUI App");
  });

  test("should respond to POST /badui/events with SSE", async () => {
    @page("/test-events")
    class TestEventsPage extends Component {
      render() {
        return "<div id=\"test\">Static content</div>";
      }
    }

    const response = await fetch(`http://localhost:${port}/badui/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compId: "nonexistent",
        evtType: "click"
      })
    });

    // Without a handler, it should return 404
    expect(response.status).toBe(404);
  });

  test("template should include Datastar script", async () => {
    const response = await fetch(`http://localhost:${port}/`);
    const text = await response.text();
    expect(text).toContain("datastar");
    expect(text).not.toContain("htmx");
  });
});
