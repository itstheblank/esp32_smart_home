import { describe, it, expect, beforeEach } from 'vitest';
import { installMqttPolyfill } from '../mqttPolyfill';

describe('Paho MQTT Polyfill & Environment Safety', () => {
  let mockEnv: Record<string, any>;

  beforeEach(() => {
    mockEnv = {};
  });

  it('should install window and localStorage when missing', () => {
    expect(mockEnv.window).toBeUndefined();
    const modified = installMqttPolyfill(mockEnv);

    expect(modified).toBe(true);
    expect(mockEnv.window).toBeDefined();
    expect(mockEnv.window.localStorage).toBeDefined();
  });

  it('should provide working Storage API (setItem, getItem, removeItem, clear)', () => {
    installMqttPolyfill(mockEnv);
    const storage = mockEnv.window.localStorage;

    storage.setItem('broker_ip', '192.168.1.100');
    expect(storage.getItem('broker_ip')).toBe('192.168.1.100');
    expect(storage.length).toBe(1);

    storage.removeItem('broker_ip');
    expect(storage.getItem('broker_ip')).toBeNull();
    expect(storage.length).toBe(0);

    storage.setItem('k1', 'v1');
    storage.setItem('k2', 'v2');
    expect(storage.length).toBe(2);

    storage.clear();
    expect(storage.length).toBe(0);
    expect(storage.getItem('k1')).toBeNull();
  });

  it('should be idempotent and preserve existing storage when called repeatedly', () => {
    installMqttPolyfill(mockEnv);
    mockEnv.window.localStorage.setItem('session_token', 'abc-123');

    // Second call should not wipe data
    installMqttPolyfill(mockEnv);
    expect(mockEnv.window.localStorage.getItem('session_token')).toBe('abc-123');
  });
});
