/**
 * MQTT Log Adapter — contract v2.0.0 (docs/contracts/mqtt-contract.md)
 *
 * Cầu nối giữa firmware checkpoint 1 và state machine của app:
 *   - buildCommandPayload(): tạo JSON lệnh gửi lên `smarthome/cmd`
 *   - parseLogPayload():     kiểm tra (fail-closed) JSON nhận từ `smarthome/logs`
 *   - mapLogToActions():     chuyển 1 log thành các DeviceAction cho reducer
 *
 * Module thuần (chỉ import type) để test được không cần React/MQTT.
 */
import type {
  LightState,
  DoorState,
  MotionState,
  AccessEventPayload,
  CommandableDevice,
  MqttCommandPayload,
  MqttLogPayload,
} from '@repo/contracts';

export type LogDerivedAction =
  | { type: 'ESP32_ONLINE_CHANGED'; online: boolean }
  | { type: 'LIGHT_STATE_RECEIVED'; state: LightState }
  | { type: 'LIGHT_ROLLBACK' }
  | { type: 'DOOR_STATE_RECEIVED'; state: DoorState }
  | { type: 'DOOR_JAM_RESET' }
  | { type: 'MOTION_STATE_RECEIVED'; state: MotionState }
  | { type: 'ACCESS_EVENT_RECEIVED'; event: AccessEventPayload };

const UID_HEX_REGEX = /^[0-9A-Fa-f]{2,16}$/;

/** JSON command for `smarthome/cmd`, e.g. {"device":"LIGHT","id":1,"action":"ON","data":{}} */
export function buildCommandPayload(
  device: CommandableDevice,
  action: string,
  id = 1,
  data: Record<string, unknown> = {}
): string {
  const payload: MqttCommandPayload = { device, id, action, data };
  return JSON.stringify(payload);
}

/** Parse + validate a `smarthome/logs` message. Returns null for anything off-contract. */
export function parseLogPayload(raw: string): MqttLogPayload | null {
  let json: any;
  try {
    json = JSON.parse(raw);
  } catch (_e) {
    return null;
  }
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  if (typeof json.device !== 'string' || json.device.length === 0) return null;
  if (typeof json.action !== 'string') return null;
  if (!Number.isInteger(json.id) || json.id < 0) return null;
  if (typeof json.success !== 'boolean') return null;

  const data =
    json.data && typeof json.data === 'object' && !Array.isArray(json.data) ? json.data : {};

  return {
    device: json.device,
    id: json.id,
    action: json.action,
    success: json.success,
    data,
  };
}

/** Translate one firmware log into reducer actions (may be empty for unknown logs). */
export function mapLogToActions(log: MqttLogPayload): LogDerivedAction[] {
  if (log.device === 'SYSTEM') {
    if (log.action === 'ONLINE') return [{ type: 'ESP32_ONLINE_CHANGED', online: true }];
    if (log.action === 'OFFLINE') return [{ type: 'ESP32_ONLINE_CHANGED', online: false }];
    return [];
  }

  // `ONLINE` is not retained: any device log proves the ESP32 is alive, so an
  // app that connects after the board booted still unlocks its controls.
  const actions: LogDerivedAction[] = [];
  const known = ['LIGHT', 'DOOR', 'MOTION_SENSOR', 'RFID_READER'].includes(log.device);
  if (known) actions.push({ type: 'ESP32_ONLINE_CHANGED', online: true });

  switch (log.device) {
    case 'LIGHT':
      if (!log.success) {
        actions.push({ type: 'LIGHT_ROLLBACK' });
      } else if (log.action === 'ON' || log.action === 'OFF') {
        actions.push({ type: 'LIGHT_STATE_RECEIVED', state: log.action });
      }
      break;

    case 'DOOR':
      if (!log.success) {
        actions.push({ type: 'DOOR_JAM_RESET' }); // command rejected -> back to verified state
      } else if (log.action === 'OPEN') {
        actions.push({ type: 'DOOR_STATE_RECEIVED', state: 'OPEN' });
      } else if (log.action === 'CLOSE' || log.action === 'CLOSED') {
        actions.push({ type: 'DOOR_STATE_RECEIVED', state: 'CLOSED' });
      }
      break;

    case 'MOTION_SENSOR':
      if (log.action === 'MOTION_DETECTED') {
        actions.push({ type: 'MOTION_STATE_RECEIVED', state: 'DETECTED' });
      } else if (log.action === 'MOTION_CLEAR') {
        actions.push({ type: 'MOTION_STATE_RECEIVED', state: 'CLEAR' });
      }
      break;

    case 'RFID_READER': {
      const tagId = typeof log.data.tagId === 'string' ? log.data.tagId.trim() : '';
      if (log.action === 'RFID_TAG_DETECTED' && UID_HEX_REGEX.test(tagId)) {
        actions.push({
          type: 'ACCESS_EVENT_RECEIVED',
          event: { uid: tagId.toUpperCase(), result: log.success ? 'GRANTED' : 'DENIED' },
        });
      }
      break;
    }

    default:
      break;
  }
  return actions;
}
