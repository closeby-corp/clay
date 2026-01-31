import { describe, expect, test } from "bun:test";
import { Component } from "./component";

class TestComponent extends Component<{ title: string }> {
  render(): string {
    return `<div id="${this.id}"><h1>${this.props.title}</h1>${this.renderChildren()}</div>`;
  }
}

describe("Component", () => {
  test("should render with props", () => {
    const comp = new TestComponent({ title: "Hello" });
    const html = comp.render();
    expect(html).toContain("<h1>Hello</h1>");
    expect(html).toContain(`id="${comp.id}"`);
  });

  test("should render children", () => {
    const child = new TestComponent({ title: "Child" });
    const parent = new TestComponent({ title: "Parent" }, [child, "Text Child"]);
    const html = parent.render();
    expect(html).toContain("<h1>Parent</h1>");
    expect(html).toContain("<h1>Child</h1>");
    expect(html).toContain("Text Child");
  });

  test("should have unique IDs by default", () => {
    const c1 = new TestComponent({ title: "1" });
    const c2 = new TestComponent({ title: "2" });
    expect(c1.id).not.toBe(c2.id);
  });

  test("should accept custom ID", () => {
    const comp = new TestComponent({ title: "1", id: "custom-id" } as any);
    expect(comp.id).toBe("custom-id");
  });
});
