/**
 * MQTT Topics & Payloads SSOT v1.0.0
 * Định nghĩa chuẩn hóa tuân thủ nghiêm ngặt theo docs/mqtt-contract.json
 */

export const MQTT_TOPICS = {
  CMD_LIGHT: "smarthome/cmd/light",
  CMD_DOOR: "smarthome/cmd/door",
  STATE_LIGHT: "smarthome/state/light",
  STATE_DOOR: "smarthome/state/door",
  STATE_MOTION: "smarthome/state/motion",
  STATE_ONLINE: "smarthome/state/online",
  EVENT_ACCESS: "smarthome/event/access",
} as const;

export type MqttTopic = (typeof MQTT_TOPICS)[keyof typeof MQTT_TOPICS];

// Commands (App -> ESP32)
export const LIGHT_COMMANDS = ["ON", "OFF"] as const;
export type LightCommand = (typeof LIGHT_COMMANDS)[number];

export const DOOR_COMMANDS = ["OPEN", "CLOSE"] as const;
export type DoorCommand = (typeof DOOR_COMMANDS)[number];

// States (ESP32 -> App, Retained)
export const LIGHT_STATES = ["ON", "OFF"] as const;
export type LightState = (typeof LIGHT_STATES)[number];

export const DOOR_STATES = ["OPEN", "CLOSED"] as const;
export type DoorState = (typeof DOOR_STATES)[number];

export const MOTION_STATES = ["DETECTED", "CLEAR"] as const;
export type MotionState = (typeof MOTION_STATES)[number];

export const SYSTEM_ONLINE_STATES = ["ONLINE", "OFFLINE"] as const;
export type SystemOnlineState = (typeof SYSTEM_ONLINE_STATES)[number];

// Events (ESP32 -> App, Non-retained JSON)
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
  RING_BUFFER_MAX_SIZE: 50,
} as const;
