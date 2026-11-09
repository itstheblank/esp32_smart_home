import { describe, it, expect, beforeEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Storage Persistence System Verification', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists and restores unlock state correctly', async () => {
    const KEY = 'APP_IS_UNLOCKED';
    expect(await AsyncStorage.getItem(KEY)).toBeNull();

    await AsyncStorage.setItem(KEY, 'true');
    expect(await AsyncStorage.getItem(KEY)).toBe('true');

    await AsyncStorage.setItem(KEY, 'false');
    expect(await AsyncStorage.getItem(KEY)).toBe('false');
  });

  it('persists and restores navigation tab correctly', async () => {
    const KEY = 'APP_CURRENT_TAB';
    await AsyncStorage.setItem(KEY, 'settings');
    expect(await AsyncStorage.getItem(KEY)).toBe('settings');

    await AsyncStorage.setItem(KEY, 'events');
    expect(await AsyncStorage.getItem(KEY)).toBe('events');
  });

  it('persists and restores theme mode (Dark/Light) correctly', async () => {
    const KEY = 'APP_THEME_MODE';
    await AsyncStorage.setItem(KEY, 'DARK');
    expect(await AsyncStorage.getItem(KEY)).toBe('DARK');

    await AsyncStorage.setItem(KEY, 'LIGHT');
    expect(await AsyncStorage.getItem(KEY)).toBe('LIGHT');
  });

  it('persists and restores i18n language code correctly', async () => {
    const KEY = 'APP_LANG_CODE';
    await AsyncStorage.setItem(KEY, 'en');
    expect(await AsyncStorage.getItem(KEY)).toBe('en');

    await AsyncStorage.setItem(KEY, 'vi');
    expect(await AsyncStorage.getItem(KEY)).toBe('vi');
  });

  it('persists and restores MQTT Broker Configuration correctly', async () => {
    const KEY = 'MQTT_BROKER_CONFIG';
    const config = {
      host: '192.168.1.50',
      port: 8083,
      path: '/custom_mqtt',
      clientId: 'Test_Client',
      keepAlive: 60,
      useSsl: false,
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(config));

    const restored = await AsyncStorage.getItem(KEY);
    expect(restored).not.toBeNull();
    const parsed = JSON.parse(restored!);
    expect(parsed.host).toBe('192.168.1.50');
    expect(parsed.port).toBe(8083);
    expect(parsed.path).toBe('/custom_mqtt');
  });

  it('persists notification toggle settings and guide dismissal', async () => {
    const NOTIF_KEY = 'SMARTHOME_NOTIF_CFG_STATE';
    const GUIDE_KEY = 'esp32_guide_dismissed';

    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify({ doorToggle: false, lightToggle: true }));
    await AsyncStorage.setItem(GUIDE_KEY, 'true');

    expect(JSON.parse((await AsyncStorage.getItem(NOTIF_KEY))!)).toEqual({
      doorToggle: false,
      lightToggle: true,
    });
    expect(await AsyncStorage.getItem(GUIDE_KEY)).toBe('true');
  });
});
