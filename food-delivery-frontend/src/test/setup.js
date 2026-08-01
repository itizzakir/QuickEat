import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * jsdom in this environment exposes `window.localStorage` as a bare object with none of the
 * Storage methods on it (verified: typeof localStorage.clear === "undefined", even with an
 * explicit non-opaque `url`). Rather than depend on that, install a small Map-backed Storage.
 * These tests exercise our session logic, not jsdom's Storage implementation.
 */
function installLocalStorage() {
  if (typeof window.localStorage?.clear === "function") return;

  const store = new Map();
  const storage = {
    getItem: (key) => (store.has(String(key)) ? store.get(String(key)) : null),
    setItem: (key, value) => store.set(String(key), String(value)),
    removeItem: (key) => store.delete(String(key)),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };

  Object.defineProperty(window, "localStorage", {
    value: storage,
    writable: false,
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    writable: false,
    configurable: true,
  });
}

installLocalStorage();

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

// jsdom implements neither of these, and the app touches both on render.
window.scrollTo = vi.fn();

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}
