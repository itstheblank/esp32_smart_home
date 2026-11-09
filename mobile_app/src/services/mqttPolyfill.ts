/**
 * Safe Idempotent Polyfill for Paho MQTT in React Native / Vitest
 */

export interface StorageShim {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  readonly length: number;
}

export function installMqttPolyfill(targetGlobal: any = globalThis): boolean {
  let modified = false;

  // 1. Ensure window references global safely
  if (typeof targetGlobal.window === 'undefined') {
    targetGlobal.window = targetGlobal;
    modified = true;
  }

  // 2. Ensure localStorage implements Web Storage API in memory
  let hasLocalStorage = false;
  try {
    hasLocalStorage = Boolean(targetGlobal.window.localStorage);
  } catch {
    hasLocalStorage = false;
  }

  if (!hasLocalStorage) {
    const memoryStore = new Map<string, string>();
    const storageShim: StorageShim = {
      getItem: (key: string) => memoryStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memoryStore.set(key, String(value));
      },
      removeItem: (key: string) => {
        memoryStore.delete(key);
      },
      clear: () => {
        memoryStore.clear();
      },
      get length() {
        return memoryStore.size;
      },
    };
    try {
      targetGlobal.window.localStorage = storageShim;
      modified = true;
    } catch {
      // Browser restricted redefining window.localStorage getter
    }
  }

  return modified;
}
