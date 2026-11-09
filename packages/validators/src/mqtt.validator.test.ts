import { describe, it, expect } from "vitest";
import {
  LightCommandSchema,
  DoorCommandSchema,
  AccessEventSchema,
  parseAccessEventPayload,
} from "./index";

describe("MQTT Validators & Wire Boundary Parsing", () => {
  it("should validate valid Light commands and reject invalid ones", () => {
    expect(LightCommandSchema.safeParse("ON").success).toBe(true);
    expect(LightCommandSchema.safeParse("OFF").success).toBe(true);
    expect(LightCommandSchema.safeParse("on").success).toBe(false); // Case sensitive!
    expect(LightCommandSchema.safeParse("ON\n").success).toBe(false); // No trailing newline!
    expect(LightCommandSchema.safeParse("TOGGLE").success).toBe(false);
  });

  it("should validate valid Door commands and strictly enforce CLOSE", () => {
    expect(DoorCommandSchema.safeParse("OPEN").success).toBe(true);
    expect(DoorCommandSchema.safeParse("CLOSE").success).toBe(true);
    expect(DoorCommandSchema.safeParse("CLOSED").success).toBe(false); // CLOSED is state, not command!
  });

  it("should parse valid RFID access events", () => {
    const raw = JSON.stringify({ uid: "A1B2C3D4", result: "GRANTED" });
    const result = parseAccessEventPayload(raw);
    expect(result.success).toBe(true);
    expect(result.data?.uid).toBe("A1B2C3D4");
    expect(result.data?.result).toBe("GRANTED");
  });

  it("should reject invalid RFID access events (invalid UID or unknown result)", () => {
    // UID not 8 hex chars
    const raw1 = JSON.stringify({ uid: "123", result: "GRANTED" });
    expect(parseAccessEventPayload(raw1).success).toBe(false);

    // Invalid result
    const raw2 = JSON.stringify({ uid: "A1B2C3D4", result: "UNKNOWN" });
    expect(parseAccessEventPayload(raw2).success).toBe(false);

    // Malformed JSON
    expect(parseAccessEventPayload("not a json").success).toBe(false);
  });
});
