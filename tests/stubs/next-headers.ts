/** In-memory stand-in for next/headers cookies() in tests. */
const store = new Map<string, string>();

export async function cookies() {
  return {
    get(name: string) {
      const value = store.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set(name: string, value: string) {
      store.set(name, value);
    },
    delete(name: string) {
      store.delete(name);
    },
  };
}

export function __clearCookies() {
  store.clear();
}

export async function headers() {
  return new Map();
}
