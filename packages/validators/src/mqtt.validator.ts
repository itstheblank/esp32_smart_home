import { z } from "zod";
import {
  LIGHT_COMMANDS,
  LIGHT_STATES,
  DOOR_COMMANDS,
  DOOR_STATES,
  MOTION_STATES,
  SYSTEM_ONLINE_STATES,
  ACCESS_RESULTS,
} from "@repo/contracts";

// --- COMMAND VALIDATORS ---
export const LightCommandSchema = z.enum(LIGHT_COMMANDS);
export type LightCommandInput = z.infer<typeof LightCommandSchema>;

export const DoorCommandSchema = z.enum(DOOR_COMMANDS);
export type DoorCommandInput = z.infer<typeof DoorCommandSchema>;

// --- STATE VALIDATORS ---
export const LightStateSchema = z.enum(LIGHT_STATES);
export type LightStateOutput = z.infer<typeof LightStateSchema>;

export const DoorStateSchema = z.enum(DOOR_STATES);
export type DoorStateOutput = z.infer<typeof DoorStateSchema>;

export const MotionStateSchema = z.enum(MOTION_STATES);
export type MotionStateOutput = z.infer<typeof MotionStateSchema>;

export const SystemOnlineStateSchema = z.enum(SYSTEM_ONLINE_STATES);
export type SystemOnlineStateOutput = z.infer<typeof SystemOnlineStateSchema>;

// --- EVENT VALIDATORS (RFID ACCESS) ---
/**
 * Thẩm định định dạng sự kiện quẹt thẻ RFID
 * - UID: 8 ký tự Hex (chữ hoa hoặc chữ thường, không khoảng trắng)
 * - Result: GRANTED | DENIED
 */
export const AccessEventSchema = z.object({
  uid: z
    .string()
    .trim()
    .regex(
      /^[0-9A-Fa-f]{8}$/,
      "Mã thẻ UID phải là chuỗi Hex 8 ký tự (vd: A1B2C3D4)",
    ),
  result: z.enum(ACCESS_RESULTS),
});
export type AccessEventInput = z.infer<typeof AccessEventSchema>;

/**
 * Thẩm định payload JSON an toàn từ MQTT, fail-closed
 */
export function parseAccessEventPayload(raw: string): {
  success: boolean;
  data?: AccessEventInput;
  error?: string;
} {
  try {
    const json = JSON.parse(raw);
    const parsed = AccessEventSchema.safeParse(json);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }
    return { success: true, data: parsed.data };
  } catch (_e) {
    return {
      success: false,
      error: "Nội dung gói tin không phải định dạng JSON hợp lệ",
    };
  }
}
