import { describe, expect, test, mock } from "bun:test";
import { State } from "./state";

describe("State", () => {
  test("should initialize with default value", () => {
    const state = new State(10);
    expect(state.value).toBe(10);
  });

  test("should update value via setter", () => {
    const state = new State("initial");
    state.value = "updated";
    expect(state.value).toBe("updated");
  });

  test("should update value via set() method", () => {
    const state = new State(true);
    state.set(false);
    expect(state.value).toBe(false);
  });

  test("should notify subscribers when value changes", () => {
    const state = new State(0);
    const listener = mock((newVal: number, oldVal: number) => {});
    
    state.subscribe(listener);
    
    state.value = 1;
    
    expect(listener).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledWith(1, 0);
  });

  test("should not notify subscribers when value is the same", () => {
    const state = new State(5);
    const listener = mock((newVal: number, oldVal: number) => {});
    
    state.subscribe(listener);
    
    state.value = 5;
    
    expect(listener).not.toHaveBeenCalled();
  });

  test("should allow unsubscribing", () => {
    const state = new State(100);
    const listener = mock((newVal: number, oldVal: number) => {});
    
    const unsubscribe = state.subscribe(listener);
    
    state.value = 200;
    expect(listener).toHaveBeenCalledTimes(1);
    
    unsubscribe();
    
    state.value = 300;
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("should handle multiple subscribers", () => {
    const state = new State("test");
    const listenerA = mock(() => {});
    const listenerB = mock(() => {});
    
    state.subscribe(listenerA);
    state.subscribe(listenerB);
    
    state.value = "changed";
    
    expect(listenerA).toHaveBeenCalled();
    expect(listenerB).toHaveBeenCalled();
  });
});
