import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  MQTT_TOPICS,
  LIGHT_COMMANDS,
  LIGHT_STATES,
  DOOR_COMMANDS,
  DOOR_STATES,
  canTransitionLight,
  canTransitionDoor,
} from "./index";

describe("Contracts SSOT Validation", () => {
  const contractPath = path.resolve(
    __dirname,
    "../../../docs/mqtt-contract.json",
  );

  it("should match all topics defined in docs/mqtt-contract.json", () => {
    expect(fs.existsSync(contractPath)).toBe(true);
    const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    const docTopics = contract.topics.map((t: { topic: string }) => t.topic);

    expect(docTopics).toContain(MQTT_TOPICS.CMD_LIGHT);
    expect(docTopics).toContain(MQTT_TOPICS.CMD_DOOR);
    expect(docTopics).toContain(MQTT_TOPICS.STATE_LIGHT);
    expect(docTopics).toContain(MQTT_TOPICS.STATE_DOOR);
    expect(docTopics).toContain(MQTT_TOPICS.STATE_MOTION);
    expect(docTopics).toContain(MQTT_TOPICS.STATE_ONLINE);
    expect(docTopics).toContain(MQTT_TOPICS.EVENT_ACCESS);
  });

  it("should enforce command CLOSE vs state CLOSED", () => {
    expect(DOOR_COMMANDS).toContain("CLOSE");
    expect(DOOR_COMMANDS).not.toContain("CLOSED");

    expect(DOOR_STATES).toContain("CLOSED");
    expect(DOOR_STATES).not.toContain("CLOSE");
  });

  it("should validate Light FSM transitions", () => {
    expect(canTransitionLight("OFF", "PENDING_ON")).toBe(true);
    expect(canTransitionLight("PENDING_ON", "ON")).toBe(true);
    expect(canTransitionLight("PENDING_ON", "OFF")).toBe(true); // Rollback
    expect(canTransitionLight("OFF", "ON")).toBe(false); // Must go through PENDING
  });

  it("should validate Door FSM transitions and Jammed state", () => {
    expect(canTransitionDoor("CLOSED", "PENDING_OPEN")).toBe(true);
    expect(canTransitionDoor("PENDING_OPEN", "JAMMED")).toBe(true);
    expect(canTransitionDoor("JAMMED", "CLOSED")).toBe(true);
    expect(canTransitionDoor("CLOSED", "OPEN")).toBe(false);
  });
});
