import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { RalphServer } from "./server";
import { page, Component } from "@ralph/core";

describe("RalphServer", () => {
  let server: RalphServer;
  const port = 3002;

  beforeAll(() => {
    server = new RalphServer({ port });
    server.start();
  });

  afterAll(() => {
    server.stop();
  });

  test("should return 200 OK for root", async () => {
    const response = await fetch(`http://localhost:${port}/`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Ralph Server is running!");
  });

  test("should return 404 for unknown paths", async () => {
    const response = await fetch(`http://localhost:${port}/unknown`);
    expect(response.status).toBe(404);
  });

  test("should handle WebSocket client protocol", async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ralph-ws`);

    const openPromise = new Promise<void>((resolve) => {
      ws.onopen = () => resolve();
    });
    
    // We expect a welcome message upon connection
    const welcomePromise = new Promise<any>((resolve) => {
      ws.addEventListener("message", (event) => {
         const data = JSON.parse(event.data.toString());
         if (data.type === 'welcome') resolve(data);
      });
    });

    await openPromise;
    expect(ws.readyState).toBe(WebSocket.OPEN);
    
    const welcome = await welcomePromise;
    expect(welcome.type).toBe("welcome");
    expect(welcome.id).toBeDefined();

    // Test update/ack protocol
    const ackPromise = new Promise<any>((resolve) => {
        ws.addEventListener("message", (event) => {
            const data = JSON.parse(event.data.toString());
            if (data.type === 'ack') resolve(data);
        });
    });
    
    ws.send(JSON.stringify({
        type: 'update',
        key: 'test-state',
        value: 123,
        id: 'req-1'
    }));

    const ack = await ackPromise;
    expect(ack.type).toBe("ack");
    expect(ack.id).toBe("req-1");

    ws.close();
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
    expect(await response.text()).toBe("<h1>Hello World</h1>");
  });
});
