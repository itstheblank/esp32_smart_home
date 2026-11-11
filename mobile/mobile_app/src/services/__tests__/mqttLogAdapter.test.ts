import { describe, it, expect } from 'vitest';
import { buildCommandPayload, parseLogPayload, mapLogToActions } from '../mqttLogAdapter';

const log = (o: Record<string, unknown>) =>
  parseLogPayload(JSON.stringify({ id: 1, success: true, data: {}, ...o }))!;

describe('MQTT contract v2 adapter (smarthome/cmd + smarthome/logs)', () => {
  it('builds JSON commands exactly as firmware CommandDispatcher expects', () => {
    expect(JSON.parse(buildCommandPayload('LIGHT', 'ON'))).toEqual({
      device: 'LIGHT',
      id: 1,
      action: 'ON',
      data: {},
    });
    expect(JSON.parse(buildCommandPayload('DOOR', 'CLOSE', 1))).toEqual({
      device: 'DOOR',
      id: 1,
      action: 'CLOSE',
      data: {},
    });
  });

  it('rejects off-contract log payloads (fail-closed)', () => {
    expect(parseLogPayload('not json')).toBeNull();
    expect(parseLogPayload('ON')).toBeNull();
    expect(parseLogPayload(JSON.stringify({ device: 'LIGHT', id: 1, action: 'ON' }))).toBeNull();
    expect(
      parseLogPayload(JSON.stringify({ device: 'LIGHT', id: '1', action: 'ON', success: true }))
    ).toBeNull();
  });

  it('maps SYSTEM ONLINE / OFFLINE (LWT) to ESP32 online status', () => {
    expect(mapLogToActions(log({ device: 'SYSTEM', id: 0, action: 'ONLINE' }))).toEqual([
      { type: 'ESP32_ONLINE_CHANGED', online: true },
    ]);
    expect(mapLogToActions(log({ device: 'SYSTEM', id: 0, action: 'OFFLINE' }))).toEqual([
      { type: 'ESP32_ONLINE_CHANGED', online: false },
    ]);
  });

  it('maps light and door logs, translating door CLOSE -> state CLOSED', () => {
    expect(mapLogToActions(log({ device: 'LIGHT', action: 'ON' }))).toContainEqual({
      type: 'LIGHT_STATE_RECEIVED',
      state: 'ON',
    });
    expect(mapLogToActions(log({ device: 'DOOR', action: 'CLOSE' }))).toContainEqual({
      type: 'DOOR_STATE_RECEIVED',
      state: 'CLOSED',
    });
    expect(mapLogToActions(log({ device: 'DOOR', action: 'OPEN' }))).toContainEqual({
      type: 'DOOR_STATE_RECEIVED',
      state: 'OPEN',
    });
  });

  it('rolls back when firmware rejects a command (success=false)', () => {
    expect(mapLogToActions(log({ device: 'LIGHT', action: 'TOGGLE', success: false }))).toContainEqual(
      { type: 'LIGHT_ROLLBACK' }
    );
    expect(mapLogToActions(log({ device: 'DOOR', action: 'CLOSED', success: false }))).toContainEqual(
      { type: 'DOOR_JAM_RESET' }
    );
  });

  it('maps motion and RFID events', () => {
    expect(mapLogToActions(log({ device: 'MOTION_SENSOR', action: 'MOTION_DETECTED' }))).toContainEqual(
      { type: 'MOTION_STATE_RECEIVED', state: 'DETECTED' }
    );
    expect(
      mapLogToActions(
        log({ device: 'RFID_READER', action: 'RFID_TAG_DETECTED', data: { tagId: 'a1b2c3d4', tagLen: 4 } })
      )
    ).toContainEqual({
      type: 'ACCESS_EVENT_RECEIVED',
      event: { uid: 'A1B2C3D4', result: 'GRANTED' },
    });
  });

  it('ignores unknown devices', () => {
    expect(mapLogToActions(log({ device: 'UNKNOWN', id: 0, action: 'INVALID_JSON', success: false }))).toEqual([]);
  });
});
