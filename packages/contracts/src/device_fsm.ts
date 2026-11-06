/**
 * Dual-Layer Finite State Machines (FSM)
 * Bảng chuyển đổi trạng thái đóng băng (Frozen Transitions) & Pure Check Functions
 */

// --- 1. BROKER CONNECTION FSM ---
export const BROKER_STATUSES = [
  "DISCONNECTED",
  "CONNECTING",
  "CONNECTED",
] as const;
export type BrokerStatus = (typeof BROKER_STATUSES)[number];

export const BROKER_TRANSITIONS: Readonly<
  Record<BrokerStatus, readonly BrokerStatus[]>
> = Object.freeze({
  DISCONNECTED: ["CONNECTING"],
  CONNECTING: ["CONNECTED", "DISCONNECTED"],
  CONNECTED: ["DISCONNECTED"],
});

export function canTransitionBroker(
  from: BrokerStatus,
  to: BrokerStatus,
): boolean {
  return BROKER_TRANSITIONS[from].includes(to);
}

// --- 2. LIGHT ACTUATOR FSM ---
export const LIGHT_FSM_STATES = [
  "OFF",
  "PENDING_ON",
  "ON",
  "PENDING_OFF",
] as const;
export type LightFsmState = (typeof LIGHT_FSM_STATES)[number];

export const LIGHT_TRANSITIONS: Readonly<
  Record<LightFsmState, readonly LightFsmState[]>
> = Object.freeze({
  OFF: ["PENDING_ON"],
  PENDING_ON: ["ON", "OFF"], // Rollback về OFF nếu Watchdog 3000ms timeout
  ON: ["PENDING_OFF"],
  PENDING_OFF: ["OFF", "ON"], // Rollback về ON nếu Watchdog 3000ms timeout
});

export function canTransitionLight(
  from: LightFsmState,
  to: LightFsmState,
): boolean {
  return LIGHT_TRANSITIONS[from].includes(to);
}

// --- 3. DOOR ACTUATOR FSM (2-Phase & Jam Guard) ---
export const DOOR_FSM_STATES = [
  "CLOSED",
  "PENDING_OPEN",
  "OPEN",
  "PENDING_CLOSE",
  "JAMMED",
] as const;
export type DoorFsmState = (typeof DOOR_FSM_STATES)[number];

export const DOOR_TRANSITIONS: Readonly<
  Record<DoorFsmState, readonly DoorFsmState[]>
> = Object.freeze({
  CLOSED: ["PENDING_OPEN"],
  PENDING_OPEN: ["OPEN", "CLOSED", "JAMMED"], // JAMMED nếu quá 4000ms không có state
  OPEN: ["PENDING_CLOSE"],
  PENDING_CLOSE: ["CLOSED", "OPEN", "JAMMED"], // JAMMED nếu quá 4000ms không có state
  JAMMED: ["CLOSED", "OPEN"], // Reset phục hồi thủ công
});

export function canTransitionDoor(
  from: DoorFsmState,
  to: DoorFsmState,
): boolean {
  return DOOR_TRANSITIONS[from].includes(to);
}
