import { describe, expect, it } from "bun:test";
import { page, pageRegistry } from "./router";
import { Component } from "./component";

describe("Router", () => {
  it("registers a page component class", () => {
    @page("/test-route-class")
    class TestPage extends Component {
      render() {
        return "Test Page";
      }
    }

    expect(pageRegistry.has("/test-route-class")).toBe(true);
    const createPage = pageRegistry.get("/test-route-class");
    expect(createPage).toBeDefined();
    expect(createPage!().render()).toBe("Test Page");
  });

  it("registers a page render function", () => {
    page("/test-route-fn", () => "Function Page");

    expect(pageRegistry.has("/test-route-fn")).toBe(true);
    const createPage = pageRegistry.get("/test-route-fn");
    expect(createPage!().render()).toBe("Function Page");
  });
});
