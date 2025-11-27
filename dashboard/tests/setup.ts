import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Minimal localStorage shim for node test environment (msw cookie store)
const memoryStorage = (() => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } satisfies Storage;
})();

try {
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage,
    writable: false,
  });
} catch {
  (globalThis as { localStorage: Storage }).localStorage = memoryStorage;
}

const { setupServer } = await import('msw/node');
export const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
