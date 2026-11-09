import {
  LightState,
  DoorState,
  MotionState,
  LightFsmState,
  DoorFsmState,
  AccessEventPayload,
  canTransitionLight,
  canTransitionDoor,
} from '@repo/contracts';

export interface DeviceStateModel {
  brokerConnected: boolean;
  esp32Online: boolean;
  canSendCommands: boolean;

  lightState: LightState;
  doorState: DoorState;
  motionState: MotionState;

  lightFsm: LightFsmState;
  doorFsm: DoorFsmState;

  isSecurityAlert: boolean;
  lastAccessEvent: AccessEventPayload | null;
  systemAuditScore: number; // 0 - 100
}

export const INITIAL_DEVICE_STATE: DeviceStateModel = {
  brokerConnected: false,
  esp32Online: false,
  canSendCommands: false,

  lightState: 'OFF',
  doorState: 'CLOSED',
  motionState: 'CLEAR',

  lightFsm: 'OFF',
  doorFsm: 'CLOSED',

  isSecurityAlert: false,
  lastAccessEvent: null,
  systemAuditScore: 0,
};

export type DeviceAction =
  | { type: 'BROKER_STATUS_CHANGED'; connected: boolean }
  | { type: 'ESP32_ONLINE_CHANGED'; online: boolean }
  | { type: 'LIGHT_CMD_SENT'; targetState: 'ON' | 'OFF' }
  | { type: 'LIGHT_STATE_RECEIVED'; state: LightState }
  | { type: 'LIGHT_ROLLBACK' }
  | { type: 'DOOR_CMD_SENT'; targetState: 'OPEN' | 'CLOSE' }
  | { type: 'DOOR_STATE_RECEIVED'; state: DoorState }
  | { type: 'DOOR_JAMMED' }
  | { type: 'DOOR_JAM_RESET' }
  | { type: 'MOTION_STATE_RECEIVED'; state: MotionState }
  | { type: 'ACCESS_EVENT_RECEIVED'; event: AccessEventPayload }
  | { type: 'RESOLVE_SECURITY_ALERT' };

export function deviceStateReducer(
  state: DeviceStateModel,
  action: DeviceAction
): DeviceStateModel {
  switch (action.type) {
    case 'BROKER_STATUS_CHANGED': {
      const brokerConnected = action.connected;
      const canSend = brokerConnected && state.esp32Online;
      return {
        ...state,
        brokerConnected,
        canSendCommands: canSend,
        systemAuditScore: calculateAuditScore(
          brokerConnected,
          state.esp32Online,
          state.isSecurityAlert
        ),
      };
    }

    case 'ESP32_ONLINE_CHANGED': {
      const esp32Online = action.online;
      const canSend = state.brokerConnected && esp32Online;
      return {
        ...state,
        esp32Online,
        canSendCommands: canSend,
        systemAuditScore: calculateAuditScore(
          state.brokerConnected,
          esp32Online,
          state.isSecurityAlert
        ),
      };
    }

    case 'LIGHT_CMD_SENT': {
      if (!state.canSendCommands) return state; // Device Guard
      const nextFsm: LightFsmState = action.targetState === 'ON' ? 'PENDING_ON' : 'PENDING_OFF';
      if (!canTransitionLight(state.lightFsm, nextFsm)) return state;
      return { ...state, lightFsm: nextFsm };
    }

    case 'LIGHT_STATE_RECEIVED': {
      const nextFsm: LightFsmState = action.state === 'ON' ? 'ON' : 'OFF';
      return { ...state, lightState: action.state, lightFsm: nextFsm };
    }

    case 'LIGHT_ROLLBACK': {
      // Rollback to last verified state
      const rollbackFsm: LightFsmState = state.lightState === 'ON' ? 'ON' : 'OFF';
      return { ...state, lightFsm: rollbackFsm };
    }

    case 'DOOR_CMD_SENT': {
      if (!state.canSendCommands) return state; // Device Guard
      const nextFsm: DoorFsmState =
        action.targetState === 'OPEN' ? 'PENDING_OPEN' : 'PENDING_CLOSE';
      if (!canTransitionDoor(state.doorFsm, nextFsm)) return state;
      return { ...state, doorFsm: nextFsm };
    }

    case 'DOOR_STATE_RECEIVED': {
      const nextFsm: DoorFsmState = action.state === 'OPEN' ? 'OPEN' : 'CLOSED';
      return { ...state, doorState: action.state, doorFsm: nextFsm };
    }

    case 'DOOR_JAMMED': {
      return { ...state, doorFsm: 'JAMMED' };
    }

    case 'DOOR_JAM_RESET': {
      const resetFsm: DoorFsmState = state.doorState === 'OPEN' ? 'OPEN' : 'CLOSED';
      return { ...state, doorFsm: resetFsm };
    }

    case 'MOTION_STATE_RECEIVED': {
      return { ...state, motionState: action.state };
    }

    case 'ACCESS_EVENT_RECEIVED': {
      const isDenied = action.event.result === 'DENIED';
      const isAlert = state.isSecurityAlert || isDenied;
      return {
        ...state,
        lastAccessEvent: action.event,
        isSecurityAlert: isAlert,
        systemAuditScore: calculateAuditScore(state.brokerConnected, state.esp32Online, isAlert),
      };
    }

    case 'RESOLVE_SECURITY_ALERT': {
      return {
        ...state,
        isSecurityAlert: false,
        systemAuditScore: calculateAuditScore(state.brokerConnected, state.esp32Online, false),
      };
    }

    default:
      return state;
  }
}

function calculateAuditScore(broker: boolean, esp32: boolean, alert: boolean): number {
  if (!broker || !esp32) return 0;
  if (alert) return 40;
  return 100;
}
