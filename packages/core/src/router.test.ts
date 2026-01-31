import { describe, expect, it } from "bun:test";
import { page, pageRegistry } from "./router";
import { Component } from "./component";

describe("Router", () => {
  it("registers a page component", () => {
    @page("/test-route")
    class TestPage extends Component {
      render() {
        return "Test Page";
      }
    }

    expect(pageRegistry.has("/test-route")).toBe(true);
    const RegisteredClass = pageRegistry.get("/test-route");
    expect(RegisteredClass).toBe(TestPage);
    
    const instance = new RegisteredClass!();
    expect(instance.render()).toBe("Test Page");
  });
});
