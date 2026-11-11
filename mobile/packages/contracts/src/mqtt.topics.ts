/**
 * MQTT Topics & Payloads SSOT v2.0.0
 * Đồng bộ với firmware checkpoint 1 (member3/hardware-integration):
 *   - docs/contracts/mqtt-contract.md   (đặc tả)
 *   - docs/contracts/mqtt-contract.json (bản máy đọc, dùng cho test/CI)
 *
 * App -> ESP32 : JSON {device,id,action,data}          trên `smarthome/cmd`
 * ESP32 -> App : JSON {device,id,action,success,data}  trên `smarthome/logs`
 */

export const MQTT_CONTRACT_VERSION = "2.0.0";

export const MQTT_TOPICS = {
  CMD: "smarthome/cmd",
  LOGS: "smarthome/logs",
} as const;

export type MqttTopic = (typeof MQTT_TOPICS)[keyof typeof MQTT_TOPICS];

/**
 * @deprecated Contract v1.0.0 (topic riêng cho từng thiết bị). Firmware
 * checkpoint 1 không còn publish/subscribe các topic này — chỉ giữ để tham khảo.
 */
export const LEGACY_MQTT_TOPICS_V1 = {
  CMD_LIGHT: "smarthome/cmd/light",
  CMD_DOOR: "smarthome/cmd/door",
  STATE_LIGHT: "smarthome/state/light",
  STATE_DOOR: "smarthome/state/door",
  STATE_MOTION: "smarthome/state/motion",
  STATE_ONLINE: "smarthome/state/online",
  EVENT_ACCESS: "smarthome/event/access",
} as const;

// Device identifiers used in the JSON `device` field
export const MQTT_DEVICES = [
  "LIGHT",
  "DOOR",
  "MOTION_SENSOR",
  "RFID_READER",
  "SYSTEM",
  "UNKNOWN",
] as const;
export type MqttDevice = (typeof MQTT_DEVICES)[number];

export const COMMANDABLE_DEVICES = ["LIGHT", "DOOR"] as const;
export type CommandableDevice = (typeof COMMANDABLE_DEVICES)[number];

// Hardware instance ids wired in src/main.cpp (SYSTEM always uses 0)
export const DEFAULT_DEVICE_IDS = {
  LIGHT: 1,
  DOOR: 1,
  MOTION_SENSOR: 1,
  RFID_READER: 1,
  SYSTEM: 0,
} as const;

// Log actions emitted by firmware (in addition to the command words below)
export const MOTION_LOG_ACTIONS = ["MOTION_DETECTED", "MOTION_CLEAR"] as const;
export const RFID_LOG_ACTIONS = ["RFID_TAG_DETECTED"] as const;
export const SYSTEM_LOG_ACTIONS = ["ONLINE", "OFFLINE"] as const;

/** JSON command published by the app to `smarthome/cmd` (retain = false). */
export interface MqttCommandPayload {
  device: CommandableDevice;
  id: number;
  action: string;
  data: Record<string, unknown>;
}

/** JSON log published by the ESP32 to `smarthome/logs` (retain = false). */
export interface MqttLogPayload {
  device: string;
  id: number;
  action: string;
  success: boolean;
  data: Record<string, unknown>;
}

// Commands (App -> ESP32)
export const LIGHT_COMMANDS = ["ON", "OFF"] as const;
export type LightCommand = (typeof LIGHT_COMMANDS)[number];

export const DOOR_COMMANDS = ["OPEN", "CLOSE"] as const;
export type DoorCommand = (typeof DOOR_COMMANDS)[number];

// UI states (derived from `smarthome/logs`)
export const LIGHT_STATES = ["ON", "OFF"] as const;
export type LightState = (typeof LIGHT_STATES)[number];

export const DOOR_STATES = ["OPEN", "CLOSED"] as const;
export type DoorState = (typeof DOOR_STATES)[number];

export const MOTION_STATES = ["DETECTED", "CLEAR"] as const;
export type MotionState = (typeof MOTION_STATES)[number];

export const SYSTEM_ONLINE_STATES = ["ONLINE", "OFFLINE"] as const;
export type SystemOnlineState = (typeof SYSTEM_ONLINE_STATES)[number];

// RFID access events (derived from RFID_READER logs)
export const ACCESS_RESULTS = ["GRANTED", "DENIED"] as const;
export type AccessResult = (typeof ACCESS_RESULTS)[number];

export interface AccessEventPayload {
  uid: string;
  result: AccessResult;
}

// Watchdog & Timeout configurations
export const ASYNC_CONFIG = {
  WATCHDOG_LIGHT_MS: 3000,
  WATCHDOG_DOOR_MS: 4000,
  RFID_DEBOUNCE_MS: 1500,
  PIR_COOLDOWN_MS: 5000,
  MQTT_KEEP_ALIVE_SEC: 30,
  MAX_LOG_PAYLOAD_BYTES: 192,
  RING_BUFFER_MAX_SIZE: 50,
} as const;
