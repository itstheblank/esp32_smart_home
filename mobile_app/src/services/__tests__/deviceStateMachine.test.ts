import { describe, it, expect } from 'vitest';
import { deviceStateReducer, INITIAL_DEVICE_STATE, DeviceStateModel } from '../deviceStateMachine';

describe('Device State Machine & Dual-Layer Guard Reducer', () => {
  it('should guard commands when Broker or ESP32 is offline', () => {
    // Both offline
    let state = INITIAL_DEVICE_STATE;
    expect(state.canSendCommands).toBe(false);

    // Try sending command
    state = deviceStateReducer(state, { type: 'LIGHT_CMD_SENT', targetState: 'ON' });
    expect(state.lightFsm).toBe('OFF'); // Command blocked!

    // Broker connects, but ESP32 is still offline
    state = deviceStateReducer(state, { type: 'BROKER_STATUS_CHANGED', connected: true });
    expect(state.canSendCommands).toBe(false);

    state = deviceStateReducer(state, { type: 'LIGHT_CMD_SENT', targetState: 'ON' });
    expect(state.lightFsm).toBe('OFF'); // Still blocked!

    // Now ESP32 connects
    state = deviceStateReducer(state, { type: 'ESP32_ONLINE_CHANGED', online: true });
    expect(state.canSendCommands).toBe(true);
    expect(state.systemAuditScore).toBe(100);

    // Now command succeeds and transitions to PENDING_ON
    state = deviceStateReducer(state, { type: 'LIGHT_CMD_SENT', targetState: 'ON' });
    expect(state.lightFsm).toBe('PENDING_ON');
  });

  it('should handle full Light FSM lifecycle with state confirmation', () => {
    let state: DeviceStateModel = {
      ...INITIAL_DEVICE_STATE,
      brokerConnected: true,
      esp32Online: true,
      canSendCommands: true,
    };

    // User taps Turn ON
    state = deviceStateReducer(state, { type: 'LIGHT_CMD_SENT', targetState: 'ON' });
    expect(state.lightFsm).toBe('PENDING_ON');

    // Board confirms state ON
    state = deviceStateReducer(state, { type: 'LIGHT_STATE_RECEIVED', state: 'ON' });
    expect(state.lightFsm).toBe('ON');
    expect(state.lightState).toBe('ON');

    // User taps Turn OFF
    state = deviceStateReducer(state, { type: 'LIGHT_CMD_SENT', targetState: 'OFF' });
    expect(state.lightFsm).toBe('PENDING_OFF');

    // Board confirms state OFF
    state = deviceStateReducer(state, { type: 'LIGHT_STATE_RECEIVED', state: 'OFF' });
    expect(state.lightFsm).toBe('OFF');
    expect(state.lightState).toBe('OFF');
  });

  it('should rollback Light FSM to previous confirmed state on watchdog timeout', () => {
    let state: DeviceStateModel = {
      ...INITIAL_DEVICE_STATE,
      brokerConnected: true,
      esp32Online: true,
      canSendCommands: true,
      lightState: 'OFF',
    };

    state = deviceStateReducer(state, { type: 'LIGHT_CMD_SENT', targetState: 'ON' });
    expect(state.lightFsm).toBe('PENDING_ON');

    // Watchdog times out
    state = deviceStateReducer(state, { type: 'LIGHT_ROLLBACK' });
    expect(state.lightFsm).toBe('OFF');
    expect(state.lightState).toBe('OFF');
  });

  it('should transition Door to JAMMED state on jam event and allow reset', () => {
    let state: DeviceStateModel = {
      ...INITIAL_DEVICE_STATE,
      brokerConnected: true,
      esp32Online: true,
      canSendCommands: true,
      doorState: 'CLOSED',
    };

    state = deviceStateReducer(state, { type: 'DOOR_CMD_SENT', targetState: 'OPEN' });
    expect(state.doorFsm).toBe('PENDING_OPEN');

    state = deviceStateReducer(state, { type: 'DOOR_JAMMED' });
    expect(state.doorFsm).toBe('JAMMED');

    state = deviceStateReducer(state, { type: 'DOOR_JAM_RESET' });
    expect(state.doorFsm).toBe('CLOSED');
  });

  it('should trigger Security Alert and reduce audit score on DENIED RFID scan', () => {
    let state: DeviceStateModel = {
      ...INITIAL_DEVICE_STATE,
      brokerConnected: true,
      esp32Online: true,
      canSendCommands: true,
      systemAuditScore: 100,
    };

    // Valid scan
    state = deviceStateReducer(state, {
      type: 'ACCESS_EVENT_RECEIVED',
      event: { uid: 'A1B2C3D4', result: 'GRANTED' },
    });
    expect(state.isSecurityAlert).toBe(false);
    expect(state.systemAuditScore).toBe(100);

    // Invalid scan (DENIED)
    state = deviceStateReducer(state, {
      type: 'ACCESS_EVENT_RECEIVED',
      event: { uid: '99AABBCC', result: 'DENIED' },
    });
    expect(state.isSecurityAlert).toBe(true);
    expect(state.systemAuditScore).toBe(40); // Alert penalty

    // Resolve alert
    state = deviceStateReducer(state, { type: 'RESOLVE_SECURITY_ALERT' });
    expect(state.isSecurityAlert).toBe(false);
    expect(state.systemAuditScore).toBe(100);
  });
});
